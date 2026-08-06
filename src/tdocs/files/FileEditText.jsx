import React from 'react';
import './FileEditText.css';

// Takes file content and splits it into indented lines
function parseText(text) {
    return text.split('\n').map(line => {
        const indentLevel = line.match(/^\t*/)[0].length;
        const text = line.trim();
        return { indentLevel, text };
    });
}

// Takes a list of line elements and compiles to the text stored in the file
function compileText(lines) {
    return lines.map(line => '\t'.repeat(line.indentLevel) + line.text).join('\n');
}

function flattenTree(nodes, flat = []) {
    nodes.forEach(node => {
        flat.push({ text: node.text, indentLevel: node.indentLevel });
        if (node.children?.length > 0) {
            flattenTree(node.children, flat);
        }
    });

    return flat;
}

// take flat list of items with indentation levels and convert to a nested structure of parent/child
function nestify(lines) {
    // each input item has:
    // - text
    // - indentLevel
    const root = { text: null, indentLevel: -1, children: [] };
    const stack = [root];

    for (const line of lines) {
        const item = { ...line, children: [] };

        while (stack.length > 0 && stack[stack.length - 1].indentLevel >= item.indentLevel) {
            stack.pop();
        }

        stack[stack.length - 1].children.push(item);
        stack.push(item);
    }

    return root.children;
}

function TextLine({ text, indentLevel, onChangeText, onIndent, onOutdent }) {
    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                onOutdent();
            } else {
                onIndent();
            }
        }
    };

    const handleChange = (e) => {
        onChangeText(e.target.value);
    };

    return (
        <textarea
            className="file-edit-text-area"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            data-indent={indentLevel}
        />
    );
}

function getNodeAtPath(nodes, path) {
    return path.reduce((currentNodes, index) => currentNodes[index], nodes);
}

function removeNodeAtPath(nodes, path) {
    if (path.length === 1) {
        const [index] = path;
        const [removedNode] = nodes.slice(index, index + 1);
        return {
            nodes: nodes.filter((_, nodeIndex) => nodeIndex !== index),
            node: removedNode,
        };
    }

    const [index, ...rest] = path;
    const nextChildResult = removeNodeAtPath(nodes[index].children ?? [], rest);

    return {
        nodes: nodes.map((node, nodeIndex) => {
            if (nodeIndex !== index) {
                return node;
            }

            return {
                ...node,
                children: nextChildResult.nodes,
            };
        }),
        node: nextChildResult.node,
    };
}

function insertNodeAtPath(nodes, path, insertionIndex, nodeToInsert) {
    if (path.length === 0) {
        return [
            ...nodes.slice(0, insertionIndex),
            nodeToInsert,
            ...nodes.slice(insertionIndex),
        ];
    }

    const [index, ...rest] = path;

    return nodes.map((node, nodeIndex) => {
        if (nodeIndex !== index) {
            return node;
        }

        return {
            ...node,
            children: insertNodeAtPath(node.children ?? [], rest, insertionIndex, nodeToInsert),
        };
    });
}

function updateNodeAtPath(nodes, path, updater) {
    return nodes.map((node, index) => {
        if (index !== path[0]) {
            return node;
        }

        if (path.length === 1) {
            return updater({ ...node });
        }

        return {
            ...node,
            children: updateNodeAtPath(node.children ?? [], path.slice(1), updater),
        };
    });
}

function FileEditText({ fileContent = "food\n\tfruit\n\t\tapple\n\t\tbanana\n\tveggie", onChange = () => {} }) {
    const [nodes, setNodes] = React.useState(() => nestify(parseText(fileContent)));

    const emitNodeChange = (nextNodes) => {
        const compiledText = compileText(flattenTree(nextNodes));
        onChange(compiledText);
    };

    const handleChangeText = (path, newText) => {
        const nextNodes = updateNodeAtPath(nodes, path, node => ({ ...node, text: newText }));
        setNodes(nextNodes);
        emitNodeChange(nextNodes);
    };

    const handleIndent = (path) => {
        const currentPath = [...path];
        const currentIndex = currentPath[currentPath.length - 1];
        const parentPath = currentPath.slice(0, -1);

        if (currentIndex <= 0) {
            return;
        }

        const priorSiblingPath = [...parentPath, currentIndex - 1];
        const priorSibling = getNodeAtPath(nodes, priorSiblingPath);
        const { nodes: nextNodesWithoutCurrent, node: currentNode } = removeNodeAtPath(nodes, currentPath);
        const nextNodes = insertNodeAtPath(
            nextNodesWithoutCurrent,
            priorSiblingPath,
            priorSibling.children?.length ?? 0,
            {
                ...currentNode,
                indentLevel: priorSibling.indentLevel + 1,
            },
        );

        setNodes(nextNodes);
        emitNodeChange(nextNodes);
    };

    const handleOutdent = (path) => {
        const currentPath = [...path];
        const parentPath = currentPath.slice(0, -1);

        if (parentPath.length === 0) {
            return;
        }

        const parentIndex = parentPath[parentPath.length - 1];
        const { nodes: nextNodesWithoutCurrent, node: currentNode } = removeNodeAtPath(nodes, currentPath);
        const nextNodes = insertNodeAtPath(
            nextNodesWithoutCurrent,
            parentPath.slice(0, -1),
            parentIndex + 1,
            {
                ...currentNode,
                indentLevel: Math.max(0, currentNode.indentLevel - 1),
            },
        );

        setNodes(nextNodes);
        emitNodeChange(nextNodes);
    };

    function listItem({ node, path }) {
        const currentPath = [...path, node.index];

        return (
            <li key={currentPath.join('-')}>
                <TextLine
                    text={node.text}
                    indentLevel={node.indentLevel}
                    onChangeText={(newText) => handleChangeText(currentPath, newText)}
                    onIndent={() => handleIndent(currentPath)}
                    onOutdent={() => handleOutdent(currentPath)}
                />
                {node.children?.length > 0 && listContainer({ nodes: node.children, path: currentPath })}
            </li>
        );
    }

    function listContainer({ nodes, path = [] }) {
        return (
            <ul>
                {nodes.map((node, index) => listItem({ node: { ...node, index }, path }))}
            </ul>
        );
    }

    return (
        <div className="file-edit-text">
            {listContainer({ nodes, path: [] })}
        </div>
    );
}

export default FileEditText;