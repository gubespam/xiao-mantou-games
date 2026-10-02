# Recording Design And Implementation Plan

## Goal And Scope

Define how a recording captures successful user behavior as editable macro actions without recording DOM events or replaying clicks. Recording includes:

- Successful committed operations, emitted only after validation and a real state change.
- In-app navigation, including shell tab selection and feature navigation such as opening a directory, trash can, Smart Folder, file editor, or documentation section.
- Opening an application dialog, including confirmation dialogs. Dialog dismissal, cancel, Escape, and closing a dialog are deliberately not commands and are never recorded.

Recording does not capture hover, menu expansion, focus, pointer/key events, failed submissions, or external browser navigation. `download-item` is not recorded as a replayable command by default; see [Playback.md](./Playback.md).

The command metadata remains in [command-list.json](./command-list.json). Its current categories are `files`, `edit-file`, `smart-folders`, `trashes`, and `documentation`. Add a shell-level `navigation` category for tab selection, since a tab is not itself one of those feature command categories. Metadata is declarative; it does not contain executable functions.

## Data Model

Persist completed macros only. An active recording session is held in memory and is discarded on page reload. Add a version now so future schema evolution is explicit; stable keys (name, id) keep input and action references valid when labels change.

```js
const macro = {
  id: "macro-uuid",
  version: 1,
  label: "Create and file report",
  inputs: [
    { name: "report-name", label: "Report name", type: "text", defaultValue: "" },
  ],
  actions: [
    {
      id: "action-uuid",
      commandId: "files/create-file",
      comment: "",
      args: {
        path: { kind: "value", value: "/Reports" },
        "file-name": { kind: "input", inputId: "input-uuid" },
      },
    },
  ],
};
```

Arguments captured from a user action are literals. The editor can later replace a literal with a macro-input reference. If an action consumes an entity created earlier in the same recording, store an action-output reference instead of its runtime ID; details are in [Playback.md](./Playback.md). The macro must not persist ephemeral runtime IDs for newly created entities.

Outputs for a command must be defined in the Command Library; if a new output is needed but not present for a given command, add the output to the Command Library while implementing this feature.

## Handler-to-Recorder Protocol

Expose one callback from the shell to action owners, such as `FilesPage`, `TrashesPage`, and `SmartFoldersPage`:

```js
emitMacroEvent({
  commandId: "files/create-file",
  params: { path: "/Reports", "file-name": "Q3.txt" },
  source: "user",
  outputs: {},
});
```

Protocol rules:

1. `commandId` is globally unique and uses `category/command-key`, for example `files/create-file` or `edit-file/update-file-content`. The UI category `edit-file` maps to the shell tab ID `edit`.
2. `params` contains normalized values using the parameter keys and primitive types declared by the command metadata. Omit optional arguments that were not supplied; the runtime applies metadata defaults when needed.
3. `source` is `user` for UI-originated events and `playback` for runtime dispatch. The recorder accepts only `source: "user"`; this prevents playback from recording itself.
4. `outputs` is runtime-only data returned by successful operations, such as a generated trash-can or trash-item ID. It is consumed immediately by the recorder's ID binder and is not copied verbatim into the saved macro.
5. A failed or no-op transition emits no operation event. Dialog-open and navigation events are emitted when the requested UI/navigation state is successfully entered; their close/cancel paths emit nothing.

Use a narrow event API rather than a general click logger:

```js
function reportUserCommand(commandId, params, result) {
  if (!result.ok || !result.changed) return;
  emitMacroEvent({
    commandId,
    params: result.params ?? params,
    source: "user",
    outputs: result.outputs ?? {},
  });
}
```

For a dialog-open action, `changed` means the dialog entered its open state, not that domain data changed. Emission must occur at the successful point where its owner updates dialog state. A dialog opened and later canceled remains an `open-*` action in the recording, because dismissal is intentionally excluded. This has visible playback consequences: a later command may replace that pending dialog, and a macro whose last action opens a dialog leaves it open when playback ends.

## Record Only Successful Changes

Use the same domain transition helpers from a user handler and the playback adapter. Where extraction is needed, keep it small and return an explicit result before updating React state:

```js
const result = createFileTransition({ tree, path, fileName });
if (!result.ok) {
  setValidationMessage(result.error);
  return;
}

if (!result.changed) return;
setDirectoryTree(result.tree);
reportUserCommand("files/create-file", result.params, result);
```

Do not emit from a `setState` updater: React may re-run or defer updater functions. Compute the transition once from the current snapshot, update the owning state, then emit the immutable event. For transitions that depend on a functional state update, move the pure calculation into an adapter/helper that returns `nextState` and `changed`; do not infer success from whether a setter was called.

Opening a dialog is an event at the state owner, not at a low-level reusable `FileNameWindow` or generic modal. For example, `FilesPage.handleAddItem("file")` reports `files/open-create-item-window` with the current path, kind, and initial name. Submitting the dialog later reports `files/create-file`; canceling it reports nothing. This keeps generic window components independent of the macro system.

## Adapter Ownership And Required Instrumentation

Pass `onMacroEvent` from `TDocs` through the active tab's props. Keep event construction next to the action owner, where validated values and target identity are known.

