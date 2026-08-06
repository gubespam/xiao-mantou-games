

# Files Tab
- When you hover over a file or directory, a three dot (...) button appears on the right side of the file item.
- Clicking the dots icon shows a menu with these options
    - Rename
    - Delete
    - Delete to...
        - no implemented yet (allows user to pick a specific trash can to move it to)
    - Move to...
        - no implemented yet
    - Download (only shown for files not directories)
- There's a bug: when user deletes a folder and there is a file below the folder in the list, the file gets deleted instead of the file.


# File Editor
- Tab and shift-tab should implement changing indent level
    - This is partially broken right now. Probably need to redesign so that component manipulates a flat list of nodes instead of nested tree and instead do the nesting on the fly during rendering.
- Make the text area width equal remaining horizontal space in the editor component
