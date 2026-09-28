# File Editor

## Open a file

Select a file in Files to open it in the Edit File tab. The editor header shows
the file's path. The tab can also be opened without a selected file; in that
case it prompts you to choose one from Files. Closing the editor clears the
selection and shows that prompt. Selecting another file opens that file in the
editor.

## Edit the outline

File content is displayed as one editable line per item. Leading tab characters
in the saved text set the item's nesting level; each line's text is edited in
its own text field. The editor preserves this tab-indented text format when it
writes changes back to the file.

- **Enter** splits the current line at the cursor. The new line keeps the
	current line's indentation.
- **Backspace** at the start of a line joins its text to the previous line,
	retaining the previous line's indentation.
- **Delete** at the end of a line joins the next line's text to it, retaining
	the current line's indentation.
- **Tab** indents the current line, but not beyond one level deeper than the
	previous line. The first line cannot be indented.
- **Shift+Tab** outdents the current line, stopping at the root level.

Text edits and these keyboard operations are written back to the file as they
happen. The file is stored with the rest of TDocs' data in the current
browser's local storage.