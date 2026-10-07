# Macro List And Editor Clarifications

This document fills gaps in [Spec.md](./Spec.md); it does not restate the specified layout, action panel controls, or basic create/rename/delete/play workflows. The editor edits a declarative macro. It does not execute commands; execution and recording are owned by the shell as described in [Recording.md](./Recording.md) and [Playback.md](./Playback.md).

## Stable Identity And Persisted Shape

Use stable IDs for macros, inputs, and actions. A display name is not an identity: renaming an input must not invalidate actions that reference it. Each persisted macro has `version: 1`; each action has a composite `commandId` such as `files/create-file`, a stable action ID, a comment, and a parameter-keyed argument map.

```js
{
  id: "macro-id",
  version: 1,
  name: "Create report",
  inputs: [{ id: "input-id", name: "Report name", type: "text", defaultValue: "" }],
  actions: [{
    id: "action-id",
    commandId: "files/create-file",
    comment: "",
    args: {
      path: { kind: "value", value: "/Reports" },
      "file-name": { kind: "input", inputId: "input-id" },
    },
  }],
}
```

Arguments use a discriminated union: `{ kind: "value", value }`, `{ kind: "input", inputId }`, or `{ kind: "action-output", actionId, outputKey }`. The last form is needed for recorded actions that create an entity and then refer to its generated ID. In the UI, keep the spec's “From input” affordance, and offer a distinct “From previous action” choice only for compatible outputs declared in command metadata. Do not expose runtime IDs as input values.

## Command Metadata Is The Editor Contract

The editor loads the command library as data. Sort category names and command names alphabetically as specified. For each action, derive parameter labels, primitive controls, requiredness, defaults, supported enum choices, owner, command kind, outputs, and playback policy from metadata; do not maintain a second hard-coded editor catalog.

The current metadata should be extended with `kind` (`operation`, `navigation`, or `dialog-open`), `owner`/route, output declarations, enum constraints, and playback policy. Keep command IDs stable when user-facing names change. When opening an old/unknown command ID, preserve the action and show it as unsupported rather than silently deleting it; the user can remove or replace it, and playback preflight remains blocked until it is valid.

## Validation And Editing Semantics

Validate the whole macro both while editing and before playback. In the editor, show argument-level errors for missing required values, primitive-type mismatches, invalid input references, incompatible output references, invalid enum values, and unsupported commands. A metadata default is used only when the argument is omitted; it must not overwrite an explicitly supplied `false`, `0`, or empty string. Requiredness and domain validation are separate: for example, a required text parameter may still need a non-empty value or a valid URL according to its adapter.

Keep incomplete work editable and persist it; do not reject every keystroke or discard invalid actions. Disable Play and show the validation summary until preflight passes. Editing an action's command type resets its argument map to that command's defaults rather than carrying same-named values with potentially different semantics.

When a command is invalid for any reason, provide on-screen feedback to the user concisely describing the problem and what must be done to correct it. Show this message in red below the offending command or parameter.

Reference maintenance rules:

- Renaming an input preserves its ID and all references.
- Changing an input's type preserves its ID but marks references with incompatible command parameter types invalid; do not coerce values implicitly.
- Deleting an input leaves affected arguments visibly unresolved. Allow the edit to persist, but prevent playback until each reference is repaired or changed to a literal.
- Reordering actions is allowed, but an action-output reference must point to an earlier action. If a reorder violates that rule, show the error and block playback; do not silently rewrite its source.
- Deleting an action leaves downstream references visibly unresolved. Offer a repair path or let the user remove/change those arguments; do not silently substitute a different output.

## Save, Navigation, And List Behavior

Use the existing TDocs localStorage pattern with a dedicated macro key. Persist editor changes as they are committed to the React model so leaving the editor or changing tabs does not lose work. A transient field draft may remain local until blur/Enter, but do not introduce an unsaved multi-step transaction for the entire macro. If storage fails, keep the in-memory edit and surface a retry/error state.

Represent list and editor selection with the existing TDocs query-string navigation, for example `tab=macros` and optional `macro=<id>`. Returning from the editor should preserve the list selection/scroll where practical. Deleting the selected macro returns to the list and clears the selected ID. Always show a confirmation dialog that names the macro before deleting it; do not delete on row selection. Macro names need not be unique for identity, though a duplicate-name warning is useful because the list displays names.

The Macros tab is disabled while a recording is armed or active, per the spec. Playback is a shell-wide lock: the editor and list are non-interactive during a run, and only the floating Stop control is available. Starting a recording from the list first creates a named draft, then follows the arm/confirm/record states in [Recording.md](./Recording.md); opening the editor is not itself a recording action.

## Recording-Specific Editing

Recorded argument values are literals initially. Users may add inputs and replace repeated literals with input references in the editor. Entity IDs produced during a recording are represented as action-output references, so repeated playback can bind newly generated IDs. Input references and action-output references should have clear source labels; the latter should be limited to prior actions with metadata-declared compatible outputs.

Dialog-open commands are ordinary actions in the ordered list, distinct from the later operation that commits the dialog. Dialog closes/cancels are absent. A recording can therefore contain an open-dialog action even if the user canceled that dialog while recording. If that prompt is not desired on replay, the user can delete the open action without deleting the following operation. If the last action opens a dialog, playback leaves it open after unlocking the app.

Do not present every editor keystroke as an action. Consecutive file-content snapshots for the same file are coalesced by the recording engine; an action comment can explain the resulting update. Manual line-level commands remain available only if their parameters are valid and the playback adapter supports them.

## Focused Tests

Test that command categories and actions sort deterministically, required values use metadata, `false`/`0` are not mistaken for missing values, input renames preserve references, incompatible type changes are flagged, action-output selectors include only earlier compatible outputs, reorder/delete operations surface broken references, unsupported commands remain visible, autosave round-trips the macro, and playback is disabled for invalid macros.
