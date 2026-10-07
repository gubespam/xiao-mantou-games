import { getDefaultValueForType, isValueMissing } from "./macroEditorUtils.js";

const PRIMITIVE_TYPES = new Set(["text", "number", "boolean"]);

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

function isAllowedValue(parameter, value) {
  return !parameter.allowedValues || parameter.allowedValues.includes(value);
}

function validateValue(parameter, value, label) {
  if (isValueMissing(parameter, value)) {
    throw new Error(`Missing required value "${label}".`);
  }
  if (value !== undefined && !hasCompatibleType(parameter.type, value)) {
    throw new Error(`Invalid ${parameter.type} value for "${label}".`);
  }
  if (value !== undefined && !isAllowedValue(parameter, value)) {
    throw new Error(`Unsupported value for "${label}".`);
  }
}

function validateOutputs(command, outputs, action) {
  if (outputs === undefined) return {};
  if (!outputs || typeof outputs !== "object" || Array.isArray(outputs)) {
    throw new Error(`Action "${action.id}" returned invalid outputs.`);
  }

  for (const [outputKey, value] of Object.entries(outputs)) {
    const output = command.outputs?.[outputKey];
    if (!output || !hasCompatibleType(output.type, value)) {
      throw new Error(
        `Action "${action.id}" returned invalid output "${outputKey}".`,
      );
    }
  }
  return outputs;
}

export function preflightMacro(macro, inputs, commandLibrary, adapters) {
  try {
    if (!macro || macro.version !== 1 || !Array.isArray(macro.actions)) {
      throw new Error("This macro version or structure is not supported.");
    }
    if (!Array.isArray(macro.inputs ?? [])) {
      throw new Error("Macro inputs must be a list.");
    }
    if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) {
      throw new Error("Macro inputs must be provided as an object.");
    }

    const inputDefinitions = new Map();
    for (const input of macro.inputs ?? []) {
      if (
        !input ||
        typeof input.id !== "string" ||
        !input.id ||
        inputDefinitions.has(input.id) ||
        !PRIMITIVE_TYPES.has(input.type)
      ) {
        throw new Error("Macro contains an invalid or duplicate input definition.");
      }
      inputDefinitions.set(input.id, input);
    }

    const actionIds = new Set();
    const preparedActions = [];
    const priorActions = new Map();

    for (const action of macro.actions) {
      if (
        !action ||
        typeof action.id !== "string" ||
        !action.id ||
        actionIds.has(action.id) ||
        typeof action.commandId !== "string"
      ) {
        throw new Error("Macro contains an invalid or duplicate action.");
      }
      actionIds.add(action.id);

      const command = getCommand(commandLibrary, action.commandId);
      const adapter = adapters?.[action.commandId];
      if (!command || typeof adapter !== "function") {
        throw new Error(`Unsupported macro command "${action.commandId}".`);
      }

      const args = action.args ?? {};
      if (!args || typeof args !== "object" || Array.isArray(args)) {
        throw new Error(`Arguments for action "${action.id}" must be an object.`);
      }
      const parameters = command.parameters ?? {};
      const unknownArgument = Object.keys(args).find(
        (parameterKey) => !Object.hasOwn(parameters, parameterKey),
      );
      if (unknownArgument) {
        throw new Error(
          `Unknown parameter "${unknownArgument}" in action "${action.id}".`,
        );
      }

      const params = {};
      for (const [parameterKey, parameter] of Object.entries(parameters)) {
        const argument = args[parameterKey];
        let value;
        if (argument === undefined) {
          value = parameter.defaultValue ?? getDefaultValueForType(parameter.type);
        } else if (!argument || typeof argument !== "object") {
          throw new Error(
            `Invalid argument "${parameterKey}" in action "${action.id}".`,
          );
        } else if (argument.kind === "value") {
          value = argument.value;
        } else if (argument.kind === "input") {
          const input = inputDefinitions.get(argument.inputId);
          if (!input) {
            throw new Error(
              `Action "${action.id}" refers to an unknown macro input.`,
            );
          }
          if (input.type !== parameter.type) {
            throw new Error(
              `Macro input "${input.name}" has an incompatible type for "${parameterKey}".`,
            );
          }
          value = Object.hasOwn(inputs, input.id)
            ? inputs[input.id]
            : input.defaultValue;
          validateValue({ ...parameter, required: false }, value, input.name);
        } else if (argument.kind === "action-output") {
          const previous = priorActions.get(argument.actionId);
          const output = previous?.command.outputs?.[argument.outputKey];
          if (!previous || !output) {
            throw new Error(
              `Action "${action.id}" refers to an unavailable earlier action output.`,
            );
          }
          if (output.type !== parameter.type) {
            throw new Error(
              `Action output "${argument.outputKey}" has an incompatible type for "${parameterKey}".`,
            );
          }
          value = {
            kind: "resolved-output",
            actionId: argument.actionId,
            outputKey: argument.outputKey,
          };
        } else {
          throw new Error(
            `Unsupported argument reference in action "${action.id}".`,
          );
        }

        if (value?.kind !== "resolved-output") {
          validateValue(parameter, value, parameterKey);
          params[parameterKey] = value;
        } else {
          params[parameterKey] = value;
        }
      }

      const prepared = { action, command, adapter, params };
      preparedActions.push(prepared);
      priorActions.set(action.id, prepared);
    }

    return { ok: true, actions: preparedActions };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function playMacro({
  macro,
  inputs = {},
  commandLibrary,
  adapters,
  context = {},
  signal,
  onProgress,
}) {
  const prepared = preflightMacro(macro, inputs, commandLibrary, adapters);
  if (!prepared.ok) {
    return { status: "failed", error: prepared.error, completedActionIds: [] };
  }

  const outputs = new Map();
  const completedActionIds = [];
  for (const preparedAction of prepared.actions) {
    if (signal?.aborted) {
      return { status: "stopped", completedActionIds };
    }

    const { action, command, adapter, params: unresolvedParams } = preparedAction;
    try {
      const params = Object.fromEntries(
        Object.entries(unresolvedParams).map(([key, value]) => {
          if (value?.kind !== "resolved-output") return [key, value];
          const outputKey = `${value.actionId}:${value.outputKey}`;
          if (!outputs.has(outputKey)) {
            throw new Error(
              `Action "${action.id}" could not resolve output "${value.outputKey}".`,
            );
          }
          const outputValue = outputs.get(outputKey);
          validateValue(command.parameters?.[key], outputValue, key);
          return [key, outputValue];
        }),
      );
      const result = await adapter({
        params,
        context,
        signal,
        source: "playback",
      });
      if (!result || result.ok !== true) {
        const error =
          result?.error?.message ??
          result?.error ??
          `Action "${action.id}" failed.`;
        return {
          status: "failed",
          action,
          error: String(error),
          completedActionIds,
        };
      }

      const actionOutputs = validateOutputs(command, result.outputs, action);
      for (const [outputKey, value] of Object.entries(actionOutputs)) {
        outputs.set(`${action.id}:${outputKey}`, value);
      }
      completedActionIds.push(action.id);
      onProgress?.([...completedActionIds]);
      if (completedActionIds.length < prepared.actions.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } catch (error) {
      return {
        status: "failed",
        action,
        error: error instanceof Error ? error.message : String(error),
        completedActionIds,
      };
    }
  }

  return { status: "completed", completedActionIds };
}
