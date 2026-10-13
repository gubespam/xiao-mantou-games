import {
  addItem,
  addWebLink,
  deleteItem,
  explodeFolder,
  findDirectoryByPath,
  getDisplayPath,
  moveItem,
  renameItem,
  restoreItem,
  updateFileContent,
  updateWebLink,
} from "../files/fileSystemService.js";
import { smartFolderMacroAdapters } from "./smartFolderMacroAdapters.js";

function failure(message) {
  return { ok: false, error: { message } };
}

function normalizePath(value) {
  if (typeof value === "string") {
    return value.split("/").filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.filter((segment) => typeof segment === "string" && segment.length > 0);
  }

  return [];
}

function getDirectoryTree(context) {
  if (typeof context.getDirectoryTree === "function") {
    return context.getDirectoryTree();
  }

  return context.directoryTree ?? context.tree ?? null;
}

function setDirectoryTree(context, nextTree) {
  if (typeof context.setDirectoryTree === "function") {
    context.setDirectoryTree(nextTree);
    return;
  }

  context.directoryTree = nextTree;
  context.tree = nextTree;
}

function getTrashCans(context) {
  if (typeof context.getTrashCans === "function") {
    return context.getTrashCans();
  }

  return context.trashCans ?? [];
}

function setTrashCans(context, nextTrashCans) {
  if (typeof context.setTrashCans === "function") {
    context.setTrashCans(nextTrashCans);
    return;
  }

  context.trashCans = nextTrashCans;
}

function getFileFromTree(tree, pathSegments, fileName) {
  const currentDirectory = findDirectoryByPath(tree, pathSegments);
  return currentDirectory?.children?.find(
    (child) => child.type === "file" && child.name === fileName,
  );
}

function getPathString(pathSegments) {
  return getDisplayPath(pathSegments);
}

