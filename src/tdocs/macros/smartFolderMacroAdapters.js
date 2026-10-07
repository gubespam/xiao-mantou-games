function failure(message) {
  return { ok: false, error: { message } };
}

function isFolderType(type) {
  return type === "any" || type === "file" || type === "dir";
}

function getSmartFolders(context) {
  if (typeof context.getSmartFolders !== "function") {
    throw new Error("Smart Folder playback state is unavailable.");
  }
  return context.getSmartFolders();
}

function createId(context) {
  return context.createSmartFolderId?.() ??
    `smart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const smartFolderMacroAdapters = {
  "smart-folders/open-create-smart-folder-window": async ({ params, context }) => {
    if (!isFolderType(params.type)) {
      return failure(`Unsupported Smart Folder item type "${params.type}".`);
    }
    context.openCreateSmartFolder?.({
      location: params.location,
      type: params.type,
    });
    return { ok: true, changed: true, outputs: { opened: true } };
  },

  "smart-folders/create-smart-folder": async ({ params, context }) => {
    if (!params.label.trim()) return failure("Smart Folder name is required.");
    if (!isFolderType(params.type)) {
      return failure(`Unsupported Smart Folder item type "${params.type}".`);
    }

    const id = createId(context);
    const folder = {
      id,
      name: params.label.trim(),
      type: params.type,
      location: params.location,
      nameQuery: params["name-query"] ?? "",
    };
    context.setSmartFolders([...getSmartFolders(context), folder]);
    context.closeSmartFolderDialog?.();
    context.openSmartFolder?.(id);
    return {
      ok: true,
      changed: true,
      outputs: { "smart-folder-id": id, name: folder.name },
    };
  },

  "smart-folders/open-smart-folder": async ({ params, context }) => {
    const folder = getSmartFolders(context).find(
      (entry) => entry.id === params["smart-folder-id"],
    );
    if (!folder) {
      return failure(`Smart Folder "${params["smart-folder-id"]}" was not found.`);
    }
    context.openSmartFolder?.(folder.id);
    return {
      ok: true,
      changed: true,
      outputs: { "smart-folder-id": folder.id },
    };
  },

  "smart-folders/edit-smart-folder": async ({ params, context }) => {
    if (!params.label.trim()) return failure("Smart Folder name is required.");
    if (!isFolderType(params.type)) {
      return failure(`Unsupported Smart Folder item type "${params.type}".`);
    }

    const folders = getSmartFolders(context);
    const existing = folders.find(
      (entry) => entry.id === params["smart-folder-id"],
    );
    if (!existing) {
      return failure(`Smart Folder "${params["smart-folder-id"]}" was not found.`);
    }

    const updated = {
      ...existing,
      name: params.label.trim(),
      type: params.type,
      location: params.location,
      nameQuery: params["name-query"] ?? "",
    };
    context.setSmartFolders(
      folders.map((entry) => (entry.id === updated.id ? updated : entry)),
    );
    context.closeSmartFolderDialog?.();
    context.openSmartFolder?.(updated.id);
    return {
      ok: true,
      changed: true,
      outputs: { "smart-folder-id": updated.id },
    };
  },

  "smart-folders/delete-smart-folder": async ({ params, context }) => {
    const folders = getSmartFolders(context);
    if (!folders.some((entry) => entry.id === params["smart-folder-id"])) {
      return failure(`Smart Folder "${params["smart-folder-id"]}" was not found.`);
    }
    context.setSmartFolders(
      folders.filter((entry) => entry.id !== params["smart-folder-id"]),
    );
    context.closeSmartFolderDialog?.();
    context.clearSelectedSmartFolder?.(params["smart-folder-id"]);
    return { ok: true, changed: true, outputs: { deleted: true } };
  },
};
