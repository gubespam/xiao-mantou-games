import assert from "node:assert/strict";
import test from "node:test";
import commandLibrary from "./macros/command-list.json" with { type: "json" };
import {
  getCommandEntries,
  getSmartFolderCommandEntries,
  isValueMissing,
} from "./macros/macroEditorUtils.js";

test("smart-folder command categories and actions sort deterministically", () => {
  const entries = getSmartFolderCommandEntries(commandLibrary);

  assert.deepEqual(
    entries.map(([commandId]) => commandId),
    [
      "smart-folders/create-smart-folder",
      "smart-folders/delete-smart-folder",
      "smart-folders/edit-smart-folder",
      "smart-folders/open-create-smart-folder-window",
      "smart-folders/open-smart-folder",
    ],
  );
  assert.equal(entries[0][1].label, "Create smart folder");
});

test("full command library exposes commands across all categories", () => {
  const entries = getCommandEntries(commandLibrary);
  assert.ok(entries.some(([commandId]) => commandId === "files/open-directory"));
  assert.ok(entries.some(([commandId]) => commandId === "trashes/create-trash-can"));
  assert.ok(entries.some(([commandId]) => commandId === "documentation/open-documentation-page"));
});

test("required values treat false and 0 as present, but empty text stays missing", () => {
  assert.equal(
    isValueMissing({ type: "number", required: true, defaultValue: 0 }, 0),
    false,
  );
  assert.equal(
    isValueMissing({ type: "boolean", required: true, defaultValue: false }, false),
    false,
  );
  assert.equal(
    isValueMissing({ type: "text", required: true, defaultValue: "" }, ""),
    true,
  );
});
