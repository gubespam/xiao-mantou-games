import React, { useEffect, useMemo, useRef, useState } from "react";
import "./MacroEditorTab.css";
import commandLibrary from "./command-list.json" with { type: "json" };
import {
  getCommandEntries,
  getDefaultValueForType,
  isValueMissing,
  reorderActions,
} from "./macroEditorUtils.js";

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function createMacro(name = "New macro") {
  return {
    id: createId("macro"),
    version: 1,
    name,
    inputs: [],
    actions: [],
  };
}

function resolveCommandById(commandId) {
  const [categoryName, commandKey] = String(commandId).split("/");

  if (categoryName && commandKey && commandLibrary.categories?.[categoryName]?.[commandKey]) {
    return commandLibrary.categories[categoryName][commandKey];
  }

  for (const [category, commands] of Object.entries(commandLibrary.categories ?? {})) {
    const match = commands?.[commandId];
    if (match) {
      return match;
    }
  }

  return null;
}

function createAction(commandId) {
  const command = resolveCommandById(commandId);
  const args = {};

  Object.entries(command?.parameters ?? {}).forEach(([parameterKey, parameter]) => {
    const computedValue = parameter.defaultValue ?? getDefaultValueForType(parameter.type);
    args[parameterKey] = { kind: "value", value: computedValue };
  });

  return {
    id: createId("action"),
    commandId,
    comment: "",
    args,
  };
}

function getActionCommand(action, commandsById) {
  return commandsById[action.commandId] ?? null;
}

function getArgumentValue(action, parameterKey, parameter) {
  const existingValue = action.args?.[parameterKey];
  if (existingValue && typeof existingValue === "object") {
    return existingValue;
  }
  return {
    kind: "value",
    value: parameter.defaultValue ?? getDefaultValueForType(parameter.type),
  };
}

