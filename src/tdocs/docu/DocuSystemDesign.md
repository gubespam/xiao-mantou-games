# TDocs Documentation System Design

**Status:** Proposed design. The Markdown renderer described here is not implemented yet.

**Related:** [Implementation plan](DocuSyncImplPlan.md), [published documentation index](Main.md), and [current TDocs overview](Documentation/TDocs-Overview.md).

## Purpose

The Documentation tab should render the guide files under `src/tdocs/docu` without maintaining a second JSX or HTML copy. Markdown remains the editable source of truth; a build bundles the source text and the browser turns the selected document into React-rendered content.

The design favors browser-side rendering because the current corpus is small and fixed at build time. It does not require the browser to fetch source files from a special URL, and it does not require a separate synchronization job in GitHub Actions.

## Current State

- The application is a React SPA. `main.jsx` mounts the router, and `App.jsx` maps `/xiao-mantou-games/TDocs` to the TDocs workspace.
- `TDocs.jsx` selects a tab from the `tab` query parameter. When it is absent, TDocs defaults to the Trashes tab.
- The Documentation tab currently renders a placeholder saying that documentation is coming soon.
- `Main.md` is the user-facing table of contents. It links to the guide files using relative Markdown links. Links also occur in nested folders, so their targets must be resolved from the file containing the link.
- `Outline.md` is an internal editorial outline and is not linked from `Main.md`.
- The current Markdown guides use headings, prose, lists, and links. They do not currently contain fenced code blocks, image syntax, raw HTML, or heading-fragment links.
- Vite uses the `/xiao-mantou-games/` base path. The deployment workflow runs the normal Vite build; no Markdown-generation step exists.
- `TDocs.jsx` currently updates query state with `setSearchParams(..., { replace: true })`. This is appropriate for several existing workspace-state updates but should not be reused for document-link clicks if Back and Forward are expected to traverse documents.

Useful implementation references: [TDocs.jsx](../TDocs.jsx), [TDocs.css](../TDocs.css), [App.jsx](../../App.jsx), [main.jsx](../../main.jsx), [Vite config](../../../vite.config.js), and [deployment workflow](../../../.github/workflows/deploy.yml).

## Goals

1. Keep Markdown files as the one source of guide content.
2. Render the Documentation tab inside the existing TDocs application and route.
3. Make relative Markdown links navigate to the corresponding in-app document.
4. Support direct links, reloads, and browser Back/Forward for selected documents.
5. Keep internal planning files out of the user-facing document registry.
6. Avoid a generated artifact that can become stale relative to its Markdown source.

## Non-goals

- A Markdown authoring editor, live preview, or user-generated Markdown.
- Syntax highlighting, custom image hosting, or raw HTML support.
- A general-purpose content management system.
- A redesign of the other TDocs tabs.

## Proposed Rendering Architecture

### 1. Bundle source Markdown

A small documentation module under `src/tdocs` will use Vite's `import.meta.glob` with raw imports to obtain the text of Markdown files at build time. A conceptual form is:

```js
const markdownByPath = import.meta.glob(
  [
    "./docu/**/*.md",
    "!./docu/Outline.md",
    "!./docu/DocuSystemDesign.md",
    "!./docu/DocuSyncImplPlan.md",
  ],
  { eager: true, query: "?raw", import: "default" },
);
```

The exact glob keys should be checked against Vite's actual output and normalized in one place. The registry should expose only intended user-facing documents. The public index is `Main.md`; the guide list linked from it is the initial set of published pages. New internal documents must not become user-facing pages merely because they match a glob.

The design files in this folder are source documentation, not public TDocs pages. If a future implementation chooses a broader import glob, it must still exclude these files from the public route registry. If internal text must not be present in the shipped JavaScript bundle, exclude it at import time as well; a route allowlist alone prevents rendering but does not remove bundled text.

### 2. Select a document from URL state

The existing TDocs route remains the entry point. The `tab` parameter selects Documentation and a `doc` parameter identifies the page. A stable document ID is the path relative to the `docu` directory without the `.md` extension. For example:

```text
/xiao-mantou-games/TDocs?tab=documentation&doc=Trashes/Trash-Cans
```

When `tab=documentation` has no `doc`, render `Main.md`. Preserve unrelated query parameters when changing the selected document. Invalid or non-public IDs should render the index with a concise not-found notice and canonicalize the invalid selection using a replace-style URL update; they must never resolve to an arbitrary imported file.

### 3. Parse and render only the selected page

