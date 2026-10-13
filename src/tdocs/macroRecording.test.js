import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import commandLibrary from "./macros/command-list.json" with { type: "json" };
import {
  appendRecordedMacroEvent,
  createMacroDraft,
} from "./macros/macroRecording.js";

function recordEvent(macro, bindings, event) {
  return appendRecordedMacroEvent(macro, event, bindings, commandLibrary);
}

test("recorder accepts only changed user events and validates command arguments", () => {
  const macro = createMacroDraft("Smart folder workflow");
  const bindings = new Map();

  const ignoredPlayback = recordEvent(macro, bindings, {
    commandId: "smart-folders/delete-smart-folder",
    params: { "smart-folder-id": "folder-1" },
    source: "playback",
    changed: true,
  });
  assert.equal(ignoredPlayback.accepted, false);
  assert.equal(ignoredPlayback.macro.actions.length, 0);

  const ignoredNoop = recordEvent(macro, bindings, {
    commandId: "smart-folders/delete-smart-folder",
    params: { "smart-folder-id": "folder-1" },
    source: "user",
    changed: false,
  });
  assert.equal(ignoredNoop.accepted, false);

  const invalid = recordEvent(macro, bindings, {
    commandId: "smart-folders/create-smart-folder",
    params: { label: "", type: "file", location: "/" },
    source: "user",
    changed: true,
  });
  assert.equal(invalid.accepted, false);
  assert.match(invalid.error, /Missing required value "label"/);
});

test("recorded documentation actions accept macro input parameters", async () => {
  let macro = createMacroDraft("Documentation workflow");
  let bindings = new Map();

  const events = [
    {
      commandId: "documentation/navigate-to-documentation-section",
      params: {
        "document-id": "Guide",
        fragment: "advanced",
      },
      outputs: { "document-id": "Guide", fragment: "advanced" },
      source: "user",
      changed: true,
    },
  ];

  for (const event of events) {
    const result = recordEvent(macro, bindings, event);
    assert.equal(result.accepted, true, result.error);
    macro = result.macro;
    bindings = result.bindings;
  }

  assert.deepEqual(
    macro.actions.map((action) => action.commandId),
    [
      "documentation/navigate-to-documentation-section",
    ],
  );
  assert.equal(macro.actions[0].args["document-id"].kind, "value");
  assert.equal(macro.actions[1].args.fragment.kind, "value");

  const vite = await createServer({
    configFile: new URL("../../vite.config.js", import.meta.url).pathname,
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const { default: MacroEditorTab } = await vite.ssrLoadModule(
      "/src/tdocs/macros/MacroEditorTab.jsx",
    );
    const editorMarkup = renderToStaticMarkup(
      React.createElement(MacroEditorTab, {
        macros: [macro],
        selectedMacroId: macro.id,
      }),
    );

    assert.match(editorMarkup, /Open documentation page/);
    assert.match(editorMarkup, /Navigate to documentation section/);
  } finally {
    await vite.close();
  }
});

test("recorded Smart Folder create, edit, and delete actions appear in the editor", async () => {
  let macro = createMacroDraft("Smart folder workflow");
  let bindings = new Map();

  const events = [
    {
      commandId: "smart-folders/create-smart-folder",
      params: {
        label: "Quarterly reports",
        type: "file",
        location: "/Reports",
        "name-query": "quarter",
      },
      outputs: { "smart-folder-id": "folder-generated-1", name: "Quarterly reports" },
      source: "user",
      changed: true,
    },
    {
      commandId: "smart-folders/edit-smart-folder",
      params: {
        "smart-folder-id": "folder-generated-1",
        label: "Quarterly summaries",
        type: "file",
        location: "/Reports",
        "name-query": "summary",
      },
      outputs: { "smart-folder-id": "folder-generated-1" },
      source: "user",
      changed: true,
    },
    {
      commandId: "smart-folders/delete-smart-folder",
      params: { "smart-folder-id": "folder-generated-1" },
      outputs: { deleted: true },
      source: "user",
      changed: true,
    },
  ];

  for (const event of events) {
    const result = recordEvent(macro, bindings, event);
    assert.equal(result.accepted, true, result.error);
    macro = result.macro;
    bindings = result.bindings;
  }

  assert.deepEqual(
    macro.actions.map((action) => action.commandId),
    [
      "smart-folders/create-smart-folder",
      "smart-folders/edit-smart-folder",
      "smart-folders/delete-smart-folder",
    ],
  );
  assert.deepEqual(macro.actions[1].args["smart-folder-id"], {
    kind: "action-output",
    actionId: macro.actions[0].id,
    outputKey: "smart-folder-id",
  });
  assert.deepEqual(macro.actions[2].args["smart-folder-id"], {
    kind: "action-output",
    actionId: macro.actions[1].id,
    outputKey: "smart-folder-id",
  });

  const vite = await createServer({
    configFile: new URL("../../vite.config.js", import.meta.url).pathname,
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const { default: MacroEditorTab } = await vite.ssrLoadModule(
      "/src/tdocs/macros/MacroEditorTab.jsx",
    );
    const editorMarkup = renderToStaticMarkup(
      React.createElement(MacroEditorTab, {
        macros: [macro],
        selectedMacroId: macro.id,
      }),
    );

    assert.match(editorMarkup, /Create smart folder/);
    assert.match(editorMarkup, /Edit smart folder/);
    assert.match(editorMarkup, /Delete smart folder/);
  } finally {
    await vite.close();
  }
});
