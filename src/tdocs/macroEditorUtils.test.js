import assert from "node:assert/strict";
import test from "node:test";
import commandLibrary from "./macros/command-list.json" with { type: "json" };
import {
  getCommandEntries,
  getSmartFolderCommandEntries,
  isValueMissing,
  reorderActions,
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
  assert.ok(entries.some(([commandId]) => commandId === "documentation/navigate-to-documentation-section"));
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

test("reordering actions inserts before or after the target without changing action objects", () => {
  const actions = [{ id: "a" }, { id: "b" }, { id: "c" }];

  assert.deepEqual(
    reorderActions(actions, "c", "a", "before").map(({ id }) => id),
    ["c", "a", "b"],
  );
  assert.deepEqual(
    reorderActions(actions, "a", "c", "after").map(({ id }) => id),
    ["b", "c", "a"],
  );
  assert.equal(reorderActions(actions, "b", "b", "after")[1], actions[1]);
  assert.deepEqual(reorderActions(actions, "missing", "a", "before"), actions);
});
