# Playback Design And Implementation Plan

## Implemented Scope

Playback currently supports the five `smart-folders/*` commands in the command
library: opening the create dialog, creating, opening, editing, and deleting a
Smart Folder. The engine is command-library-driven and uses an explicit adapter
registry so more categories can be added without changing the runner. It
preflights the complete macro, resolves typed inputs and earlier action outputs,
executes actions in order, supports Stop between actions, and reports completion
or the first runtime failure. Unsupported commands fail before any action runs.

The macro list prompts for macro inputs before playback. While a run is active,
the tab bar and current screen are inert; the floating Stop control remains
available. Smart Folder changes use shell-owned state and are persisted through
the existing storage effect. A final create-dialog action leaves that dialog
open after playback.

## Goal And Scope

Execute a saved macro's semantic commands in order against current TDocs state. Playback must not synthesize clicks or depend on a user's current tab. It resolves macro inputs, validates the whole sequence before starting, routes commands to their owners, blocks user interaction except Stop, and reports the first runtime failure without rolling back earlier successful actions.

Operation, navigation, and dialog-open commands are playable. Dialog close/cancel commands do not exist. Playback of a final dialog-open action leaves the dialog open after the playback lock is released. Browser-level external effects, including downloads and opening external web links, are disabled during unattended playback by default.

## Data And Command Metadata

Use the versioned macro/action schema from [Recording.md](./Recording.md). Playback needs two argument reference forms beyond literals:

```js
const args = {
  name: { kind: "input", inputId: "input-report-name" },
  "trash-can-id": {
    kind: "action-output",
    actionId: "action-create-trash-can",
    outputKey: "trashCanId",
  },
};
```

`kind: "value"` stores a literal. `kind: "input"` refers to a stable macro input ID. `kind: "action-output"` refers to an output declared by an earlier command. Resolve all three to primitive runtime params immediately before dispatch; do not mutate the saved macro during playback.

Extend command metadata with the execution facts not represented in the current file:

```json
{
  "name": "Create trash can",
  "kind": "operation",
  "owner": "trashes",
  "route": { "tab": "trashes" },
  "playback": "allowed",
  "outputs": {
    "trashCanId": { "type": "entity-id", "entity": "trash-can" }
  },
  "parameters": {}
}
```

`kind` is `operation`, `navigation`, or `dialog-open`; `owner` identifies the command adapter/UI bridge; `route` is the application destination needed to execute it; `playback` is `allowed` or `blocked` for external effects and unsupported commands. Add output declarations for generated entities used by later commands, including trash cans, Smart Folders, web links, and trash items. Keep command IDs globally unique as `category/command-key`; use a shell-owned `navigation` category for tab changes. Metadata validation must also support enum constraints where the UI already limits values, for example Smart Folder type and trash automation action.

No macro runtime currently exists, and there is no old macro schema to migrate. Start persisted macros at `version: 1`. If a future version changes the action schema, migrate on load or mark the macro unsupported; never silently reinterpret arguments.

## Handler And Adapter Contract

UI handlers emit events through the callback described in [Recording.md](./Recording.md). Playback bypasses that callback and uses the same pure domain transition helpers as UI operations, with a distinct source so playback can never record itself.

Use an explicit adapter registry rather than deriving functions from command strings:

```js
const commandAdapters = {
  "files/create-file": createFileAdapter,
  "files/open-create-item-window": openCreateItemDialogAdapter,
  "trashes/create-trash-can": createTrashCanAdapter,
};

async function runAdapter(adapter, { params, app, signal, source }) {
  return adapter({ params, app, signal, source });
}
```

Every adapter has the same result shape:

```js
// Success: { ok: true, changed: true, outputs?: { trashCanId: "..." } }
// Failure: { ok: false, error: { code: "not-found", message: "..." } }
```

