# TDocs Documentation Outline

This file records the documentation structure for TDocs. Use [Main.md](Main.md) as the navigable table of contents; the links below point to its feature pages.

## Contents

- [TDocs Overview](Documentation/TDocs-Overview.md)
- [Files](Files/Files.md)
- [File Editor](Edit-File/File-Editor.md)
- [Trash Cans](Trashes/Trash-Cans.md)
- [Trash Can Automation](Trashes/Trash-Can-Automation/Trash-Can-Automation.md)
- [Smart Folders](Smart-Folders/Smart-Folders.md)
- [Uh-Oh Alerts](Uh-Oh-Alerts/Uh-Oh-Alerts.md)

## TDocs Overview

Page: `Documentation/TDocs-Overview.md`

- What TDocs is and how to navigate its tabs.
- The Files, Edit File, Trashes, Smart Folders, Uh-Oh Alerts, and Documentation tabs.
- Navigable location state: the active tab, Files path, and selected trash can are reflected in the page URL. The currently edited file is held in page state, not encoded in the URL.
- Data is stored in browser local storage. Explain that data belongs to the current browser profile and is not a cloud sync or backup.
- Explain that the Documentation and Uh-Oh Alerts tabs are currently placeholders.

## Files

Page: `Files/Files.md`

- Browse the directory tree, read the current path, open folders, and return to the parent directory.
- Create files and folders. Names must be non-empty and unique within the current directory, ignoring letter case.
- Rename items; explain the same-directory name validation.
- Open a file in the File Editor.
- Move an item to a selected directory. A folder cannot be moved into itself or one of its descendants; moving to its current directory has no effect.
- For folders, Explode moves the folder's immediate children into the current directory and permanently removes the folder.
- For files, Download saves the text content as a plain-text file.
- Delete permanently, or move an item to one of the available trash cans. Explain that moving to trash records its original location and deletion time.
- Empty-state and status feedback for the current directory and completed actions.

## File Editor

Page: `Edit-File/File-Editor.md`

- Open the editor by selecting a file in Files or a file result in Smart Folders.
- Edit text as an indented outline: each line is an item, and leading tabs represent nesting.
- Keyboard behavior: Enter splits a line at the cursor; Backspace at the start joins with the previous line; Delete at the end joins with the next line; Tab indents and Shift+Tab outdents, subject to the previous line's nesting level.
- Changes are saved back to the file as the user edits.
- Close the editor to return to the tab navigation; opening a different file loads that file's content.

## Trash Cans

Page: `Trashes/Trash-Cans.md`

- Trash-can list and per-can contents; create and rename cans, with non-empty, case-insensitively unique names.
- A trash can can be deleted only when empty. Emptying a can permanently deletes its contents and requires confirmation.
- Select a can to inspect its items and return to the list.
- Per-item actions: Restore to the original directory, Delete forevermore with confirmation, or Reset clock to restart the item's retention age.
- Restore recreates missing directories in the original path. If an item with the same name already exists there, the restored item receives a recovered-name suffix.
- Trash-can settings: Do nothing, Auto-delete, or Auto-recover; automated actions can be set to 24 hours, 1 week, or 30 days.
- Explain that items moved to a trash can retain their original item data, original location, and deletion timestamp.

## Trash Can Automation

Page: `Trashes/Trash-Can-Automation/Trash-Can-Automation.md`

- Automation runs when TDocs starts and then checks on an hourly schedule, subject to the saved last-run time.
- Each trash can has its own action and age threshold. Do nothing leaves items untouched; Auto-delete permanently removes expired items; Auto-recover removes expired items from the can and restores them to their original location.
- Threshold age is measured from the item's deletion timestamp. Reset clock updates that timestamp.
- Recover behavior when the original folder no longer exists: recreate the path. Explain recovered-name handling when a same-named item is present.
- Clarify that automation operates on local browser data and only runs when the application is open.

## Smart Folders

Page: `Smart-Folders/Smart-Folders.md`

- Smart Folders are saved views over the current file tree; they do not copy or move matching items.
- Create and edit a smart folder with a name, an item-type filter (files and folders, files only, or folders only), a location, and an optional case-insensitive name-contains query.
- The location filter searches descendants beneath the selected directory, not the directory itself. `/` searches descendants of the root.
- Open a saved folder to see its live matching count, criteria, sorted results, and each result's containing path.
- Open a folder result in Files or a file result in the File Editor.
- Rename/edit and delete saved smart folders. Deleting a smart folder does not affect files or folders.
- Empty states for no saved smart folders and no matching items.

## Uh-Oh Alerts

Page: `Uh-Oh-Alerts/Uh-Oh-Alerts.md`

- Current behavior: the tab displays an empty “Nothing to report yet” state.
- State that alert types, triggers, and actions are not implemented yet; update this page when alerts become available.
