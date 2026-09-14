import React from 'react';
import './FileEditText.css';

// Takes file content and splits it into indented lines
function parseText(text) {
    return text.split('\n').map((line, index) => {
        const indentLevel = index === 0 ? 0 : line.match(/^\t*/)[0].length;
        return { indentLevel, text: line.slice(indentLevel) };
    });
}

// Takes a list of line elements and compiles to the text stored in the file
function compileText(lines) {
    return lines.map(line => '\t'.repeat(line.indentLevel) + line.text).join('\n');
}

// take flat list of items with indentation levels and convert to a nested structure of parent/child
function nestify(lines) {
    // each input item has:
    // - text
    // - indentLevel
    const root = { text: null, indentLevel: -1, children: [] };
    const stack = [root];

    lines.forEach((line, lineIndex) => {
        const item = { ...line, lineIndex, children: [] };

        while (stack.length > 0 && stack[stack.length - 1].indentLevel >= item.indentLevel) {
            stack.pop();
        }

        stack[stack.length - 1].children.push(item);
        stack.push(item);
    });

    return root.children;
}

function TextLine({ text, indentLevel, onChangeText, onKeyDown, textAreaRef }) {
    const handleKeyDown = (e) => {
        onKeyDown(e);
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
            ref={textAreaRef}
            data-indent={indentLevel}
        />
    );
}

function FileEditText({ fileContent = "food\n\tfruit\n\t\tapple\n\t\tbanana\n\tveggie", onChange = () => {} }) {
    const [lines, setLines] = React.useState(() => parseText(fileContent));
    const textAreaRefs = React.useRef([]);

    const emitLinesChange = (nextLines) => {
        const compiledText = compileText(nextLines);
        onChange(compiledText);
    };

    const applyLineChange = (nextLines, focusIndex, cursorPosition) => {
        setLines(nextLines);
        emitLinesChange(nextLines);
        requestAnimationFrame(() => {
            const textArea = textAreaRefs.current[focusIndex];
            textArea?.focus();
            textArea?.setSelectionRange(cursorPosition, cursorPosition);
        });
    };

    const handleChangeText = (lineIndex, newText) => {
        const nextLines = lines.map((line, index) => index === lineIndex ? { ...line, text: newText } : line);
        setLines(nextLines);
        emitLinesChange(nextLines);
    };

    const handleKeyDown = (lineIndex, e) => {
        const currentLine = lines[lineIndex];
        const cursorStart = e.target.selectionStart;
        const cursorEnd = e.target.selectionEnd;

        if (e.key === 'Tab') {
            e.preventDefault();
            if (lineIndex === 0) {
                return;
            }

            const nextIndentLevel = e.shiftKey
                ? Math.max(0, currentLine.indentLevel - 1)
                : Math.min(currentLine.indentLevel + 1, lines[lineIndex - 1].indentLevel + 1);
            if (nextIndentLevel === currentLine.indentLevel) {
                return;
            }

            const nextLines = lines.map((line, index) => index === lineIndex
                ? { ...line, indentLevel: nextIndentLevel }
                : line);
            setLines(nextLines);
            emitLinesChange(nextLines);
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const beforeText = currentLine.text.slice(0, cursorStart);
            const afterText = currentLine.text.slice(cursorEnd);
            const nextLines = [
                ...lines.slice(0, lineIndex),
                { ...currentLine, text: beforeText },
                { indentLevel: currentLine.indentLevel, text: afterText },
                ...lines.slice(lineIndex + 1),
            ];
            applyLineChange(nextLines, lineIndex + 1, 0);
            return;
        }

        if (e.key === 'Backspace' && cursorStart === 0 && cursorEnd === 0 && lineIndex > 0) {
            e.preventDefault();
            const previousLine = lines[lineIndex - 1];
            const nextLines = [
                ...lines.slice(0, lineIndex - 1),
                { ...previousLine, text: previousLine.text + currentLine.text },
                ...lines.slice(lineIndex + 1),
            ];
            applyLineChange(nextLines, lineIndex - 1, previousLine.text.length);
            return;
        }

        if (e.key === 'Delete' && cursorStart === currentLine.text.length && cursorEnd === cursorStart && lineIndex < lines.length - 1) {
            e.preventDefault();
            const nextLine = lines[lineIndex + 1];
            const nextLines = [
                ...lines.slice(0, lineIndex),
                { ...currentLine, text: currentLine.text + nextLine.text },
                ...lines.slice(lineIndex + 2),
            ];
            applyLineChange(nextLines, lineIndex, currentLine.text.length);
        }
    };

    function listItem({ node, path }) {
        return (
            <li key={node.lineIndex}>
                <TextLine
                    text={node.text}
                    indentLevel={node.indentLevel}
                    onChangeText={(newText) => handleChangeText(node.lineIndex, newText)}
                    onKeyDown={(event) => handleKeyDown(node.lineIndex, event)}
                    textAreaRef={(element) => { textAreaRefs.current[node.lineIndex] = element; }}
                />
                {node.children?.length > 0 && listContainer({ nodes: node.children, path })}
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
            {listContainer({ nodes: nestify(lines), path: [] })}
        </div>
    );
}

export default FileEditText;