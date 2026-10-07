import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./TDocs.css";
import TabsBar from "./TabsBar.jsx";
import TrashesPage from "./trashes/TrashesPage.jsx";
import FilesPage from "./files/FilesPage.jsx";
import SmartFoldersPage from "./smartfolders/SmartFoldersPage.jsx";
import MacroEditorTab from "./macros/MacroEditorTab.jsx";
import commandLibrary from "./macros/command-list.json" with { type: "json" };
import {
  appendRecordedMacroEvent,
  createMacroDraft,
} from "./macros/macroRecording.js";
import { playMacro } from "./macros/macroPlayback.js";
import { smartFolderMacroAdapters } from "./macros/smartFolderMacroAdapters.js";
import DocumentationPage from "./DocumentationPage.jsx";
import FileEditText from "./files/FileEditText.jsx";
import {
  loadTreeFromStorage,
  saveTreeToStorage,
  updateFileContent,
} from "./files/fileSystemService";
import {
  runTrashCanAutomation,
  TRASH_CANS_AUTOMATION_INTERVAL_MS,
} from "./trashes/trashCanAutomation.js";

const TRASH_CANS_STORAGE_KEY = "tdocs-trash-cans";
const SMART_FOLDERS_STORAGE_KEY = "tdocs-smart-folders";
const MACROS_STORAGE_KEY = "tdocs-macros";

function getDefaultTrashCans() {
  return [];
}

function loadTrashCansFromStorage(storage) {
  try {
    const rawValue = storage?.getItem?.(TRASH_CANS_STORAGE_KEY);

    if (!rawValue) {
      return getDefaultTrashCans();
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return getDefaultTrashCans();
    }

    return parsedValue;
  } catch (error) {
    return getDefaultTrashCans();
  }
}

function saveTrashCansToStorage(trashCans, storage) {
  storage?.setItem?.(TRASH_CANS_STORAGE_KEY, JSON.stringify(trashCans));
}

