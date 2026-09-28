import assert from "node:assert/strict";
import test from "node:test";
import { resolveDocumentLink } from "./documentLinks.js";

const publicDocumentIds = new Set([
  "Main",
  "Files/Files",
  "Trashes/Trash-Cans",
  "Trashes/Trash-Can-Automation/Trash-Can-Automation",
]);

test("resolves top-level document links from the index", () => {
  assert.deepEqual(
    resolveDocumentLink("Main", "Files/Files.md", publicDocumentIds),
    { type: "document", documentId: "Files/Files", fragment: null },
  );
});

test("resolves nested relative links and fragments", () => {
  assert.deepEqual(
    resolveDocumentLink(
      "Trashes/Trash-Can-Automation/Trash-Can-Automation",
      "../Trash-Cans.md#restore-items",
      publicDocumentIds,
    ),
    { type: "document", documentId: "Trashes/Trash-Cans", fragment: "restore-items" },
  );
  assert.deepEqual(
    resolveDocumentLink("Main", "#contents", publicDocumentIds),
    { type: "fragment", fragment: "contents" },
  );
});

test("allows safe external links and rejects active schemes", () => {
  assert.equal(
    resolveDocumentLink("Main", "https://example.com/docs", publicDocumentIds).type,
    "external",
  );
  assert.equal(
    resolveDocumentLink("Main", "mailto:help@example.com", publicDocumentIds).type,
    "external",
  );
  for (const href of ["javascript:alert(1)", "data:text/html,test", "//example.com"]) {
    assert.deepEqual(resolveDocumentLink("Main", href, publicDocumentIds), {
      type: "invalid",
    });
  }
});

test("rejects malformed encoding, root traversal, and non-public documents", () => {
  for (const href of [
    "%E0%A4%A.md",
    "../Outline.md",
    "%2e%2e/Outline.md",
    "Trashes/Private.md",
    "Files/Files.md?mode=raw",
    "Files/Files%5c.md",
  ]) {
    assert.deepEqual(resolveDocumentLink("Main", href, publicDocumentIds), {
      type: "invalid",
    });
  }
  assert.deepEqual(
    resolveDocumentLink("Trashes/Trash-Cans", "../Main.md", publicDocumentIds),
    { type: "document", documentId: "Main", fragment: null },
  );
  assert.deepEqual(
    resolveDocumentLink("Trashes/Trash-Cans", "../../Main.md", publicDocumentIds),
    { type: "invalid" },
  );
});