import assert from "node:assert/strict";
import test from "node:test";
import commandLibrary from "./macros/command-list.json" with { type: "json" };
import { getSmartFolderCommandEntries, isValueMissing } from "./macros/macroEditorUtils.js";

test("smart-folder command categories and actions sort deterministically", () => {
  const entries = getSmartFolderCommandEntries(commandLibrary);

  assert.deepEqual(
    entries.map(([commandId]) => commandId),
    [
      "create-smart-folder",
      "delete-smart-folder",
      "edit-smart-folder",
      "open-create-smart-folder-window",
      "open-smart-folder",
    ],
  );
  assert.equal(entries[0][1].label, "Create smart folder");
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