function loadSmartFoldersFromStorage(storage) {
  try {
    const rawValue = storage?.getItem?.(SMART_FOLDERS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
}

function saveSmartFoldersToStorage(smartFolders, storage) {
  storage?.setItem?.(SMART_FOLDERS_STORAGE_KEY, JSON.stringify(smartFolders));
}

function loadMacrosFromStorage(storage) {
  try {
    const rawValue = storage?.getItem?.(MACROS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
}

function saveMacrosToStorage(macros, storage) {
  storage?.setItem?.(MACROS_STORAGE_KEY, JSON.stringify(macros));
}

function getPathFromSearchParams(searchParams) {
  const path = searchParams.get("path");
  return path ? path.split("/").filter(Boolean) : [];
}

function EditFilePage({ selectedFile, onClose, onContentChange }) {
  if (!selectedFile) {
    return (
      <section className="tdocs-tab-screen tdocs-file-editor-empty">
        To edit a file, first select one on the Files tab.
      </section>
    );
  }

  return (
    <section className="tdocs-file-editor-screen">
      <div className="tdocs-file-editor-header">
        <span>{`/${selectedFile.path.join("/")}`}</span>
        <button
          type="button"
          className="tdocs-file-editor-close"
          onClick={onClose}
          aria-label="Close file editor"
        >
          X
        </button>
      </div>
      <FileEditText
        fileContent={selectedFile.content}
        filePath={selectedFile.path.join("/")}
        onChange={onContentChange}
      />
    </section>
  );
}

function TrashesTabScreen(props) {
  return <TrashesPage {...props} />;
}

function FilesTabScreen(props) {
  return <FilesPage {...props} />;
}

function SmartFoldersTabScreen(props) {
  return <SmartFoldersPage {...props} />;
}

function MacroTabScreen(props) {
  return <MacroEditorTab {...props} />;
}

function PlaceholderTabScreen({ title, message }) {
  return (
    <section className="tdocs-tab-screen">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}

function TDocs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "trashes";
  const filesPath = getPathFromSearchParams(searchParams);
  const selectedTrashCanId = searchParams.get("trash") || null;
  const selectedMacroId = searchParams.get("macro") || null;
  const selectedSmartFolderId = searchParams.get("smartFolder") || null;
  const [directoryTree, setDirectoryTree] = useState(() =>
    loadTreeFromStorage(window.localStorage),
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [trashCans, setTrashCans] = useState(() =>
    loadTrashCansFromStorage(window.localStorage),
  );
  const [smartFolders, setSmartFolders] = useState(() =>
    loadSmartFoldersFromStorage(window.localStorage),
  );
  const [macros, setMacros] = useState(() =>
    loadMacrosFromStorage(window.localStorage),
  );
  const [recording, setRecording] = useState(null);
  const [macroDialogIntent, setMacroDialogIntent] = useState(null);
  const [playback, setPlayback] = useState(null);
  const recordingRef = useRef(null);
  const directoryTreeRef = useRef(directoryTree);
  const trashCansRef = useRef(trashCans);
  const smartFoldersRef = useRef(smartFolders);
  const playbackControllerRef = useRef(null);
  const automationTimerRef = useRef(null);

  function updateLocation(updates) {
    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        updates(nextParams);
        return nextParams;
      },
      { replace: true },
    );
  }

  function setRecordingState(nextRecording) {
    recordingRef.current = nextRecording;
    setRecording(nextRecording);
  }

  function beginMacroRecording(name) {
    setRecordingState({
      phase: "ready",
      macro: createMacroDraft(name),
      bindings: new Map(),
      error: "",
    });
    updateLocation((params) => {
      params.set("tab", "smartfolders");
      params.delete("macro");
    });
  }

  function startMacroRecording() {
    const current = recordingRef.current;
    if (current?.phase === "ready") {
      setRecordingState({ ...current, phase: "recording", error: "" });
    }
  }

  function handleMacroEvent(event) {
    const current = recordingRef.current;
    if (current?.phase !== "recording") {
      return;
    }

    const result = appendRecordedMacroEvent(
      current.macro,
      event,
      current.bindings,
      commandLibrary,
    );
    if (!result.accepted) {
      if (result.error) {
        setRecordingState({ ...current, error: result.error });
      }
      return;
    }

    setRecordingState({
      ...current,
      macro: result.macro,
      bindings: result.bindings,
      error: "",
    });
  }

  function discardMacroRecording() {
    setRecordingState(null);
    updateLocation((params) => {
      params.set("tab", "macros");
      params.delete("macro");
    });
  }

  function saveMacroRecording() {
    const current = recordingRef.current;
    if (current?.phase !== "recording") {
      return;
    }

    setMacros((currentMacros) => [...currentMacros, current.macro]);
    setRecordingState(null);
    updateLocation((params) => {
      params.set("tab", "macros");
      params.set("macro", current.macro.id);
    });
  }

  async function handlePlayMacro(macro, inputs) {
    if (playbackControllerRef.current) return;

    const controller = new AbortController();
    playbackControllerRef.current = controller;
    setPlayback({
      status: "playing",
      macroName: macro.name,
      completed: 0,
      total: macro.actions.length,
    });

    const context = {
      getSmartFolders: () => smartFoldersRef.current,
      setSmartFolders: (nextFolders) => {
        smartFoldersRef.current = nextFolders;
        setSmartFolders(nextFolders);
      },
      createSmartFolderId: () =>
        `smart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      openSmartFolder: (folderId) => {
        setMacroDialogIntent(null);
        updateLocation((params) => {
          params.set("tab", "smartfolders");
          params.set("smartFolder", folderId);
        });
      },
      clearSelectedSmartFolder: (folderId) =>
        updateLocation((params) => {
          if (params.get("smartFolder") === folderId) {
            params.delete("smartFolder");
          }
        }),
      openCreateSmartFolder: (intent) => {
        setMacroDialogIntent(intent);
        updateLocation((params) => {
          params.set("tab", "smartfolders");
          params.delete("smartFolder");
        });
      },
      closeSmartFolderDialog: () => setMacroDialogIntent(null),
    };

    try {
      const result = await playMacro({
        macro,
        inputs,
        commandLibrary,
        adapters: smartFolderMacroAdapters,
        context,
        signal: controller.signal,
        onProgress: (completedActionIds) => {
          if (playbackControllerRef.current !== controller) return;
          setPlayback((current) =>
            current?.status === "playing"
              ? { ...current, completed: completedActionIds.length }
              : current,
          );
        },
      });
      if (playbackControllerRef.current !== controller) return;
      setPlayback({
        ...result,
        status: result.status,
        macroName: macro.name,
        completed: result.completedActionIds.length,
        total: macro.actions.length,
      });
    } catch (error) {
      if (playbackControllerRef.current !== controller) return;
      setPlayback({
        status: "failed",
        macroName: macro.name,
        completed: 0,
        total: macro.actions.length,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      if (playbackControllerRef.current === controller) {
        playbackControllerRef.current = null;
      }
    }
  }

  function stopMacroPlayback() {
    playbackControllerRef.current?.abort();
  }

  useEffect(() => {
    directoryTreeRef.current = directoryTree;
  }, [directoryTree]);

  useEffect(() => {
    trashCansRef.current = trashCans;
  }, [trashCans]);

  useEffect(() => {
    smartFoldersRef.current = smartFolders;
  }, [smartFolders]);

  useEffect(() => {
    saveTreeToStorage(directoryTree, window.localStorage);
  }, [directoryTree]);

  function handleOpenFile(file) {
    setSelectedFile(file);
    updateLocation((params) => params.set("tab", "edit"));
  }

  function handleOpenFolder(path) {
    updateLocation((params) => {
      params.set("tab", "files");
      if (path.length > 0) {
        params.set("path", path.join("/"));
      } else {
        params.delete("path");
      }
    });
  }

  function handleFileContentChange(content) {
    if (!selectedFile) {
      return;
    }

    setDirectoryTree((currentTree) =>
      updateFileContent(
        currentTree,
        selectedFile.path.slice(0, -1),
        selectedFile.name,
        content,
      ),
    );
    setSelectedFile((currentFile) =>
      currentFile ? { ...currentFile, content } : currentFile,
    );
  }

  useEffect(() => {
    saveTrashCansToStorage(trashCans, window.localStorage);
  }, [trashCans]);

  useEffect(() => {
    saveSmartFoldersToStorage(smartFolders, window.localStorage);
  }, [smartFolders]);

  useEffect(() => {
    saveMacrosToStorage(macros, window.localStorage);
  }, [macros]);

  const runTrashCanAutomationCycle = useCallback(() => {
    // Run the scheduled trash-can cleanup pass against the latest tree and trash
    // can state, then persist the last automation timestamp to local storage.
    const { nextTree, nextTrashCans, nextRunInMs } = runTrashCanAutomation({
      tree: directoryTreeRef.current,
      trashCans: trashCansRef.current,
      storage: window.localStorage,
      now: Date.now(),
    });

    // Only update React state if the automation actually changed the filesystem or
    // the trash-can records, so the page stays stable and avoids unnecessary renders.
    if (nextTree !== directoryTreeRef.current) {
      setDirectoryTree(nextTree);
      directoryTreeRef.current = nextTree;
    }

    if (nextTrashCans !== trashCansRef.current) {
      setTrashCans(nextTrashCans);
      trashCansRef.current = nextTrashCans;
    }

    // Clear the previously scheduled timer before setting the next one so there is
    // never more than one pending hourly automation check in flight.
    if (automationTimerRef.current) {
      window.clearTimeout(automationTimerRef.current);
    }

    automationTimerRef.current = window.setTimeout(
      runTrashCanAutomationCycle,
      Math.max(nextRunInMs ?? TRASH_CANS_AUTOMATION_INTERVAL_MS, 0),
    );
  }, []);

  useEffect(() => {
    runTrashCanAutomationCycle();

    return () => {
      if (automationTimerRef.current) {
        window.clearTimeout(automationTimerRef.current);
      }
    };
  }, [runTrashCanAutomationCycle]);

  const tabs = [
    {
      id: "trashes",
      label: "Trashes",
      component: TrashesTabScreen,
      props: {
        tree: directoryTree,
        onTreeChange: setDirectoryTree,
        trashCans,
        onTrashCansChange: setTrashCans,
        initialSelectedTrashCanId: selectedTrashCanId,
        onSelectedTrashCanChange: (trashCanId) =>
          updateLocation((params) => {
            if (trashCanId) {
              params.set("trash", trashCanId);
            } else {
              params.delete("trash");
            }
          }),
      },
    },
    {
      id: "files",
      label: "Files",
      component: FilesTabScreen,
      props: {
        tree: directoryTree,
        onTreeChange: setDirectoryTree,
        onOpenFile: handleOpenFile,
        initialPath: filesPath,
        onPathChange: (path) =>
          updateLocation((params) => {
            if (path.length > 0) {
              params.set("path", path.join("/"));
            } else {
              params.delete("path");
            }
          }),
        trashCans,
        onTrashCansChange: setTrashCans,
      },
    },
    { id: "edit", label: "Edit File", component: EditFilePage, props: {} },
    {
      id: "smartfolders",
      label: "Smart Folders",
      component: SmartFoldersTabScreen,
      props: {
        tree: directoryTree,
        smartFolders,
        onSmartFoldersChange: setSmartFolders,
        onMacroEvent: handleMacroEvent,
        selectedSmartFolderId,
        onSelectedSmartFolderIdChange: (folderId) =>
          updateLocation((params) => {
            if (folderId) {
              params.set("smartFolder", folderId);
            } else {
              params.delete("smartFolder");
            }
          }),
        macroDialogIntent,
        onMacroDialogIntentChange: setMacroDialogIntent,
        onOpenFolder: handleOpenFolder,
        onOpenFile: handleOpenFile,
      },
    },
    {
      id: "macros",
      label: "Macros",
      disabled: Boolean(recording),
      component: MacroTabScreen,
      props: {
        macros,
        onMacrosChange: setMacros,
        selectedMacroId,
        onStartRecording: beginMacroRecording,
        onPlayMacro: handlePlayMacro,
        playbackActive: playback?.status === "playing",
        onSelectedMacroIdChange: (macroId) =>
          updateLocation((params) => {
            if (macroId) {
              params.set("macro", macroId);
            } else {
              params.delete("macro");
            }
          }),
      },
    },
    {
      id: "documentation",
      label: "Documentation",
      component: DocumentationPage,
      props: {},
    },
  ];

  const activeTabEntry = tabs.find((tab) => tab.id === activeTab);
  const ActiveScreen = activeTabEntry?.component ?? FileEditText;

  return (
    <div className="tdocs-base">
      <TabsBar
        tabs={tabs}
        activeTab={activeTab}
        inert={playback?.status === "playing" ? "" : undefined}
        onSelect={(tabId) => {
          if (playback?.status === "playing") {
            return;
          }
          if (recording && tabId === "macros") {
            return;
          }
          updateLocation((params) => params.set("tab", tabId));
        }}
      />
      <main
        className="tdocs-main-content"
        inert={playback?.status === "playing" ? "" : undefined}
      >
        {
          <ActiveScreen
            {...(activeTabEntry?.props ?? {})}
            selectedFile={selectedFile}
            onClose={() => setSelectedFile(null)}
            onContentChange={handleFileContentChange}
          />
        }
      </main>
      {playback ? (
        <div
          className={`tdocs-macro-playback-controls ${
            playback.status === "failed" ? "is-failed" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <span>
            {playback.status === "playing"
              ? `Playing “${playback.macroName}” · ${playback.completed}/${playback.total}`
              : playback.status === "completed"
                ? `Finished “${playback.macroName}” · ${playback.completed} action${playback.completed === 1 ? "" : "s"}`
                : playback.status === "stopped"
                  ? `Stopped “${playback.macroName}” · ${playback.completed} action${playback.completed === 1 ? "" : "s"} completed`
                  : `Could not finish “${playback.macroName}”: ${playback.error}`}
          </span>
          {playback.status === "playing" ? (
            <button type="button" onClick={stopMacroPlayback}>
              Stop
            </button>
          ) : (
            <button type="button" onClick={() => setPlayback(null)}>
              Dismiss
            </button>
          )}
        </div>
      ) : null}
      {recording ? (
        <div className="tdocs-macro-recorder" role="region" aria-label="Macro recorder">
          {recording.phase === "ready" ? (
            <button
              type="button"
              className="tdocs-macro-record-button"
              onClick={startMacroRecording}
              aria-label="Begin recording"
            >
              <span aria-hidden="true">●</span> Record
            </button>
          ) : (
            <>
              <span className="tdocs-macro-recorder-status">
                Recording “{recording.macro.name}” · {recording.macro.actions.length} action
                {recording.macro.actions.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                className="tdocs-macro-stop-button"
                onClick={saveMacroRecording}
                aria-label="Stop and save recording"
              >
                ■ Stop and save
              </button>
            </>
          )}
          <button
            type="button"
            className="tdocs-macro-discard-button"
            onClick={discardMacroRecording}
            aria-label="Cancel and discard recording"
          >
            ×
          </button>
          {recording.error ? (
            <div className="tdocs-macro-recorder-error" role="alert">
              {recording.error}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default TDocs;
