This is the how the file editor is supposed to work:

# Interface and Data
The fileContent input prop supplies a string of text, whose lines are newline-delimited and whose lines start with zero or more tab characters.

Internally, the text is split into an array of lines. Each line is an object like:
```
{
    text: 'line text without leading tabs',
    indent: {number of leading tabs}
}
```

If it makes the implementation simpler, this can then be converted into a hierarchical set of nodes.

# Rendering
The text rendered on the screen should be a set of nested unnumbered lists, where each level of nesting corresponds to the number of leading tab characters. An indent of zero means the first level of bullet point (<li> child of top-level <ul>).

# Creating New Lines
When the user presses Enter at the end of the a line, it should add a new blank line with the same level of indent as the line the cursor was previously on.

When the user presses Enter in the middle of a line, then the line is split at that point, so that the current line text is truncated at that point and a new line is created at the same indent level, just after the current line. The new line has the text after the position of the cursor.

# Changing the indent level using Tab
If the current line is the first line, the indent must remain fixed at zero. Otherwise, see below.

When the user presses the Tab character, the indent level of the current line indent increases. The indent level cannot go higher than 1 more than the line before the current line. If the current line is a sibling of other lines (lines before or after with the same indent level), this does not affect the indent level of those sibling lines.

When the user presses Shift + Tab key, the indent level of the current line decreases. The indent level cannot go below zero. If the current line is a sibling of other lines (lines before or after with the same indent level), this does not affect the indent level of those sibling lines.

# Removing lines
Pressing backspace at the beginning of a line merges the current line with the line before if, if the current line is not the first line. The indentation level is not changed.

Pressing delete at the end of a line merged the line after the current line, with the current line. The indentation level is not changed.