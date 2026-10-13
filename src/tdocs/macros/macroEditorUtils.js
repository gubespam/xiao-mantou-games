export function getCommandEntries(commandLibrary) {
  const categories = commandLibrary?.categories ?? {};
  const entries = [];

  Object.entries(categories).forEach(([categoryName, commands]) => {
    Object.entries(commands ?? {}).forEach(([commandId, command]) => {
      entries.push([`${categoryName}/${commandId}`, command, categoryName]);
    });
  });

  return entries.sort(([leftId, leftCommand, leftCategory], [rightId, rightCommand, rightCategory]) => {
    const categorySort = (leftCategory ?? "").localeCompare(rightCategory ?? "");
    if (categorySort !== 0) {
      return categorySort;
    }

    const leftLabel = leftCommand?.label ?? leftId;
    const rightLabel = rightCommand?.label ?? rightId;
    return leftLabel.localeCompare(rightLabel) || leftId.localeCompare(rightId);
  });
}

export function getSmartFolderCommandEntries(commandLibrary) {
  return getCommandEntries(commandLibrary).filter(([commandId]) =>
    commandId.startsWith("smart-folders/"),
  );
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

export function reorderActions(actions, sourceActionId, targetActionId, position) {
  const sourceIndex = actions.findIndex((action) => action.id === sourceActionId);
  const targetIndex = actions.findIndex((action) => action.id === targetActionId);

  if (
    sourceIndex === -1 ||
    targetIndex === -1 ||
    !["before", "after"].includes(position)
  ) {
    return actions;
  }

  const nextActions = [...actions];
  const [action] = nextActions.splice(sourceIndex, 1);
  const targetPosition = targetIndex + (position === "after" ? 1 : 0);
  const insertionIndex =
    sourceIndex < targetPosition ? targetPosition - 1 : targetPosition;
  nextActions.splice(insertionIndex, 0, action);
  return nextActions;
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
