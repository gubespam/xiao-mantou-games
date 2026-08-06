Automatically sort the directory contents by name.

Implement opening and editing files.


# Files Tab
- When you hover over a file or directory, a three dot (...) button appears on the right side of the file item.
- Clicking the dots icon shows a menu with these options
    - Rename
        - Shows a popup window like the 
    - Delete to...
    - Move to...
    - Download (only shown for files not directories)



# File Editor
- Tab and shift-tab should implement changing indent level
    - This is partially broken right now. Probably need to redesign so that component manipulates a flat list of nodes instead of nested tree and instead do the nesting on the fly during rendering.
- Make the text area width equal remaining horizontal space in the editor component
