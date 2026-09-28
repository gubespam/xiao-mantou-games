import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./TDocs.css";
import TabsBar from "./TabsBar.jsx";
import TrashesPage from "./trashes/TrashesPage.jsx";
import FilesPage from "./files/FilesPage.jsx";
import SmartFoldersPage from "./smartfolders/SmartFoldersPage.jsx";
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
  const directoryTreeRef = useRef(directoryTree);
  const trashCansRef = useRef(trashCans);
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

  useEffect(() => {
    directoryTreeRef.current = directoryTree;
  }, [directoryTree]);

  useEffect(() => {
    trashCansRef.current = trashCans;
  }, [trashCans]);

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
        onOpenFolder: handleOpenFolder,
        onOpenFile: handleOpenFile,
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
        onSelect={(tabId) => updateLocation((params) => params.set("tab", tabId))}
      />
      <main className="tdocs-main-content">
        {
          <ActiveScreen
            {...(activeTabEntry?.props ?? {})}
            selectedFile={selectedFile}
            onClose={() => setSelectedFile(null)}
            onContentChange={handleFileContentChange}
          />
        }
      </main>
    </div>
  );
}

export default TDocs;
