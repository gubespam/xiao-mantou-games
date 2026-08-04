import React, { useState } from 'react';

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
    // TODO for each line, return line.indentLevel tabs followed by line.text
    //      join whole list by newlines
    return lines.map(line => '\t'.repeat(line.indentLevel) + line.text).join('\n');
}

// take flat list of items with indentation levels and convert to a nested structure of parent/child
function nestify(lines){
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

function TextLine({ index, text, indentLevel, onChangeText, onIndent, onOutdent }) {

    // catch tab character and indent/outdent the line instead of inserting a tab character
    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                onOutdent(index);
            } else {
                onIndent(index);
            }
        }
    }
    const handleChange = (e) => {
        const newText = e.target.value;
        onChangeText(newText);
    };

    return (
        <textarea value={text} onChange={handleChange} onKeyDown={handleKeyDown} />
    );
}

function FileEditText({ fileContent = "food\n\tfruit\n\t\tapple\n\t\tbanana\n\tveggie", onChange = () => {} }) {
    // raw text file content -> split into lines with indentation levels -> nested structure of items
    const nestedItems = nestify(parseText(fileContent));
    console.log("nestedItems", nestedItems);

    const [nodes, setNodes] = React.useState(nestedItems);

    const handleChange = (e) => {
        const newText = e.target.value;
        setText(newText);
        onChange(newText);
    };

    function listItem({ node, index }) {
        if(node?.children?.length > 0){
           return (<li key={index}>
                {node.text}
                {listContainer({ nodes: node.children, index })}
            </li>)
        } else {   
            console.log("node", node);
            return (<li key={index}>
                {node.text}
            </li>)
        }
    }

    function listContainer({ nodes, index }) {
        return (
            <ul key={index}>
                {nodes.map((node, index) => listItem({ node, index }))}
            </ul>
        );
    }

    return (
        <div className="file-edit-text">
            {listContainer({ nodes, index: 0 })}
            {/* {lines.map((line, index) => (
                <TextLine key={index} index={index} text={line} onChangeText={(newText) => {
                    const newLines = [...lines];
                    newLines[index] = { ...line, text: newText };
                    setLines(newLines);
                    onChange(newLines);
                }}  />
            ))} */}
        </div>
    );
}

export default FileEditText;