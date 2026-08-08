import React, { useEffect, useState } from 'react';
import './TDocs.css';
import TabsBar from './TabsBar.jsx';
import TrashesPage from './trashes/TrashesPage.jsx';
import FilesPage from './files/FilesPage.jsx';
import SmartFoldersPage from './smartfolders/SmartFoldersPage.jsx';
import FileEditText from './files/FileEditText.jsx';
import { loadTreeFromStorage, saveTreeToStorage } from './files/fileSystemService';

function TDocs() {
  const [activeTab, setActiveTab] = useState('trashes');
  const [directoryTree, setDirectoryTree] = useState(() => loadTreeFromStorage(window.localStorage));

  useEffect(() => {
    saveTreeToStorage(directoryTree, window.localStorage);
  }, [directoryTree]);

  const tabs = [
    { id: 'trashes', label: 'Trashes', component: () => <TrashesPage /> },
    { id: 'files', label: 'Files', component: () => <FilesPage tree={directoryTree} onTreeChange={setDirectoryTree} /> },
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
