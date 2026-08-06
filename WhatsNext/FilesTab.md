

# Files Tab
- When you hover over a file or directory, a three dot (...) button appears on the right side of the file item.
- Clicking the dots icon shows a menu with these options
    - Rename
    - Permanently Delete (currently called "Delete"; rename it)
        - This item is hidden unless enabled in the Trash Cans tab
        - Show a confirmation dialog "Are you sure you want to permanently delete {filename}?"
    - Delete to...
        - Shows a pop-up window that allows the user to choose a trash can from the list of trash cans
        - When user clicks OK, moves the item to the chosen trash can
    - Move to...
        - not implemented yet
    - Download (only shown for files not directories)
- There's a bug: when user deletes a folder and there is a file below the folder in the list, the file gets deleted instead of the file.


# File Editor
- Tab and shift-tab should implement changing indent level
    - This is partially broken right now. Probably need to redesign so that component manipulates a flat list of nodes instead of nested tree and instead do the nesting on the fly during rendering.
- Make the text area width equal remaining horizontal space in the editor component

# Trash Cans Tab
## Data Model
- Trash cans are like top-level folders that are kept separate from the rest of the folders
- Each trash can has:
    - settings
        - deleteAfterDays - int
        - action - enum
            - "nothing"
            - "delete"
            - "recover"
    - items - contains a list of deleted item metadata; each has:
        - Original (before deletion) folder path
        - Original filename
        - Deleted date/time
- Trash cans cannot contain folders
## UI
- The trash cans tab has a list of trash cans, showing the name of each
- All of the trash can items in the list have a trash can icon on the left side
- When the user hovers over an item, a three-dots icon appears on the right side
- Clicking the three-dots shows a menu with these options:
    - Delete
        - Only shown if the trash can is emptpy
    - Empty
        - Only shown if the trash can is not empty
    - Rename
        - Change the name of the trash can (use FileNameWindow)
    - Settings...
        - Shows a popup window (make a separate TrashCanSettingsWindow component for this)
            - "Action" radio button group
                - Do nothing
                - Auto-delete
                - Auto-recover
            - "After how long?" radio button group - only show if action is not "Do nothing"
                - 24 hours
                - 1 week
                - 30 days
            - Includes a Save button
                - Pressing Enter clicks this button
            - Includes a Cancel button
                - Pressing Esc clicks this button
- At the end of the list, there is an extra item
    - Instead of a trash can icon, it has a red X icon
    - Instead of trash can name, it says "Permanently Delete" 
    - Instead of the three dots (...) menu, it has a toggle switch
        - Controls whether the "Permanently Delete" option shows up at the bottom of the "Delete To" window
- Clicking on a trash can switches to a view that shows the list of deleted items in that trash can
    - Each item shows
        - Filename
    - When user hovers over item, a popup hint shows
        - Original path
        - Deletion date/time
