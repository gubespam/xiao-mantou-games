import React, { useEffect, useState } from 'react';
import './TDocs.css';
import TabsBar from './TabsBar.jsx';
import TrashesPage from './trashes/TrashesPage.jsx';
import FilesPage from './files/FilesPage.jsx';
import SmartFoldersPage from './smartfolders/SmartFoldersPage.jsx';
import FileEditText from './files/FileEditText.jsx';
import { loadTreeFromStorage, saveTreeToStorage } from './files/fileSystemService';

const TRASH_CANS_STORAGE_KEY = 'tdocs-trash-cans';

function getDefaultTrashCans() {
  return [
    {
      id: 'general',
      name: 'General',
      settings: { action: 'nothing', deleteAfterDays: 30 },
      items: [
        {
          id: 'general-1',
          originalFolderPath: '/Projects/Archive',
          originalFilename: 'notes.txt',
          deletedAt: '2026-09-05T10:15:00.000Z',
        },
        {
          id: 'general-2',
          originalFolderPath: '/Downloads',
          originalFilename: 'screenshot.png',
          deletedAt: '2026-09-06T15:45:00.000Z',
        },
      ],
    },
    {
      id: 'junk',
      name: 'Junk',
      settings: { action: 'delete', deleteAfterDays: 7 },
      items: [],
    },
  ];
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

function TDocs() {
  const [activeTab, setActiveTab] = useState('trashes');
  const [directoryTree, setDirectoryTree] = useState(() => loadTreeFromStorage(window.localStorage));
  const [trashCans, setTrashCans] = useState(() => loadTrashCansFromStorage(window.localStorage));

  useEffect(() => {
    saveTreeToStorage(directoryTree, window.localStorage);
  }, [directoryTree]);

  useEffect(() => {
    saveTrashCansToStorage(trashCans, window.localStorage);
  }, [trashCans]);

  const tabs = [
    { id: 'trashes', label: 'Trashes', component: () => <TrashesPage trashCans={trashCans} onTrashCansChange={setTrashCans} /> },
    { id: 'files', label: 'Files', component: () => <FilesPage tree={directoryTree} onTreeChange={setDirectoryTree} trashCans={trashCans} onTrashCansChange={setTrashCans} /> },
    { id: 'edit', label: 'Edit File', component: () => <FileEditText /> },
    { id: 'smartfolders', label: 'Smart Folders', component: () => <SmartFoldersPage /> },
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
