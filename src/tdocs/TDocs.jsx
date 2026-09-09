import React, { useEffect, useState } from 'react';
import './TDocs.css';
import TabsBar from './TabsBar.jsx';
import TrashesPage from './trashes/TrashesPage.jsx';
import FilesPage from './files/FilesPage.jsx';
import SmartFoldersPage from './smartfolders/SmartFoldersPage.jsx';
import FileEditText from './files/FileEditText.jsx';
import { loadTreeFromStorage, saveTreeToStorage } from './files/fileSystemService';

const TRASH_CANS_STORAGE_KEY = 'tdocs-trash-cans';
const SMART_FOLDERS_STORAGE_KEY = 'tdocs-smart-folders';

function getDefaultTrashCans() {
  return []
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

function TDocs() {
  const [activeTab, setActiveTab] = useState('trashes');
  const [directoryTree, setDirectoryTree] = useState(() => loadTreeFromStorage(window.localStorage));
  const [trashCans, setTrashCans] = useState(() => loadTrashCansFromStorage(window.localStorage));
  const [smartFolders, setSmartFolders] = useState(() => loadSmartFoldersFromStorage(window.localStorage));

  useEffect(() => {
    saveTreeToStorage(directoryTree, window.localStorage);
  }, [directoryTree]);

  useEffect(() => {
    saveTrashCansToStorage(trashCans, window.localStorage);
  }, [trashCans]);

  useEffect(() => {
    saveSmartFoldersToStorage(smartFolders, window.localStorage);
  }, [smartFolders]);

  const tabs = [
    { id: 'trashes', label: 'Trashes', component: () => <TrashesPage tree={directoryTree} onTreeChange={setDirectoryTree} trashCans={trashCans} onTrashCansChange={setTrashCans} /> },
    { id: 'files', label: 'Files', component: () => <FilesPage tree={directoryTree} onTreeChange={setDirectoryTree} trashCans={trashCans} onTrashCansChange={setTrashCans} /> },
    { id: 'edit', label: 'Edit File', component: () => <FileEditText /> },
    { id: 'smartfolders', label: 'Smart Folders', component: () => <SmartFoldersPage tree={directoryTree} onTreeChange={setDirectoryTree} smartFolders={smartFolders} onSmartFoldersChange={setSmartFolders} trashCans={trashCans} onTrashCansChange={setTrashCans} /> },
  ];

  const ActiveScreen = tabs.find((tab) => tab.id === activeTab)?.component ?? FileEditText;

  return (
    <div className="tdocs-base">
      <TabsBar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
      <main className="tdocs-main-content">
        {<ActiveScreen />}
      </main>
    </div>
  );
}

export default TDocs;
