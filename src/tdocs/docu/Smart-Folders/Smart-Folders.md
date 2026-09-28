# Smart Folders

## Saved views

A Smart Folder saves search criteria over the current Files tree; it does not
copy or move matching items. Create one with the plus button and provide a
non-blank name. Its criteria are:

- **Item type:** Files and folders, Files only, or Folders only.
- **Location:** the root (`/`) or any folder currently in the tree.
- **Name contains:** an optional text query. Matching ignores letter case.

The location is a search scope, not a result: only its descendants are
searched. For `/`, results are items beneath the root. A folder is not returned
as a match for its own location, though it can be returned when searching a
parent location.

## View and manage results

Select a saved Smart Folder to see its current match count, location, item-type
filter, and matching items sorted by name. Each result also shows its containing
folder path. Open a folder result to go to that folder in Files, or open a file
result in [Edit File](../Edit-File/File-Editor.md).

Use **Edit** to change the saved criteria or **Delete** to remove the Smart
Folder. Deleting it does not affect any files or folders. The list and results
have separate empty states when no Smart Folders exist or when the selected
criteria currently match nothing. Saved Smart Folders are kept in the current
browser's local storage.