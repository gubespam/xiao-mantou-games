import { restoreItem } from "../files/fileSystemService.js";

export const TRASH_CANS_AUTOMATION_STORAGE_KEY = "tdocs-trash-cans-automation";
export const TRASH_CANS_AUTOMATION_INTERVAL_MS = 60 * 60 * 1000;

function getDeleteAfterMs(settings) {
  const deleteAfterDays = Number(settings?.deleteAfterDays ?? 30);

  if (!Number.isFinite(deleteAfterDays) || deleteAfterDays <= 0) {
    return 30 * 24 * 60 * 60 * 1000;
  }

  return deleteAfterDays * 24 * 60 * 60 * 1000;
}

export function runTrashCanAutomation({
  tree,
  trashCans = [],
  storage,
  now = Date.now(),
}) {
  const storageObject =
    storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  const lastRunValue = storageObject?.getItem?.(
    TRASH_CANS_AUTOMATION_STORAGE_KEY,
  );
  const lastRunMs = lastRunValue ? Number(lastRunValue) : NaN;
  const shouldRun =
    !Number.isFinite(lastRunMs) ||
    now - lastRunMs >= TRASH_CANS_AUTOMATION_INTERVAL_MS;

  if (!shouldRun) {
    return {
      nextTree: tree,
      nextTrashCans: trashCans,
      nextRunInMs: Math.max(
        TRASH_CANS_AUTOMATION_INTERVAL_MS - (now - lastRunMs),
        0,
      ),
    };
  }

  let nextTree = tree;
  const nextTrashCans = (trashCans ?? []).map((trashCan) => ({
    ...trashCan,
    items: [...(trashCan.items ?? [])],
  }));

  for (const trashCan of nextTrashCans) {
    const action = trashCan?.settings?.action ?? "nothing";

    if (action === "nothing") {
      continue;
    }

    const thresholdMs = getDeleteAfterMs(trashCan?.settings);
    const expiredItems = (trashCan.items ?? []).filter((item) => {
      const deletedAt = item?.deletedAt ? Date.parse(item.deletedAt) : NaN;
      return Number.isFinite(deletedAt) && now - deletedAt > thresholdMs;
    });

    if (expiredItems.length === 0) {
      continue;
    }

    const remainingItems = (trashCan.items ?? []).filter(
      (item) => !expiredItems.includes(item),
    );
    trashCan.items = remainingItems;

    for (const item of expiredItems) {
      if (action === "recover") {
        const originalPath =
          Array.isArray(item.originalPath)
            ? item.originalPath
            : typeof item.originalFolderPath === "string"
              ? item.originalFolderPath.split("/").filter(Boolean)
              : [];
        nextTree = restoreItem(nextTree, item, originalPath);
      }
    }
  }

  storageObject?.setItem?.(
    TRASH_CANS_AUTOMATION_STORAGE_KEY,
    String(now),
  );

  return {
    nextTree,
    nextTrashCans,
    nextRunInMs: TRASH_CANS_AUTOMATION_INTERVAL_MS,
  };
}
