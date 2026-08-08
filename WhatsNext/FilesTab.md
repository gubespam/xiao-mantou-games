# File System
- Refactor the file system operations to a service component
    - All of these from the FilesPage
        const STORAGE_KEY = 'xmg-tdocs-files';
        function createDirectoryNode(name, children = []) {
        function createFileNode(name, content = '') {
        function buildInitialTree() {
        function loadTreeFromStorage() {
        function saveTreeToStorage(tree) {
        function findDirectoryByPath(root, pathSegments) {
        function getDisplayPath(pathSegments) {
    - Add/delete/rename files and directories
    - Get file and directories by path
    - Move files and directories
    - Move files and directories to Trash Cans
    - Add/remove/rename trash cans
- Create a single file system service in TDocs and inject it into tab components as needed

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
- Refactor so that clicking on a file in the files tab shows and switches to this tab, opening it to edit that file
    - At other times, this tab should be hiddens
- Tab and shift-tab should implement changing indent level
    - This is partially broken right now. Probably need to redesign so that component manipulates a flat list of nodes instead of nested tree and instead do the nesting on the fly during rendering.
- Make the text area width equal remaining horizontal space in the editor component

