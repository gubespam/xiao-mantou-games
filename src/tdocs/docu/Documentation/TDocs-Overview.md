# TDocs Overview

TDocs is the file and folder workspace in Xiao Mantou Games. Its tabs provide
file browsing and editing, trash-can recovery, saved Smart Folder searches,
alerts, and this navigable documentation. Start at the
[documentation contents](../Main.md).

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
- **Documentation** renders the published Markdown guides. Use Contents to
	return to the index; selecting a guide updates the `doc` URL parameter, so
	browser Back and Forward move between documentation pages.

Select a tab in the tab bar to change views. The active tab is represented by
the `tab` URL query parameter; if it is absent, TDocs opens Trashes.

## URL state

The `path` query parameter stores the current Files folder as slash-separated
folder names. The `trash` parameter stores the selected trash-can ID. These
values make the Files location and selected can part of the page URL. The file
currently open in Edit File is different: it is held in page state, not in the
URL. Reloading the page clears that selection, though saved file contents
remain in the file tree.

The selected documentation page is stored in the `doc` query parameter as a
path relative to the documentation folder without the `.md` suffix. Without a
valid `doc` value, the Documentation tab shows the contents page. Write guide
links as relative `.md` links from the Markdown file containing the link, and
add new published guides to the contents page and the application registry.
Editorial planning files are not published pages.

## Local data

TDocs reads and writes the file tree, trash cans, Smart Folders, and trash
automation's last-run timestamp in browser `localStorage`. This data belongs
to the current browser profile and site storage. It is not a cloud sync or a
backup; clearing that browser storage can remove it.