function MacroEditorTab({
  macros = [],
  onMacrosChange = () => {},
  selectedMacroId,
  onSelectedMacroIdChange = () => {},
  onStartRecording = () => {},
  onPlayMacro = () => {},
  playbackActive = false,
}) {
  const commandEntries = useMemo(() => getCommandEntries(commandLibrary), []);
  const commandsById = useMemo(
    () =>
      Object.fromEntries(
        commandEntries.map(([commandId, command]) => [commandId, command]),
      ),
    [commandEntries],
  );
  const groupedCommandEntries = useMemo(() => {
    const grouped = {};

    commandEntries.forEach(([commandId, command, categoryName]) => {
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push([commandId, command]);
    });

    return Object.entries(grouped).sort(([left], [right]) => left.localeCompare(right));
  }, [commandEntries]);
  const [commandPickerOpen, setCommandPickerOpen] = useState(false);
  const [expandedActionIds, setExpandedActionIds] = useState({});
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [recordingName, setRecordingName] = useState(null);
  const [recordingNameError, setRecordingNameError] = useState("");
  const [macroToDelete, setMacroToDelete] = useState(null);
  const [macroToPlay, setMacroToPlay] = useState(null);
  const [macroInputValues, setMacroInputValues] = useState({});
  const [draggedActionId, setDraggedActionId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const commandPickerRef = useRef(null);

  const selectedMacro = macros.find((macro) => macro.id === selectedMacroId) ?? null;

  useEffect(() => {
    if (!commandPickerOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!commandPickerRef.current) {
        return;
      }

      if (!commandPickerRef.current.contains(event.target)) {
        setCommandPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [commandPickerOpen]);

  function updateMacroList(updater) {
    onMacrosChange((currentMacros) => updater(currentMacros));
  }

  function updateSelectedMacro(updater) {
    if (!selectedMacro) {
      return;
    }

    updateMacroList((currentMacros) =>
      currentMacros.map((macro) =>
        macro.id === selectedMacro.id ? updater(macro) : macro,
      ),
    );
  }

  function addMacro() {
    const newMacro = createMacro();
    updateMacroList((currentMacros) => [...currentMacros, newMacro]);
    onSelectedMacroIdChange(newMacro.id);
    setCreateMenuOpen(false);
  }

  function requestPlay(macro) {
    if (playbackActive) return;
    if (!macro.inputs?.length) {
      onPlayMacro(macro, {});
      return;
    }
    setMacroInputValues(
      Object.fromEntries(
        macro.inputs.map((input) => [
          input.id,
          input.defaultValue ?? getDefaultValueForType(input.type),
        ]),
      ),
    );
    setMacroToPlay(macro);
  }

  function startPlayback(event) {
    event.preventDefault();
    onPlayMacro(macroToPlay, macroInputValues);
    setMacroToPlay(null);
    setMacroInputValues({});
  }

  function startRecording(event) {
    event.preventDefault();
    const name = recordingName.trim();
    if (!name) {
      setRecordingNameError("Please enter a macro name.");
      return;
    }

    onStartRecording(name);
    setRecordingName(null);
    setRecordingNameError("");
  }

  function deleteMacro(macroId) {
    updateMacroList((currentMacros) => currentMacros.filter((macro) => macro.id !== macroId));
    if (selectedMacroId === macroId) {
      onSelectedMacroIdChange(null);
    }
  }

  function addAction(commandId) {
    if (!selectedMacro) {
      return;
    }

    updateSelectedMacro((macro) => ({
      ...macro,
      actions: [...macro.actions, createAction(commandId)],
    }));
    setCommandPickerOpen(false);
  }

  function deleteAction(actionId) {
    updateSelectedMacro((macro) => ({
      ...macro,
      actions: macro.actions.filter((action) => action.id !== actionId),
    }));
  }

  function moveAction(sourceActionId, targetActionId, position) {
    updateSelectedMacro((macro) => ({
      ...macro,
      actions: reorderActions(
        macro.actions,
        sourceActionId,
        targetActionId,
        position,
      ),
    }));
  }

  function finishActionDrag() {
    setDraggedActionId(null);
    setDropTarget(null);
  }

  function updateMacroName(nextName) {
    updateSelectedMacro((macro) => ({ ...macro, name: nextName }));
  }

  function updateInput(inputId, updates) {
    updateSelectedMacro((macro) => ({
      ...macro,
      inputs: macro.inputs.map((input) =>
        input.id === inputId ? { ...input, ...updates } : input,
      ),
    }));
  }

  function addInput() {
    updateSelectedMacro((macro) => ({
      ...macro,
      inputs: [
        ...macro.inputs,
        {
          id: createId("input"),
          name: `Input ${macro.inputs.length + 1}`,
          type: "text",
          defaultValue: "",
        },
      ],
    }));
  }

  function updateActionArgument(actionId, parameterKey, nextArg) {
    updateSelectedMacro((macro) => ({
      ...macro,
      actions: macro.actions.map((action) => {
        if (action.id !== actionId) {
          return action;
        }

        return {
          ...action,
          args: {
            ...action.args,
            [parameterKey]: nextArg,
          },
        };
      }),
    }));
  }

  function renderArgumentInput(action, parameterKey, parameter) {
    const argument = getArgumentValue(action, parameterKey, parameter);
    const value = argument.value;
    const isInputRef = argument.kind === "input";
    const isActionOutputRef = argument.kind === "action-output";
    const outputAction = isActionOutputRef
      ? selectedMacro?.actions.find((entry) => entry.id === argument.actionId)
      : null;
    const outputCommand = outputAction
      ? commandsById[outputAction.commandId]
      : null;
    const outputLabel =
      outputCommand?.outputs?.[argument.outputKey]?.label ?? argument.outputKey;
    const availableInputs = (selectedMacro?.inputs ?? []).filter(
      (input) => input.type === parameter.type,
    );

    const field = (() => {
      if (parameter.type === "boolean") {
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) =>
              updateActionArgument(action.id, parameterKey, {
                ...argument,
                value: event.target.checked,
              })
            }
          />
        );
      }

      if (parameter.type === "number") {
        return (
          <input
            type="number"
            value={value ?? 0}
            onChange={(event) =>
              updateActionArgument(action.id, parameterKey, {
                ...argument,
                value: Number(event.target.value),
              })
            }
          />
        );
      }

      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(event) =>
            updateActionArgument(action.id, parameterKey, {
              ...argument,
              value: event.target.value,
            })
          }
        />
      );
    })();

    const renderInputSelection = () => {
      if (!availableInputs.length) {
        return <span className="tdocs-macro-empty-inputs">No matching inputs</span>;
      }

      return (
        <select
          value={argument.inputId ?? ""}
          onChange={(event) =>
            updateActionArgument(action.id, parameterKey, {
              kind: "input",
              inputId: event.target.value,
            })
          }
        >
          <option value="">Select input</option>
          {availableInputs.map((input) => (
            <option key={input.id} value={input.id}>
              {input.name}
            </option>
          ))}
        </select>
      );
    };

    return (
      <div className="tdocs-macro-argument" key={parameterKey}>
        <div className="tdocs-macro-argument-header">
          <span>{parameter.label}</span>
          <label className="tdocs-macro-from-input-toggle">
            <input
              type="checkbox"
              checked={isInputRef}
              onChange={(event) => {
                if (event.target.checked) {
                  const nextInputId = availableInputs[0]?.id ?? "";
                  updateActionArgument(action.id, parameterKey, {
                    kind: "input",
                    inputId: nextInputId,
                  });
                  return;
                }

                updateActionArgument(action.id, parameterKey, {
                  kind: "value",
                  value: parameter.defaultValue ?? getDefaultValueForType(parameter.type),
                });
              }}
            />
            From input
          </label>
        </div>
        {isInputRef ? renderInputSelection() : null}
        {isActionOutputRef ? (
          <div className="tdocs-macro-action-output-ref">
            <span>
              From previous action: {outputCommand?.label ?? argument.actionId} → {outputLabel}
            </span>
            <button
              type="button"
              className="tdocs-macro-inline-button"
              onClick={() =>
                updateActionArgument(action.id, parameterKey, {
                  kind: "value",
                  value: parameter.defaultValue ?? getDefaultValueForType(parameter.type),
                })
              }
            >
              Use literal
            </button>
          </div>
        ) : null}
        {!isInputRef && !isActionOutputRef ? field : null}
        {parameter.required &&
        !isActionOutputRef &&
        isValueMissing(
          parameter,
          isInputRef ? argument.inputId : argument.value,
        ) ? (
          <div className="tdocs-macro-error">This value is required.</div>
        ) : null}
      </div>
    );
  }

  if (!selectedMacro) {
    return (
      <section className="tdocs-tab-screen tdocs-macros-screen">
        <div className="tdocs-smart-folders-header">
          <div>
            <h2>Macros</h2>
            <p>Saved Smart Folders workflows.</p>
          </div>
          <div className="tdocs-macro-create-menu-wrap">
            <button
              type="button"
              className="tdocs-files-add-button"
              onClick={() => setCreateMenuOpen((open) => !open)}
              aria-label="Create a macro"
              aria-expanded={createMenuOpen}
            >
              +
            </button>
            {createMenuOpen ? (
              <div className="tdocs-macro-create-menu">
                <button type="button" onClick={addMacro}>
                  Create empty macro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecordingName("");
                    setRecordingNameError("");
                    setCreateMenuOpen(false);
                  }}
                >
                  Record a macro
                </button>
              </div>
            ) : null}
          </div>
        </div>
        {recordingName !== null ? (
          <div className="tdocs-macro-dialog-overlay">
            <form
              className="tdocs-macro-dialog-card"
              onSubmit={startRecording}
              role="dialog"
              aria-label="Record a macro"
            >
              <div className="tdocs-macro-dialog-title">Record a macro</div>
              <label className="tdocs-macro-recording-label">
                <span>Macro name</span>
                <input
                  autoFocus
                  value={recordingName}
                  onChange={(event) => setRecordingName(event.target.value)}
                  placeholder="New macro"
                />
              </label>
              <p>Begin by clicking the red record button.</p>
              {recordingNameError ? (
                <div className="tdocs-macro-dialog-error">{recordingNameError}</div>
              ) : null}
              <div className="tdocs-macro-dialog-actions">
                <button type="submit">Continue</button>
                <button
                  type="button"
                  onClick={() => {
                    setRecordingName(null);
                    setRecordingNameError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : null}
        <div className="tdocs-macros-list">
          {macros.length === 0 ? (
            <div className="tdocs-smart-folders-empty">No macros yet.</div>
          ) : (
            macros.map((macro) => (
              <div className="tdocs-macro-row" key={macro.id}>
                <button
                  type="button"
                  className="tdocs-macro-open"
                  onClick={() => onSelectedMacroIdChange(macro.id)}
                >
                  <span aria-hidden="true">⚙</span>
                  <span>{macro.name}</span>
                </button>
                <button
                  type="button"
                  className="tdocs-macro-inline-button"
                  disabled={playbackActive}
                  onClick={() => requestPlay(macro)}
                >
                  Play
                </button>
                <button
                  type="button"
                  className="tdocs-macro-delete-button"
                  onClick={() => setMacroToDelete(macro)}
                  aria-label={`Delete ${macro.name}`}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
        {macroToPlay ? (
          <div className="tdocs-macro-dialog-overlay">
            <form
              className="tdocs-macro-dialog-card"
              onSubmit={startPlayback}
              role="dialog"
              aria-modal="true"
              aria-label={`Play ${macroToPlay.name}`}
            >
              <div className="tdocs-macro-dialog-title">
                Run “{macroToPlay.name}”
              </div>
              {macroToPlay.inputs.map((input) => (
                <label className="tdocs-macro-recording-label" key={input.id}>
                  <span>{input.name}</span>
                  {input.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(macroInputValues[input.id])}
                      onChange={(event) =>
                        setMacroInputValues((current) => ({
                          ...current,
                          [input.id]: event.target.checked,
                        }))
                      }
                    />
                  ) : (
                    <input
                      type={input.type === "number" ? "number" : "text"}
                      value={macroInputValues[input.id] ?? ""}
                      onChange={(event) =>
                        setMacroInputValues((current) => ({
                          ...current,
                          [input.id]:
                            input.type === "number"
                              ? event.target.value === ""
                                ? ""
                                : Number(event.target.value)
                              : event.target.value,
                        }))
                      }
                    />
                  )}
                </label>
              ))}
              <div className="tdocs-macro-dialog-actions">
                <button type="submit">Play macro</button>
                <button type="button" onClick={() => setMacroToPlay(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : null}
        {macroToDelete ? (
          <div className="tdocs-macro-dialog-overlay">
            <div
              className="tdocs-macro-dialog-card"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="macro-delete-title"
            >
              <div id="macro-delete-title" className="tdocs-macro-dialog-title">
                Delete &quot;{macroToDelete.name}&quot;?
              </div>
              <p>This macro will be permanently deleted.</p>
              <div className="tdocs-macro-dialog-actions">
                <button type="button" autoFocus onClick={() => setMacroToDelete(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="tdocs-macro-confirm-delete"
                  onClick={() => {
                    deleteMacro(macroToDelete.id);
                    setMacroToDelete(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="tdocs-tab-screen tdocs-macro-editor-screen">
      <div className="tdocs-files-topbar">
        <button
          type="button"
          className="tdocs-files-back-button"
          onClick={() => onSelectedMacroIdChange(null)}
          aria-label="Back to macros"
        >
          ←
        </button>
        <div className="tdocs-files-path-label">Macro editor</div>
      </div>
      <div className="tdocs-macro-editor-header">
        <label className="tdocs-macro-name-field">
          <span>Macro name</span>
          <input
            type="text"
            value={selectedMacro.name}
            onChange={(event) => updateMacroName(event.target.value)}
            placeholder="New macro"
          />
        </label>
      </div>

      <div className="tdocs-macro-inputs-panel">
        <div className="tdocs-macro-section-header">
          <h3>Inputs</h3>
          <button type="button" className="tdocs-macro-inline-button" onClick={addInput}>
            + Add input
          </button>
        </div>
        {selectedMacro.inputs.length === 0 ? (
          <div className="tdocs-smart-folders-empty">No inputs yet.</div>
        ) : (
          <div className="tdocs-macro-input-list">
            {selectedMacro.inputs.map((input) => (
              <div key={input.id} className="tdocs-macro-input-row">
                <input
                  type="text"
                  value={input.name}
                  onChange={(event) => updateInput(input.id, { name: event.target.value })}
                />
                <select
                  value={input.type}
                  onChange={(event) => updateInput(input.id, { type: event.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
                <button
                  type="button"
                  className="tdocs-macro-delete-button"
                  onClick={() =>
                    updateSelectedMacro((macro) => ({
                      ...macro,
                      inputs: macro.inputs.filter((entry) => entry.id !== input.id),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tdocs-macro-actions-panel">
        <div className="tdocs-macro-section-header">
          <h3>Actions</h3>
          <div className="tdocs-macro-command-picker" ref={commandPickerRef}>
            <button
              type="button"
              className="tdocs-macro-inline-button"
              onClick={() => setCommandPickerOpen((open) => !open)}
            >
              + Add action
            </button>
            {commandPickerOpen ? (
              <div className="tdocs-macro-command-menu">
                {groupedCommandEntries.map(([categoryName, entries]) => (
                  <div key={categoryName} className="tdocs-macro-command-group">
                    <div className="tdocs-macro-command-group-title">{categoryName}</div>
                    <div className="tdocs-macro-command-options">
                      {entries.map(([commandId, command]) => (
                        <button
                          key={commandId}
                          type="button"
                          className="tdocs-macro-command-option"
                          onClick={() => addAction(commandId)}
                        >
                          {command.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {selectedMacro.actions.length === 0 ? (
          <div className="tdocs-smart-folders-empty">No actions yet.</div>
        ) : (
          <div className="tdocs-macro-action-list">
            {selectedMacro.actions.map((action, actionIndex) => {
              const command = getActionCommand(action, commandsById);
              const isExpanded = Boolean(expandedActionIds[action.id]);
              const dropPosition = dropTarget?.actionId === action.id
                ? dropTarget.position
                : null;

              return (
                <div
                  className={[
                    "tdocs-macro-action",
                    draggedActionId === action.id ? "is-dragging" : "",
                    dropPosition ? `drop-${dropPosition}` : "",
                  ].filter(Boolean).join(" ")}
                  key={action.id}
                  onDragOver={(event) => {
                    if (!draggedActionId || draggedActionId === action.id) {
                      return;
                    }

                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    const bounds = event.currentTarget.getBoundingClientRect();
                    setDropTarget({
                      actionId: action.id,
                      position:
                        event.clientY < bounds.top + bounds.height / 2
                          ? "before"
                          : "after",
                    });
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceActionId =
                      event.dataTransfer.getData("text/plain") || draggedActionId;
                    const bounds = event.currentTarget.getBoundingClientRect();
                    const position =
                      event.clientY < bounds.top + bounds.height / 2
                        ? "before"
                        : "after";
                    if (sourceActionId && sourceActionId !== action.id) {
                      moveAction(sourceActionId, action.id, position);
                    }
                    finishActionDrag();
                  }}
                >
                  <div className="tdocs-macro-action-row">
                    <button
                      type="button"
                      className="tdocs-macro-action-drag-handle"
                      draggable
                      aria-label={`Drag to reorder ${command?.label ?? action.commandId}`}
                      title="Drag to reorder"
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", action.id);
                        setDraggedActionId(action.id);
                      }}
                      onDragEnd={finishActionDrag}
                      onKeyDown={(event) => {
                        const direction =
                          event.key === "ArrowUp"
                            ? -1
                            : event.key === "ArrowDown"
                              ? 1
                              : 0;
                        const targetAction = selectedMacro.actions[actionIndex + direction];
                        if (!direction || !targetAction) {
                          return;
                        }
                        event.preventDefault();
                        moveAction(
                          action.id,
                          targetAction.id,
                          direction < 0 ? "before" : "after",
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="tdocs-macro-action-toggle"
                      onClick={() =>
                        setExpandedActionIds((current) => ({
                          ...current,
                          [action.id]: !current[action.id],
                        }))
                      }
                    >
                      {isExpanded ? "▾" : "▸"}
                    </button>
                    <span className="tdocs-macro-action-name">
                      {command?.label ?? action.commandId}
                    </span>
                    <button
                      type="button"
                      className="tdocs-macro-delete-button"
                      onClick={() => deleteAction(action.id)}
                    >
                      Delete
                    </button>
                  </div>

                  {isExpanded && command ? (
                    <div className="tdocs-macro-action-details">
                      <label className="tdocs-macro-comment-field">
                        <span>Comment</span>
                        <input
                          type="text"
                          value={action.comment}
                          onChange={(event) =>
                            updateSelectedMacro((macro) => ({
                              ...macro,
                              actions: macro.actions.map((entry) =>
                                entry.id === action.id
                                  ? { ...entry, comment: event.target.value }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      </label>

                      {Object.entries(command.parameters ?? {}).map(([parameterKey, parameter]) =>
                        renderArgumentInput(action, parameterKey, parameter),
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default MacroEditorTab;