An adapter must validate current state as well as parameter types. It returns `ok: false` for missing targets, duplicate names, invalid paths, disallowed enum values, unsupported commands, and state conflicts. Return `changed: false` only for a valid no-op; the runner may continue after a no-op. Operation adapters call existing helpers such as `addItem`, `moveItem`, `restoreItem`, or `updateFileContent`, and narrowly extracted pure transitions where the feature currently embeds mutation in a component handler. They do not duplicate validation or synthesize UI events.

The shell owns shared data state in `TDocs.jsx`, but dialog state is local to active feature pages. Keep this boundary explicit:

1. Data and route adapters are shell/domain adapters that operate through the shell's current state snapshot and commit callback.
2. A `MacroUiBridge` handles `dialog-open` commands. It routes to the metadata owner, waits for the active page to register/acknowledge readiness, then requests the specific dialog with normalized parameters. The page maps that typed intent to its existing dialog state (for example `promptKind`, `webLinkTarget`, or `formValue`).
3. The bridge returns only after the open request is accepted, so command order remains deterministic. If the owner cannot open it, return an adapter error.

Do not use `window` events, DOM selectors, button labels, or direct React-state mutation as a command transport. A context/provider or props-based bridge is sufficient; avoid adding a general event-bus package.

## Preflight And Resolution

Before changing app state:

1. Validate `macro.version`, IDs, action shape, command existence, command playback policy, parameter names, requiredness, primitive types, and enum constraints against `command-list.json`.
2. Validate each literal, macro-input reference, and action-output reference. Input IDs must exist and their declared types must match the parameter. An output reference must point to an earlier action and an output declared for that command, with compatible entity/value type.
3. Resolve input values from playback's input prompt or stored defaults. Do not begin playback if a required input is absent or invalid.
4. Resolve optional omitted parameters using metadata defaults. Keep `false`, `0`, and `""` distinct from an omitted value; required empty text is invalid only if that parameter's validation requires non-empty text.
5. Reject a command with `playback: "blocked"` before the first action. The user can edit/remove the command, but playback must not partly run and then discover a known unsupported side effect.

Preflight cannot guarantee that an entity still exists by the time its command executes. Adapters re-check live state and return a descriptive runtime failure for stale external IDs.

## Runtime Context And Generated IDs

Create a fresh context for every run:

```js
const runtime = {
  macroId: macro.id,
  outputs: new Map(), // `${actionId}:${outputKey}` -> actual runtime value
  completedActionIds: [],
  currentActionId: null,
};
```

When an adapter succeeds, validate its returned outputs against metadata and bind them under the producing action ID. Later `action-output` arguments resolve through that map. This lets a recorded create-trash-can action be replayed repeatedly even though each run generates a different actual ID. Do not write runtime IDs back into the macro. For literal IDs that refer to entities which existed before recording, validate at execution and fail with the action name and parameter if the entity is missing.

During recording, the recorder associates a returned output ID with its producing action. When a later user event supplies that ID as a parameter, save an `action-output` reference. This is how the same reference contract supports both recordings and manually edited macros.

## Playback State Machine And Controls

Keep playback state in the TDocs shell, not in an editor or feature page.

| State | Behavior | Transition |
| --- | --- | --- |
| `idle` | No active run. | Play a valid macro enters `preparing`. |
| `preparing` | Prompt for unresolved inputs and run preflight; no app actions have executed. | Successful validation enters `playing`; cancel or validation failure returns to `idle`. |
| `playing` | Execute one action at a time; global interaction shield is active; floating Stop remains operable. | Completion, Stop, or first runtime failure enters `idle` with a final status. |

Keep a run token and abort signal in a ref so a quick Stop or unmount cannot allow an old loop to continue:

