# TDocs Overview

TDocs is the file and folder workspace in Xiao Mantou Games. Its tabs provide
file browsing and editing, trash-can recovery, saved Smart Folder searches,
and two placeholder areas. Start at the [documentation contents](../Main.md).

## Tabs

- [Files](../Files/Files.md) browses the directory tree and provides actions
	for files and folders.
- [Edit File](../Edit-File/File-Editor.md) edits a file selected from Files or
	from a Smart Folder result.
- [Trashes](../Trashes/Trash-Cans.md) stores items moved from Files and provides
	restore, permanent deletion, and per-can settings.
- [Smart Folders](../Smart-Folders/Smart-Folders.md) saves criteria-based views
	of the current file tree.
- [Uh-Oh Alerts](../Uh-Oh-Alerts/Uh-Oh-Alerts.md) currently shows
	“Nothing to report yet. Alerts will appear here.”
- **Documentation** currently shows “Documentation is coming soon.” The tab
	does not yet render these Markdown guide files.

Select a tab in the tab bar to change views. The active tab is represented by
the `tab` URL query parameter; if it is absent, TDocs opens Trashes.

## URL state

The `path` query parameter stores the current Files folder as slash-separated
folder names. The `trash` parameter stores the selected trash-can ID. These
values make the Files location and selected can part of the page URL. The file
currently open in Edit File is different: it is held in page state, not in the
URL. Reloading the page clears that selection, though saved file contents
remain in the file tree.

## Local data

TDocs reads and writes the file tree, trash cans, Smart Folders, and trash
automation's last-run timestamp in browser `localStorage`. This data belongs
to the current browser profile and site storage. It is not a cloud sync or a
backup; clearing that browser storage can remove it.