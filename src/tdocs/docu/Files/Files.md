# Files

## Browse

The Files tab shows the current directory path and its items, sorted by name.
Select a folder to open it. Use the back arrow to go to its parent; it is
disabled at the root (`/`). Select a file to open it in [Edit File](../Edit-File/File-Editor.md).
An empty directory has no item rows; use the plus button to add a file or
folder.

## Create and rename

Use the plus button to choose **File** or **Folder**, then enter a name. Names
must not be blank and must be unique within the current directory, ignoring
letter case. The same validation applies when renaming. A rename to the item's
unchanged name is rejected. These checks apply within one directory; they do
not prevent the same name from appearing elsewhere in the tree.

## Item actions

Open an item's action menu for the actions available to that type:

- **Move to...** opens a directory picker. Select a destination and confirm.
	Moving to the item's current directory makes no change. A folder cannot be
	moved into itself or one of its descendants.
- **Explode** is available for folders. After confirmation, it moves the
	folder's immediate children into the current directory and permanently
	removes the folder.
- **Download** is available for files and downloads their text content as a
	plain-text file.
- **Delete** is available for files. **Delete Forevermore** permanently
	removes the file after confirmation. **To Trash...** instead moves it to a
	selected trash can and records its original folder and deletion time. At
	least one trash can must exist to complete this action; create one from the
	[Trashes](../Trashes/Trash-Cans.md) tab first.

After actions such as moving, deleting, or exploding, the current directory
shows a status message describing the result. Navigating to another directory
clears that message.