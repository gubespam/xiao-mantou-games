const markdownByPath = import.meta.glob(
  [
    "./docu/Main.md",
    "./docu/Trashes/Trash-Cans.md",
    "./docu/Trashes/Trash-Can-Automation/Trash-Can-Automation.md",
    "./docu/Files/Files.md",
    "./docu/Edit-File/File-Editor.md",
    "./docu/Smart-Folders/Smart-Folders.md",
    "./docu/Uh-Oh-Alerts/Uh-Oh-Alerts.md",
    "./docu/Documentation/TDocs-Overview.md",
  ],
  { eager: true, query: "?raw", import: "default" },
);

export const publicDocuments = new Map([
  ["Main", markdownByPath["./docu/Main.md"]],
  ["Trashes/Trash-Cans", markdownByPath["./docu/Trashes/Trash-Cans.md"]],
  [
    "Trashes/Trash-Can-Automation/Trash-Can-Automation",
    markdownByPath["./docu/Trashes/Trash-Can-Automation/Trash-Can-Automation.md"],
  ],
  ["Files/Files", markdownByPath["./docu/Files/Files.md"]],
  ["Edit-File/File-Editor", markdownByPath["./docu/Edit-File/File-Editor.md"]],
  ["Smart-Folders/Smart-Folders", markdownByPath["./docu/Smart-Folders/Smart-Folders.md"]],
  ["Uh-Oh-Alerts/Uh-Oh-Alerts", markdownByPath["./docu/Uh-Oh-Alerts/Uh-Oh-Alerts.md"]],
  ["Documentation/TDocs-Overview", markdownByPath["./docu/Documentation/TDocs-Overview.md"]],
]);

export const publicDocumentIds = new Set(publicDocuments.keys());