function createRuntimeId(prefix, context) {
  if (typeof context.createItemId === "function") {
    return context.createItemId(prefix);
  }

  if (typeof context.createTrashCanId === "function" && prefix === "trash-can") {
    return context.createTrashCanId();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function updateFileState(context, pathSegments, fileName, content) {
  const currentTree = getDirectoryTree(context);
  const nextTree = updateFileContent(currentTree, pathSegments, fileName, content);

  if (nextTree === currentTree) {
    return { ok: false, error: { message: `File "${fileName}" was not found.` } };
  }

  setDirectoryTree(context, nextTree);
  const file = getFileFromTree(nextTree, pathSegments, fileName);
  if (file && typeof context.setSelectedFile === "function") {
    context.setSelectedFile({
      name: file.name,
      content: file.content ?? "",
      path: [...pathSegments, file.name],
    });
  }

  return { ok: true, changed: true, outputs: { content: file?.content ?? content } };
}

function parseContentLines(content) {
  return String(content ?? "").split("\n");
}

function getIndentLevel(line) {
  return (line.match(/^\t*/) ?? [""])[0].length;
}

const fileCommandAdapters = {
  "files/open-directory": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const tree = getDirectoryTree(context);
    if (!findDirectoryByPath(tree, pathSegments)) {
      return failure(`Directory "${getPathString(pathSegments)}" was not found.`);
    }

    context.openFolder?.(pathSegments);
    return {
      ok: true,
      changed: true,
      outputs: { "opened-path": getPathString(pathSegments) },
    };
  },

  "files/open-directory-parent": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const parentPath = pathSegments.slice(0, -1);
    const tree = getDirectoryTree(context);
    if (!findDirectoryByPath(tree, parentPath) && parentPath.length > 0) {
      return failure(`Directory "${getPathString(parentPath)}" was not found.`);
    }

    context.openFolder?.(parentPath);
    return {
      ok: true,
      changed: true,
      outputs: { "parent-path": getPathString(parentPath) },
    };
  },

  "files/open-file": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const fileName = String(params["file-name"] ?? "");
    const file = getFileFromTree(getDirectoryTree(context), pathSegments, fileName);

    if (!file) {
      return failure(`File "${fileName}" was not found.`);
    }

    const selectedFile = {
      name: file.name,
      content: file.content ?? "",
      path: [...pathSegments, file.name],
    };
    context.openFile?.(selectedFile);
    context.setSelectedFile?.(selectedFile);
    return {
      ok: true,
      changed: true,
      outputs: {
        "file-path": getPathString([...pathSegments, file.name]),
        content: file.content ?? "",
      },
    };
  },

  "files/open-create-item-window": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const kind = params.kind ?? "file";
    if (kind !== "file" && kind !== "folder") {
      return failure(`Unsupported item kind "${kind}".`);
    }
    context.openCreateItemWindow?.({ path: pathSegments, kind, defaultName: params["default-name"] ?? "" });
    return { ok: true, changed: true, outputs: { opened: true } };
  },

  "files/create-file": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const fileName = String(params["file-name"] ?? "");
    if (!fileName.trim()) {
      return failure("File name is required.");
    }

    const tree = getDirectoryTree(context);
    const currentDirectory = findDirectoryByPath(tree, pathSegments);
    if (!currentDirectory) {
      return failure(`Directory "${getPathString(pathSegments)}" was not found.`);
    }

    if (currentDirectory.children?.some((child) => child.name === fileName)) {
      return failure(`A file or folder named "${fileName}" already exists.`);
    }

    const nextTree = addItem(tree, pathSegments, "file", fileName);
    if (nextTree === tree) {
      return failure(`Could not create file "${fileName}".`);
    }

    setDirectoryTree(context, nextTree);
    context.openFile?.({
      name: fileName,
      content: "",
      path: [...pathSegments, fileName],
    });
    return {
      ok: true,
      changed: true,
      outputs: { "file-path": getPathString([...pathSegments, fileName]) },
    };
  },

  "files/create-folder": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const folderName = String(params["folder-name"] ?? "");
    if (!folderName.trim()) {
      return failure("Folder name is required.");
    }

    const tree = getDirectoryTree(context);
    const currentDirectory = findDirectoryByPath(tree, pathSegments);
    if (!currentDirectory) {
      return failure(`Directory "${getPathString(pathSegments)}" was not found.`);
    }

    if (currentDirectory.children?.some((child) => child.name === folderName)) {
      return failure(`A file or folder named "${folderName}" already exists.`);
    }

    const nextTree = addItem(tree, pathSegments, "folder", folderName);
    if (nextTree === tree) {
      return failure(`Could not create folder "${folderName}".`);
    }

    setDirectoryTree(context, nextTree);
    return {
      ok: true,
      changed: true,
      outputs: { "folder-path": getPathString([...pathSegments, folderName]) },
    };
  },

  "files/create-web-link": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const url = String(params.url ?? "");
    const title = String(params.title ?? "");
    const tree = getDirectoryTree(context);
    const currentDirectory = findDirectoryByPath(tree, pathSegments);

    if (!currentDirectory) {
      return failure(`Directory "${getPathString(pathSegments)}" was not found.`);
    }

    if (!url.trim() || !title.trim()) {
      return failure("Both the web-link URL and title are required.");
    }

    const linkId = createRuntimeId("web-link", context);
    const nextTree = addWebLink(tree, pathSegments, url, title, linkId);
    if (nextTree === tree) {
      return failure(`Could not create web link "${title}".`);
    }

    setDirectoryTree(context, nextTree);
    return {
      ok: true,
      changed: true,
      outputs: {
        "link-id": linkId,
        url,
      },
    };
  },

  "files/edit-web-link": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const linkId = String(params["link-id"] ?? "");
    const url = String(params.url ?? "");
    const title = String(params.title ?? "");
    const tree = getDirectoryTree(context);
    const currentDirectory = findDirectoryByPath(tree, pathSegments);
    if (!currentDirectory) {
      return failure(`Directory "${getPathString(pathSegments)}" was not found.`);
    }

    const existing = currentDirectory.children?.find((child) => child.type === "web" && child.id === linkId);
    if (!existing) {
      return failure(`Web link "${linkId}" was not found.`);
    }

    const nextTree = updateWebLink(tree, pathSegments, linkId, url, title);
    if (nextTree === tree) {
      return failure(`Could not update web link "${linkId}".`);
    }

    setDirectoryTree(context, nextTree);
    return { ok: true, changed: true, outputs: { "link-id": linkId, url } };
  },

  "files/rename-item": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const currentName = String(params["current-name"] ?? "");
    const newName = String(params["new-name"] ?? "");
    const tree = getDirectoryTree(context);
    const currentDirectory = findDirectoryByPath(tree, pathSegments);
    if (!currentDirectory) {
      return failure(`Directory "${getPathString(pathSegments)}" was not found.`);
    }

    const index = currentDirectory.children?.findIndex((child) => child.name === currentName);
    if (index === undefined || index < 0) {
      return failure(`Item "${currentName}" was not found.`);
    }

    const nextTree = renameItem(tree, pathSegments, index, newName);
    if (nextTree === tree) {
      return failure(`Could not rename "${currentName}".`);
    }

    setDirectoryTree(context, nextTree);
    return {
      ok: true,
      changed: true,
      outputs: { "item-path": getPathString([...pathSegments, newName]) },
    };
  },

  "files/move-item": async ({ params, context }) => {
    const sourcePath = normalizePath(params["source-path"] ?? "/");
    const targetPath = normalizePath(params["target-path"] ?? "/");
    const itemName = String(params["item-name"] ?? "");
    const tree = getDirectoryTree(context);
    const sourceDirectory = findDirectoryByPath(tree, sourcePath);
    if (!sourceDirectory) {
      return failure(`Directory "${getPathString(sourcePath)}" was not found.`);
    }

    const sourceIndex = sourceDirectory.children?.findIndex((child) => child.name === itemName);
    if (sourceIndex === undefined || sourceIndex < 0) {
      return failure(`Item "${itemName}" was not found.`);
    }

    const nextTree = moveItem(tree, sourcePath, sourceIndex, targetPath);
    if (nextTree === tree) {
      return failure(`Item "${itemName}" is already in the target directory.`);
    }

    setDirectoryTree(context, nextTree);
    return {
      ok: true,
      changed: true,
      outputs: { "item-path": getPathString([...targetPath, itemName]) },
    };
  },

  "files/delete-item-forever": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const itemName = String(params["item-name"] ?? "");
    const tree = getDirectoryTree(context);
    const currentDirectory = findDirectoryByPath(tree, pathSegments);
    if (!currentDirectory) {
      return failure(`Directory "${getPathString(pathSegments)}" was not found.`);
    }

    const itemIndex = currentDirectory.children?.findIndex((child) => child.name === itemName);
    if (itemIndex === undefined || itemIndex < 0) {
      return failure(`Item "${itemName}" was not found.`);
    }

    const nextTree = deleteItem(tree, pathSegments, itemIndex);
    if (nextTree === tree) {
      return failure(`Could not delete "${itemName}".`);
    }

    setDirectoryTree(context, nextTree);
    return { ok: true, changed: true, outputs: { deleted: true } };
  },

  "files/move-item-to-trash": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const itemName = String(params["item-name"] ?? "");
    const trashCanId = String(params["trash-can-id"] ?? "");
    const tree = getDirectoryTree(context);
    const currentDirectory = findDirectoryByPath(tree, pathSegments);
    if (!currentDirectory) {
      return failure(`Directory "${getPathString(pathSegments)}" was not found.`);
    }

    const itemIndex = currentDirectory.children?.findIndex((child) => child.name === itemName);
    if (itemIndex === undefined || itemIndex < 0) {
      return failure(`Item "${itemName}" was not found.`);
    }

    const trashCans = getTrashCans(context);
    const trashCan = trashCans.find((entry) => entry.id === trashCanId);
    if (!trashCan) {
      return failure(`Trash can "${trashCanId}" was not found.`);
    }

    const nextTree = deleteItem(tree, pathSegments, itemIndex);
    if (nextTree === tree) {
      return failure(`Could not move "${itemName}" to trash.`);
    }

    const removedItem = currentDirectory.children[itemIndex];
    const itemId = `${trashCanId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextTrashCans = trashCans.map((entry) =>
      entry.id === trashCanId
        ? {
            ...entry,
            items: [
              ...(entry.items ?? []),
              {
                id: itemId,
                originalFolderPath: getPathString(pathSegments),
                originalFilename: removedItem.name,
                deletedAt: new Date().toISOString(),
                item: removedItem,
              },
            ],
          }
        : entry,
    );

    setDirectoryTree(context, nextTree);
    setTrashCans(context, nextTrashCans);
    return {
      ok: true,
      changed: true,
      outputs: { "trash-item-id": itemId },
    };
  },

  "files/explode-folder": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const folderName = String(params["folder-name"] ?? "");
    const tree = getDirectoryTree(context);
    const currentDirectory = findDirectoryByPath(tree, pathSegments);
    if (!currentDirectory) {
      return failure(`Directory "${getPathString(pathSegments)}" was not found.`);
    }

    const folderIndex = currentDirectory.children?.findIndex(
      (child) => child.type === "dir" && child.name === folderName,
    );
    if (folderIndex === undefined || folderIndex < 0) {
      return failure(`Folder "${folderName}" was not found.`);
    }

    const nextTree = explodeFolder(tree, pathSegments, folderIndex);
    if (nextTree === tree) {
      return failure(`Could not explode folder "${folderName}".`);
    }

    setDirectoryTree(context, nextTree);
    return {
      ok: true,
      changed: true,
      outputs: {
        "moved-item-count": (findDirectoryByPath(nextTree, pathSegments)?.children?.length ?? 0),
      },
    };
  },

  "files/download-item": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const fileName = String(params["file-name"] ?? "");
    const file = getFileFromTree(getDirectoryTree(context), pathSegments, fileName);
    if (!file) {
      return failure(`File "${fileName}" was not found.`);
    }

    context.downloadFile?.(file);
    return {
      ok: true,
      changed: false,
      outputs: { "downloaded-file-name": file.name },
    };
  },

  "edit-file/open-file-editor": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const fileName = String(params["file-name"] ?? "");
    const file = getFileFromTree(getDirectoryTree(context), pathSegments, fileName);
    if (!file) {
      return failure(`File "${fileName}" was not found.`);
    }

    const selectedFile = {
      name: file.name,
      content: file.content ?? "",
      path: [...pathSegments, file.name],
    };
    context.openFileEditor?.(selectedFile);
    context.setSelectedFile?.(selectedFile);
    return {
      ok: true,
      changed: true,
      outputs: { "file-path": getPathString([...pathSegments, file.name]) },
    };
  },

  "edit-file/update-file-content": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const fileName = String(params["file-name"] ?? "");
    const content = String(params.content ?? "");
    return updateFileState(context, pathSegments, fileName, content);
  },

  "edit-file/split-line": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const fileName = String(params["file-name"] ?? "");
    const lineIndex = Number(params["line-index"] ?? 0);
    const cursorPosition = Number(params["cursor-position"] ?? 0);
    const file = getFileFromTree(getDirectoryTree(context), pathSegments, fileName);

    if (!file) {
      return failure(`File "${fileName}" was not found.`);
    }

    const lines = parseContentLines(file.content ?? "");
    const currentLine = lines[lineIndex] ?? "";
    const nextLines = [
      ...lines.slice(0, lineIndex),
      currentLine.slice(0, cursorPosition),
      currentLine.slice(cursorPosition),
      ...lines.slice(lineIndex + 1),
    ];

    return updateFileState(context, pathSegments, fileName, nextLines.join("\n"));
  },

  "edit-file/indent-line": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const fileName = String(params["file-name"] ?? "");
    const lineIndex = Number(params["line-index"] ?? 0);
    const direction = String(params["indent-direction"] ?? "in");
    const file = getFileFromTree(getDirectoryTree(context), pathSegments, fileName);

    if (!file) {
      return failure(`File "${fileName}" was not found.`);
    }

    const lines = parseContentLines(file.content ?? "");
    const currentLine = lines[lineIndex] ?? "";
    const currentIndent = getIndentLevel(currentLine);
    const previousIndent = lineIndex > 0 ? getIndentLevel(lines[lineIndex - 1]) : 0;
    const nextIndent = direction === "in"
      ? Math.min(currentIndent + 1, previousIndent + 1)
      : Math.max(0, currentIndent - 1);
    if (nextIndent === currentIndent) {
      return { ok: true, changed: false, outputs: { content: file.content ?? "" } };
    }

    const updatedLine = "\t".repeat(nextIndent) + currentLine.replace(/^\t*/, "");
    lines[lineIndex] = updatedLine;
    return updateFileState(context, pathSegments, fileName, lines.join("\n"));
  },

  "edit-file/outdent-line": async ({ params, context }) => {
    const pathSegments = normalizePath(params.path ?? "/");
    const fileName = String(params["file-name"] ?? "");
    const lineIndex = Number(params["line-index"] ?? 0);
    const file = getFileFromTree(getDirectoryTree(context), pathSegments, fileName);

    if (!file) {
      return failure(`File "${fileName}" was not found.`);
    }

    const lines = parseContentLines(file.content ?? "");
    const currentLine = lines[lineIndex] ?? "";
    const currentIndent = getIndentLevel(currentLine);
    if (currentIndent === 0) {
      return { ok: true, changed: false, outputs: { content: file.content ?? "" } };
    }

    const updatedLine = "\t".repeat(Math.max(0, currentIndent - 1)) + currentLine.replace(/^\t*/, "");
    lines[lineIndex] = updatedLine;
    return updateFileState(context, pathSegments, fileName, lines.join("\n"));
  },

  "documentation/navigate-to-documentation-section": async ({ params, context }) => {
    const documentId = String(params["document-id"] ?? "Main");
    const fragment = String(params.fragment ?? "");
    context.openDocumentationPage?.(documentId, fragment);
    return {
      ok: true,
      changed: true,
      outputs: {
        "document-id": documentId,
        fragment,
      },
    };
  },

  "trashes/create-trash-can": async ({ params, context }) => {
    const label = String(params.label ?? "");
    const trashCans = getTrashCans(context);
    if (!label.trim()) {
      return failure("Trash can name is required.");
    }

    const id = createRuntimeId("trash-can", context);
    const nextTrashCan = {
      id,
      name: label.trim(),
      settings: { action: "nothing", deleteAfterDays: 30 },
      items: [],
    };

    setTrashCans(context, [...trashCans, nextTrashCan]);
    context.openTrashCan?.(id);
    return {
      ok: true,
      changed: true,
      outputs: { "trash-can-id": id, name: nextTrashCan.name },
    };
  },

  "trashes/rename-trash-can": async ({ params, context }) => {
    const trashCanId = String(params["trash-can-id"] ?? "");
    const newName = String(params["new-name"] ?? "");
    const trashCans = getTrashCans(context);
    const existing = trashCans.find((entry) => entry.id === trashCanId);
    if (!existing) {
      return failure(`Trash can "${trashCanId}" was not found.`);
    }

    const nextTrashCans = trashCans.map((entry) =>
      entry.id === trashCanId ? { ...entry, name: newName.trim() } : entry,
    );
    setTrashCans(context, nextTrashCans);
    return {
      ok: true,
      changed: true,
      outputs: { "trash-can-id": trashCanId, name: newName.trim() },
    };
  },

  "trashes/delete-empty-trash-can": async ({ params, context }) => {
    const trashCanId = String(params["trash-can-id"] ?? "");
    const trashCans = getTrashCans(context);
    const target = trashCans.find((entry) => entry.id === trashCanId);
    if (!target) {
      return failure(`Trash can "${trashCanId}" was not found.`);
    }

    if ((target.items ?? []).length > 0) {
      return failure(`Trash can "${trashCanId}" is not empty.`);
    }

    setTrashCans(context, trashCans.filter((entry) => entry.id !== trashCanId));
    return { ok: true, changed: true, outputs: { deleted: true } };
  },

  "trashes/empty-trash-can": async ({ params, context }) => {
    const trashCanId = String(params["trash-can-id"] ?? "");
    const trashCans = getTrashCans(context);
    const existing = trashCans.find((entry) => entry.id === trashCanId);
    if (!existing) {
      return failure(`Trash can "${trashCanId}" was not found.`);
    }

    const nextTrashCans = trashCans.map((entry) =>
      entry.id === trashCanId ? { ...entry, items: [] } : entry,
    );
    setTrashCans(context, nextTrashCans);
    return {
      ok: true,
      changed: true,
      outputs: { "deleted-item-count": existing.items?.length ?? 0 },
    };
  },

  "trashes/set-trash-can-settings": async ({ params, context }) => {
    const trashCanId = String(params["trash-can-id"] ?? "");
    const action = String(params.action ?? "nothing");
    const deleteAfterDays = Number(params["delete-after-days"] ?? 30);
    const trashCans = getTrashCans(context);
    const existing = trashCans.find((entry) => entry.id === trashCanId);
    if (!existing) {
      return failure(`Trash can "${trashCanId}" was not found.`);
    }

    const nextTrashCans = trashCans.map((entry) =>
      entry.id === trashCanId
        ? { ...entry, settings: { action, deleteAfterDays: action === "nothing" ? 30 : deleteAfterDays } }
        : entry,
    );
    setTrashCans(context, nextTrashCans);
    return {
      ok: true,
      changed: true,
      outputs: {
        action,
        "delete-after-days": action === "nothing" ? 30 : deleteAfterDays,
      },
    };
  },

  "trashes/open-trash-can": async ({ params, context }) => {
    const trashCanId = String(params["trash-can-id"] ?? "");
    const trashCans = getTrashCans(context);
    if (!trashCans.some((entry) => entry.id === trashCanId)) {
      return failure(`Trash can "${trashCanId}" was not found.`);
    }

    context.openTrashCan?.(trashCanId);
    return {
      ok: true,
      changed: true,
      outputs: { "trash-can-id": trashCanId },
    };
  },

  "trashes/restore-trash-item": async ({ params, context }) => {
    const trashCanId = String(params["trash-can-id"] ?? "");
    const itemId = String(params["item-id"] ?? "");
    const trashCans = getTrashCans(context);
    const trashCan = trashCans.find((entry) => entry.id === trashCanId);
    if (!trashCan) {
      return failure(`Trash can "${trashCanId}" was not found.`);
    }

    const item = trashCan.items?.find((entry) => entry.id === itemId);
    if (!item) {
      return failure(`Trash item "${itemId}" was not found.`);
    }

    const originalPath = item.originalPath ?? item.originalFolderPath?.split("/").filter(Boolean) ?? [];
    const nextTree = restoreItem(getDirectoryTree(context), item, originalPath);
    if (nextTree === getDirectoryTree(context)) {
      return failure(`Item "${itemId}" could not be restored.`);
    }

    setDirectoryTree(context, nextTree);
    setTrashCans(
      context,
      trashCans.map((entry) =>
        entry.id === trashCanId
          ? { ...entry, items: (entry.items ?? []).filter((candidate) => candidate.id !== itemId) }
          : entry,
      ),
    );
    return {
      ok: true,
      changed: true,
      outputs: { "restored-path": getPathString(originalPath) },
    };
  },

  "trashes/delete-trash-item-forever": async ({ params, context }) => {
    const trashCanId = String(params["trash-can-id"] ?? "");
    const itemId = String(params["item-id"] ?? "");
    const trashCans = getTrashCans(context);
    const existingTrashCan = trashCans.find((entry) => entry.id === trashCanId);
    if (!existingTrashCan) {
      return failure(`Trash can "${trashCanId}" was not found.`);
    }

    const item = existingTrashCan.items?.find((entry) => entry.id === itemId);
    if (!item) {
      return failure(`Trash item "${itemId}" was not found.`);
    }

    setTrashCans(
      context,
      trashCans.map((entry) =>
        entry.id === trashCanId
          ? { ...entry, items: (entry.items ?? []).filter((candidate) => candidate.id !== itemId) }
          : entry,
      ),
    );
    return { ok: true, changed: true, outputs: { deleted: true } };
  },

  "trashes/reset-trash-item-clock": async ({ params, context }) => {
    const trashCanId = String(params["trash-can-id"] ?? "");
    const itemId = String(params["item-id"] ?? "");
    const trashCans = getTrashCans(context);
    const existingTrashCan = trashCans.find((entry) => entry.id === trashCanId);
    if (!existingTrashCan) {
      return failure(`Trash can "${trashCanId}" was not found.`);
    }

    const item = existingTrashCan.items?.find((entry) => entry.id === itemId);
    if (!item) {
      return failure(`Trash item "${itemId}" was not found.`);
    }

    const nextDeletedAt = new Date().toISOString();
    setTrashCans(
      context,
      trashCans.map((entry) =>
        entry.id === trashCanId
          ? {
              ...entry,
              items: (entry.items ?? []).map((candidate) =>
                candidate.id === itemId ? { ...candidate, deletedAt: nextDeletedAt } : candidate,
              ),
            }
          : entry,
      ),
    );
    return {
      ok: true,
      changed: true,
      outputs: { "deleted-at": nextDeletedAt },
    };
  },
};

export const allCommandAdapters = {
  ...smartFolderMacroAdapters,
  ...fileCommandAdapters,
};