Use a React Markdown renderer such as `react-markdown` to turn the selected source string into React elements. Render only the selected document rather than parsing every guide during initial application startup. Raw HTML stays disabled. The renderer should use custom link handling for local Markdown targets and the parser's safe URL handling, with an explicit policy that disallows executable schemes such as `javascript:`.

The rendered page is part of the normal React tree and inherits TDocs navigation and styling. Markdown is not evaluated as JavaScript and does not become executable JSX source.

### 4. Resolve document links

For a relative link ending in `.md`, resolve the target relative to the current Markdown file's directory, normalize `.` and `..`, and map the normalized path to a known public document ID. Do not resolve from the browser's current URL, and do not navigate the browser to a `.md` source URL.

- A valid local `.md` link updates the `doc` query parameter and keeps `tab=documentation`.
- A fragment-only link stays on the selected document and targets the matching heading.
- External `http:`, `https:`, `mailto:`, and other explicitly allowed schemes remain ordinary links. Reject unsafe schemes.
- A relative target that escapes the documentation root, points to a non-public file, or cannot be resolved is not treated as a valid document route. Preserve readable link text and show a useful unavailable-target outcome rather than rendering a broken SPA route.

There are no fragment links in the current corpus. If fragment navigation is supported, headings must receive deterministic IDs (including duplicate-heading handling), for example through a slugging plugin. Cross-document fragments must update the document and then scroll after the new content has rendered.

### 5. History and URL behavior

Document-link navigation should create a browser history entry. This lets Back return from a guide to the preceding guide or index, and Forward restore the next document. Implement this separately from TDocs' existing replace-style state helper; React Router navigation without `replace` is the intended behavior for a clicked document link.

Tab changes and unrelated workspace state can keep their current replace semantics. On browser Back/Forward, the `doc` query value is the source of truth and the rendered page follows it. Directly loading or refreshing a URL with both query parameters should restore the selected guide.

## Content and Authoring Rules

- `Main.md` is the public table of contents and the default documentation page.
- Published guides are the Markdown pages reachable from the public index and registered for rendering.
- `Outline.md`, `DocuSystemDesign.md`, and `DocuSyncImplPlan.md` are internal authoring/design material; do not add them to `Main.md` or the public document registry.
- Write local guide links as relative `.md` paths from the source file containing the link. Check links from nested folders carefully.
- Use CommonMark-compatible headings, paragraphs, lists, and links. Add parser plugins only when actual docs content needs their syntax.
- When a new guide is added, add its link to `Main.md`, include it in the public registry/import policy, and verify all incoming and outgoing links.

## Safety, Errors, and Performance

Markdown in this repository is trusted source, but the renderer should still avoid raw HTML and unsafe URL protocols. A link resolver must constrain local navigation to known public documents after normalization; string-prefix checks alone are not sufficient protection against path traversal or encoded paths.

An invalid `doc` query value should not crash the Documentation tab. Show `Main.md` and a small notice, then replace the invalid URL state with the canonical default. A source link whose local target is not registered should remain understandable and be reported during validation rather than produce a blank screen.

Eager raw imports include the Markdown text in the frontend bundle, so size grows with the corpus. The current short guides make this a reasonable tradeoff and avoid network round-trips. Parse just the selected source. Revisit lazy imports if the document corpus or measured bundle cost grows materially.

## Build and Deployment

Vite compiles the raw Markdown imports as part of the normal frontend build. Because the renderer consumes the repository's Markdown files directly, edits are picked up by local development and production builds without a generated JSX snapshot or a separate GitHub Actions sync step. The `/xiao-mantou-games/` base and existing SPA fallback must continue to support a direct reload of the TDocs URL with its query string.

### Build-time fallback

If measurements or Vite constraints make browser parsing unsuitable, use a deterministic build-time conversion as the fallback. Add a Node generation script (or an equivalent Vite build plugin) that reads only the published Markdown set and runs automatically as part of `npm run build`, which GitHub Actions already invokes. Generate build output from Markdown during every build; do not rely on a manually maintained JSX copy. The generated output should be reproducible, and generation errors or broken local links should fail CI.

## Acceptance Criteria

- The Documentation tab displays `Main.md` by default and displays a selected guide when its `doc` query parameter identifies a published page.
- Relative links work from both top-level and nested Markdown files, and external links remain external.
- Direct refresh and Back/Forward restore the document represented by the URL.
- Unknown, internal, malformed, and traversal-like document IDs cannot expose arbitrary content or break the tab.
- The build consumes Markdown as its source and needs no separate manual synchronization action.
- The current guide content remains readable with the existing TDocs dark theme.
