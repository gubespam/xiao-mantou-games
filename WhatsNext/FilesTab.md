# File System

# Files Tab

# File Editor
- Refactor so that clicking on a file in the files tab shows and switches to this tab, opening it to edit that file
    - At other times, this tab should be hiddens
- Tab and shift-tab should implement changing indent level
    - This is partially broken right now. Probably need to redesign so that component manipulates a flat list of nodes instead of nested tree and instead do the nesting on the fly during rendering.
- Make the text area width equal remaining horizontal space in the editor component

