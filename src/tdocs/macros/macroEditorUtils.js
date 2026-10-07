export function getSmartFolderCommandEntries(commandLibrary) {
  const smartFolderCommands = commandLibrary?.categories?.["smart-folders"] ?? {};

  return Object.entries(smartFolderCommands).sort(([leftId, leftCommand], [rightId, rightCommand]) => {
    const leftLabel = leftCommand?.label ?? leftId;
    const rightLabel = rightCommand?.label ?? rightId;
    return leftLabel.localeCompare(rightLabel) || leftId.localeCompare(rightId);
  });
}

export function getDefaultValueForType(type) {
  switch (type) {
    case "number":
      return 0;
    case "boolean":
      return false;
    default:
      return "";
  }
}

export function isValueMissing(parameter, value) {
  if (!parameter || !parameter.required) {
    return false;
  }

  if (value === undefined || value === null) {
    return true;
  }

  if (parameter.type === "text") {
    return String(value).trim() === "";
  }

  if (parameter.type === "number") {
    return value === "" || Number.isNaN(Number(value));
  }

  return false;
}
