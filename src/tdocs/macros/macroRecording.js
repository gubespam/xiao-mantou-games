import { getDefaultValueForType, isValueMissing } from "./macroEditorUtils.js";

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function createMacroDraft(name) {
  return {
    id: createId("macro"),
    version: 1,
    name: name.trim() || "New macro",
    inputs: [],
    actions: [],
  };
}

function getCommand(commandLibrary, commandId) {
  const [category, key] = String(commandId ?? "").split("/");
  return category && key ? commandLibrary?.categories?.[category]?.[key] : null;
}

function hasCompatibleType(type, value) {
  if (type === "text") return typeof value === "string";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "boolean") return typeof value === "boolean";
  return false;
}

export function appendRecordedMacroEvent(macro, event, bindings, commandLibrary) {
  if (event?.source !== "user" || event.changed !== true) {
    return { accepted: false, macro, bindings };
  }

  const command = getCommand(commandLibrary, event.commandId);
  if (!command) {
    return { accepted: false, macro, bindings, error: `Unknown command: ${event.commandId}` };
  }

  const params = event.params ?? {};
  const parameters = command.parameters ?? {};
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return { accepted: false, macro, bindings, error: "Command parameters must be an object." };
  }
  const unknownParameter = Object.keys(params).find(
    (parameterKey) => !Object.hasOwn(parameters, parameterKey),
  );
  if (unknownParameter) {
    return {
      accepted: false,
      macro,
      bindings,
      error: `Unknown parameter "${unknownParameter}" for ${event.commandId}.`,
    };
  }
  const args = {};

  for (const [parameterKey, parameter] of Object.entries(parameters)) {
    const hasValue = Object.hasOwn(params, parameterKey);
    const value = hasValue
      ? params[parameterKey]
      : parameter.defaultValue ?? getDefaultValueForType(parameter.type);

    if (parameter.required && isValueMissing(parameter, value)) {
      return {
        accepted: false,
        macro,
        bindings,
        error: `Missing required value "${parameterKey}" for ${event.commandId}.`,
      };
    }

    if (value !== undefined && !hasCompatibleType(parameter.type, value)) {
      return {
        accepted: false,
        macro,
        bindings,
        error: `Invalid value for "${parameterKey}" in ${event.commandId}.`,
      };
    }

    const outputReference = typeof value === "string" ? bindings.get(value) : null;
    args[parameterKey] = outputReference
      ? { kind: "action-output", ...outputReference }
      : { kind: "value", value };
  }

  for (const [outputKey, outputValue] of Object.entries(event.outputs ?? {})) {
    const output = command.outputs?.[outputKey];
    if (!output || !hasCompatibleType(output.type, outputValue)) {
      return {
        accepted: false,
        macro,
        bindings,
        error: `Invalid output "${outputKey}" for ${event.commandId}.`,
      };
    }
  }

  const action = {
    id: createId("action"),
    commandId: event.commandId,
    comment: "",
    args,
  };
  const nextBindings = new Map(bindings);

  for (const [outputKey, outputValue] of Object.entries(event.outputs ?? {})) {
    if (
      (typeof outputValue === "string" && outputValue.length > 0) ||
      (typeof outputValue === "number" && Number.isFinite(outputValue))
    ) {
      nextBindings.set(String(outputValue), { actionId: action.id, outputKey });
    }
  }

  return {
    accepted: true,
    macro: { ...macro, actions: [...macro.actions, action] },
    bindings: nextBindings,
  };
}
