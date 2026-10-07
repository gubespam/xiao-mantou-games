import React, { useEffect, useMemo, useRef, useState } from "react";
import "./MacroEditorTab.css";
import commandLibrary from "./command-list.json" with { type: "json" };
import {
  getDefaultValueForType,
  getSmartFolderCommandEntries,
  isValueMissing,
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

function createAction(commandId) {
  const command = commandLibrary.categories["smart-folders"][commandId];
  const args = {};

  Object.entries(command.parameters ?? {}).forEach(([parameterKey, parameter]) => {
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

function MacroEditorTab({ macros = [], onMacrosChange = () => {}, selectedMacroId, onSelectedMacroIdChange = () => {} }) {
  const commandEntries = useMemo(() => getSmartFolderCommandEntries(commandLibrary), []);
  const commandsById = useMemo(() => {
    const catalog = commandLibrary.categories["smart-folders"] ?? {};
    return Object.fromEntries(
      Object.entries(catalog).map(([commandId, command]) => [commandId, command]),
    );
  }, []);
  const [commandPickerOpen, setCommandPickerOpen] = useState(false);
  const [expandedActionIds, setExpandedActionIds] = useState({});
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
        {isInputRef ? renderInputSelection() : field}
        {parameter.required && isValueMissing(parameter, argument.kind === "input" ? argument.inputId : argument.value) ? (
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
          <button
            type="button"
            className="tdocs-files-add-button"
            onClick={addMacro}
            aria-label="Create a macro"
          >
            +
          </button>
        </div>
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
                  className="tdocs-macro-delete-button"
                  onClick={() => deleteMacro(macro.id)}
                  aria-label={`Delete ${macro.name}`}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
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
                <div className="tdocs-macro-command-menu-title">Smart Folders commands</div>
                {commandEntries.map(([commandId, command]) => (
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
            ) : null}
          </div>
        </div>

        {selectedMacro.actions.length === 0 ? (
          <div className="tdocs-smart-folders-empty">No actions yet.</div>
        ) : (
          <div className="tdocs-macro-action-list">
            {selectedMacro.actions.map((action) => {
              const command = getActionCommand(action, commandsById);
              const isExpanded = Boolean(expandedActionIds[action.id]);

              return (
                <div className="tdocs-macro-action" key={action.id}>
                  <div className="tdocs-macro-action-row">
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