```js
async function playMacro(macro, inputs, signal) {
  const prepared = preflightMacro(macro, inputs, commandLibrary);
  const runtime = createPlaybackRuntime(macro);

  for (const action of prepared.actions) {
    if (signal.aborted) return { status: "stopped", runtime };
    runtime.currentActionId = action.id;
    await ensureCommandOwnerReady(action.commandId, signal);

    const result = await dispatchCommand(action.commandId, action.params, {
      runtime,
      signal,
      source: "playback",
    });
    if (!result.ok) {
      return { status: "failed", action, error: result.error, runtime };
    }
    bindOutputs(runtime, action, result.outputs);
    runtime.completedActionIds.push(action.id);
  }

  return { status: "completed", runtime };
}
```

Stop prevents the next action from starting. Most current domain actions are synchronous local-state transitions; if an adapter is asynchronous, it must honor the signal or return before the runner reports stopped. Do not claim rollback: state changes from completed actions remain. Store the last result (completed/stopped/failed, failed action, completed count) in transient UI state for display.

## Interaction Lock, Routing, And Automation

Mount the playback control above the tab screen in `TDocs.jsx`. While `playing`, make tab navigation and application content inert/disabled, including keyboard interaction and dialog buttons. The Stop control remains outside the inert subtree, has an accessible name, and remains available at every viewport. Do not depend on the tab bar's disabled state alone; browser navigation and focused controls also need to be blocked or guarded.

Before dispatch, use metadata `route` to select the appropriate tab and feature location. Await the owning page's readiness before issuing a dialog intent. The current TDocs renderer mounts only the active screen, so a bridge request must not be sent to an unmounted page. The Files adapter also depends on fixing `initialPath`/`onPathChange`: `FilesPage` currently stores path locally, so synchronize it with the URL before playback relies on `/path` navigation.

Trash automation currently owns a timer in `TDocs.jsx` and mutates the same tree/trash state as playback. On entering `playing`, clear and retain the automation deadline; while playing, do not run or schedule a cleanup mutation. Resume the timer after completion/stop/failure using the remaining interval (or immediately run one check if its deadline elapsed). Cleanup must restore the timer even if an adapter throws. Do not pause automation during a recording, because recording observes user behavior rather than applying a deterministic command sequence.

The runner does not call `window.open`, download anchors, or other browser-level effects. Mark such commands blocked in metadata. TDocs internal route changes and in-app documentation links remain allowed. If a future product requirement enables external effects, add an explicit preflight confirmation policy rather than silently allowing them.

## Dialog-Open Semantics

Dialog openings are observable UI actions; dialog closing/canceling is not. During playback:

- A dialog-open adapter routes to its owner and opens the existing dialog with the recorded initial parameters.
- A following operation command validates and applies its parameters directly, then clears the matching pending dialog through the owner's normal completion path. Do not ask for user input while the interaction lock is active.
- A different subsequent command may replace an incompatible pending dialog; route unmount naturally removes page-local dialog UI. Never synthesize a close command or add a recorded close event.
- If the last macro action opens a dialog, finish playback, release the lock, and leave the dialog open and usable.

For a dialog that was opened and canceled during recording, the open action remains in the macro. Document this behavior in the editor so users can remove the open action if the resulting replayed prompt is unwanted.

## Implementation And Verification

Suggested modules under `src/tdocs/macros/`:

- `macroSchema.js`: schema, command/parameter validation, input/output reference resolution, and preflight.
- `commandAdapters.js` or per-domain adapter modules: explicit ID-to-function registry and typed results.
- `playbackEngine.js`: pure ordered runner, cancellation checks, and runtime output map.
- `MacroPlaybackControls.jsx`: shell-mounted progress, stop, and result UI.
- `useMacroUiBridge.js` or context: route/readiness handshake and dialog-open requests.

Test preflight, argument defaults and type mismatches, unknown commands, blocked external actions, output-reference type/order checks, generated-ID rebinding across repeated runs, route readiness, dialog-open terminal behavior, stop between actions, thrown/rejected adapters, partial-state retention, and automation timer restoration. Then run `npm test` and `npm run build`; manually test lock/Stop behavior, dialog transitions, stale pre-existing IDs, and reload-safe playback.
