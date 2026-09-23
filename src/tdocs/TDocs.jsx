import React, { useCallback, useEffect, useRef, useState } from "react";
import "./TDocs.css";
import TabsBar from "./TabsBar.jsx";
import TrashesPage from "./trashes/TrashesPage.jsx";
import FilesPage from "./files/FilesPage.jsx";
import SmartFoldersPage from "./smartfolders/SmartFoldersPage.jsx";
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

function TDocs() {
  const [activeTab, setActiveTab] = useState("trashes");
  const [directoryTree, setDirectoryTree] = useState(() =>
    loadTreeFromStorage(window.localStorage),
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [filesPath, setFilesPath] = useState([]);
  const [trashCans, setTrashCans] = useState(() =>
    loadTrashCansFromStorage(window.localStorage),
  );
  const [smartFolders, setSmartFolders] = useState(() =>
    loadSmartFoldersFromStorage(window.localStorage),
  );
  const directoryTreeRef = useRef(directoryTree);
  const trashCansRef = useRef(trashCans);
  const automationTimerRef = useRef(null);

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
    setActiveTab("edit");
  }

  function handleOpenFolder(path) {
    setFilesPath(path);
    setActiveTab("files");
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
      component: () => (
        <TrashesPage
          tree={directoryTree}
          onTreeChange={setDirectoryTree}
          trashCans={trashCans}
          onTrashCansChange={setTrashCans}
        />
      ),
    },
    {
      id: "files",
      label: "Files",
      component: () => (
        <FilesPage
          tree={directoryTree}
          onTreeChange={setDirectoryTree}
          onOpenFile={handleOpenFile}
          initialPath={filesPath}
          trashCans={trashCans}
          onTrashCansChange={setTrashCans}
        />
      ),
    },
    { id: "edit", label: "Edit File", component: EditFilePage },
    {
      id: "smartfolders",
      label: "Smart Folders",
      component: () => (
        <SmartFoldersPage
          tree={directoryTree}
          smartFolders={smartFolders}
          onSmartFoldersChange={setSmartFolders}
          onOpenFolder={handleOpenFolder}
          onOpenFile={handleOpenFile}
        />
      ),
    },
  ];

  const ActiveScreen =
    tabs.find((tab) => tab.id === activeTab)?.component ?? FileEditText;

  return (
    <div className="tdocs-base">
      <TabsBar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
      <main className="tdocs-main-content">
        {
          <ActiveScreen
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
