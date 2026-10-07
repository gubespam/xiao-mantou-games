import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import commandLibrary from "./macros/command-list.json" with { type: "json" };
import { playMacro } from "./macros/macroPlayback.js";
import { smartFolderMacroAdapters } from "./macros/smartFolderMacroAdapters.js";

function createMacro(actions, inputs = []) {
  return {
    id: "macro-playback-test",
    version: 1,
    name: "Playback test",
    inputs,
    actions,
  };
}

function createAction(id, commandId, args) {
  return { id, commandId, comment: "", args };
}

function createContext() {
  let smartFolders = [];
  return {
    getSmartFolders: () => smartFolders,
    setSmartFolders: (next) => {
      smartFolders = next;
    },
    createSmartFolderId: () => "smart-created-by-playback",
  };
}

test("playing a macro creates a Smart Folder named from its input", async () => {
  const macro = createMacro(
    [
      createAction("create-folder", "smart-folders/create-smart-folder", {
        label: { kind: "input", inputId: "folder-name" },
        type: { kind: "value", value: "file" },
        location: { kind: "value", value: "/Reports" },
        "name-query": { kind: "value", value: "quarter" },
      }),
    ],
    [
      {
        id: "folder-name",
        name: "Folder name",
        type: "text",
        defaultValue: "",
      },
    ],
  );
  const context = createContext();

  const result = await playMacro({
    macro,
    inputs: { "folder-name": "Quarterly reports" },
    commandLibrary,
    adapters: smartFolderMacroAdapters,
    context,
  });

  assert.equal(result.status, "completed");
  assert.deepEqual(context.getSmartFolders(), [
    {
      id: "smart-created-by-playback",
      name: "Quarterly reports",
      type: "file",
      location: "/Reports",
      nameQuery: "quarter",
    },
  ]);
});

test("playing resolves IDs returned by an earlier Smart Folder action", async () => {
  const macro = createMacro([
    createAction("create-folder", "smart-folders/create-smart-folder", {
      label: { kind: "value", value: "Draft reports" },
      type: { kind: "value", value: "file" },
      location: { kind: "value", value: "/" },
      "name-query": { kind: "value", value: "" },
    }),
    createAction("edit-folder", "smart-folders/edit-smart-folder", {
      "smart-folder-id": {
        kind: "action-output",
        actionId: "create-folder",
        outputKey: "smart-folder-id",
      },
      label: { kind: "value", value: "Final reports" },
      type: { kind: "value", value: "file" },
      location: { kind: "value", value: "/Reports" },
      "name-query": { kind: "value", value: "final" },
    }),
  ]);
  const context = createContext();

  const result = await playMacro({
    macro,
    commandLibrary,
    adapters: smartFolderMacroAdapters,
    context,
  });

  assert.equal(result.status, "completed");
  assert.deepEqual(context.getSmartFolders(), [
    {
      id: "smart-created-by-playback",
      name: "Final reports",
      type: "file",
      location: "/Reports",
      nameQuery: "final",
    },
  ]);
});

test("preflight rejects unsupported actions before applying any action", async () => {
  const macro = createMacro([
    createAction("create-folder", "smart-folders/create-smart-folder", {
      label: { kind: "value", value: "Reports" },
      type: { kind: "value", value: "file" },
      location: { kind: "value", value: "/" },
      "name-query": { kind: "value", value: "" },
    }),
    createAction("create-file", "files/create-file", {}),
  ]);
  const context = createContext();

  const result = await playMacro({
    macro,
    commandLibrary,
    adapters: smartFolderMacroAdapters,
    context,
  });

  assert.equal(result.status, "failed");
  assert.match(result.error, /Unsupported macro command "files\/create-file"/);
  assert.deepEqual(context.getSmartFolders(), []);
});

test("Stop prevents the next action from starting", async () => {
  const macro = createMacro([
    createAction("create-folder", "smart-folders/create-smart-folder", {
      label: { kind: "value", value: "Reports" },
      type: { kind: "value", value: "file" },
      location: { kind: "value", value: "/" },
      "name-query": { kind: "value", value: "" },
    }),
    createAction("delete-folder", "smart-folders/delete-smart-folder", {
      "smart-folder-id": { kind: "value", value: "existing-folder" },
    }),
  ]);
  const controller = new AbortController();
  const context = createContext();

  const result = await playMacro({
    macro,
    commandLibrary,
    adapters: smartFolderMacroAdapters,
    context,
    signal: controller.signal,
    onProgress: () => controller.abort(),
  });

  assert.equal(result.status, "stopped");
  assert.deepEqual(result.completedActionIds, ["create-folder"]);
  assert.equal(context.getSmartFolders().length, 1);
});

test("macro list renders a Play button for saved macros", async () => {
  const vite = await createServer({
    configFile: new URL("../../vite.config.js", import.meta.url).pathname,
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const { default: MacroEditorTab } = await vite.ssrLoadModule(
      "/src/tdocs/macros/MacroEditorTab.jsx",
    );
    const markup = renderToStaticMarkup(
      React.createElement(MacroEditorTab, {
        macros: [{ id: "saved-macro", name: "Saved macro", version: 1, inputs: [], actions: [] }],
      }),
    );

    assert.match(markup, /Saved macro/);
    assert.match(markup, />Play</);
  } finally {
    await vite.close();
  }
});