| Owner | Events to report |
| --- | --- |
| `TDocs.jsx` | Tab changes (`navigation/select-tab`); opening a file/editor; shell-level routes; documentation route commands if owned there. |
| `FilesPage.jsx` | Directory navigation; open/create/rename/move/trash/web-link/delete/explode dialog starts; successful file, folder, web-link, move, trash, delete, and explode operations. Do not report downloads for unattended playback. |
| `EditFilePage` / `FileEditText.jsx` | Editor opening and committed file-content changes. Do not emit individual key presses. |
| `SmartFoldersPage.jsx` | Create/edit/delete dialog opens; successful create, update, delete, and open actions. |
| `TrashesPage.jsx` | Create/rename/settings/delete/empty confirmation opens; successful trash-can/item changes, restore, and selection/open actions. |
| `DocumentationPage.jsx` | Document and section navigation, using document ID and fragment rather than rendered link or scroll events. |

The list is an implementation inventory, not a second command catalog. Keep exact command keys, parameter types, requiredness, dialog-open gaps, output keys, owning route, and playback policy in `command-list.json`. At minimum, inventory dialog opens for file rename, web-link create/edit, move, move-to-trash, delete/explode confirmation, Smart Folder edit/delete, and trash-can create/rename/settings/delete/empty confirmation. Add a metadata audit test so every emitted command has a definition and adapter.

## Recorder State Machine

The shell controller owns this state. `ready` means the user confirmed the macro name and sees the floating record control, but has not pressed Record yet.

| State | Entry and behavior | Accepted transition |
| --- | --- | --- |
| `idle` | No active draft; normal tab interaction. | Create > Record opens naming/confirmation and enters `arming`. |
| `arming` | Name/confirmation flow is visible; no action is being captured. | Confirm creates an in-memory draft, navigates to Files, and enters `ready`; Cancel returns to `idle`. |
| `ready` | Floating red-circle control is visible; Macros tab is disabled. Events are ignored. | Record enters `recording`; X discards the draft and returns to `idle`. |
| `recording` | Append accepted semantic events; floating square is Stop/Save and X is Discard. Macros tab remains disabled. | Stop persists the completed macro and returns to `idle`; X discards it and returns to `idle`. |

Keep the armed and recording flags in a reducer or one controller transition function so impossible combinations (such as “playing and recording”) cannot arise:

```js
function reducer(state, event) {
  switch (`${state.phase}:${event.type}`) {
    case "idle:arm": return { phase: "arming", name: event.name };
    case "arming:confirm": return { phase: "ready", draft: event.draft };
    case "arming:cancel": return { phase: "idle" };
    case "ready:start": return { ...state, phase: "recording" };
    case "ready:discard":
    case "recording:discard": return { phase: "idle" };
    case "recording:save": return { phase: "idle" };
    default: return state;
  }
}
```

In `ready` and `recording`, tab changes and domain commands continue to work and are captured only after recording begins. The Macros tab stays disabled in both states, as specified. Unmounting a feature page must not end a recording; the controller and floating control live above the active tab screen in `TDocs.jsx`. Reloading the page discards the in-memory draft; optionally register a `beforeunload` warning only while `recording`.

On Stop, persist one valid macro through a storage helper using a dedicated key such as `tdocs-macros`; do not write each in-progress event to persistent storage. On X, discard all draft actions. Storage failure should keep the draft in memory and show an error with retry/discard choices rather than silently reporting that it was saved.

## Recorder Engine

Implement a small pure recorder plus a shell controller:

- `createRecording(name)` returns a draft with stable macro ID, version, empty inputs, and empty actions.
- `appendEvent(draft, event, commandLibrary, bindings)` validates the command and normalized params, creates one stable action ID, converts known generated IDs into action-output refs, and returns the next draft plus updated bindings.
- `saveRecording(draft, storage)` validates the complete macro and writes it to the macro collection.
- The React controller owns phase, draft, storage errors, event count, and discard/save intents. It owns no feature-specific business logic.

Keep output bindings as an in-memory map for the duration of recording: `runtimeEntityId -> { actionId, outputKey }`. When a command creates an entity, use the output names declared by command metadata to bind its returned ID. If a later event parameter contains that ID, save an action-output reference. Existing entities not created in this recording remain literal IDs; playback preflight can flag stale references.

For `update-file-content`, `FileEditText` currently emits a full snapshot on each keystroke. Capture only the newest snapshot when the immediately preceding action is also `edit-file/update-file-content` for the same file. Replace that action's content argument, preserving its action ID and order. Do not merge across a different action: doing so would change command ordering. Low-level `split-line`, `indent-line`, and `outdent-line` can remain manually-authored commands unless the editor later exposes stable semantic events for them.

No timestamps or arbitrary delays are recorded. The action list order is the execution order. If an event fails metadata validation, reject that event, keep recording active, and surface a recorder error; never append a malformed partial action.

## Integration Notes And Tests

`TDocs.jsx` already owns shared tree/trash/Smart Folder state and URL changes, making it the appropriate owner for the controller and storage effect. `FilesPage` currently receives `initialPath` and `onPathChange` but keeps `currentPath` local. Synchronize that path with the URL before recording or replaying directory navigation, or the saved command sequence will not describe the visible location reliably.

Add focused Node tests for event acceptance only in `recording`, source filtering, no-op/failure filtering, argument normalization, generated-ID binding, dialog-open/no-close behavior, content snapshot coalescing, state transitions, discard/save behavior, and storage failure. Existing project gates are `npm test` and `npm run build`.
