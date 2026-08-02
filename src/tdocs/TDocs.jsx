import React, { useState } from 'react';
import './TDocs.css';
import TabsBar from './TabsBar.jsx';
import TrashesPage from './trashes/TrashesPage.jsx';
import FilesPage from './files/FilesPage.jsx';
import SmartFoldersPage from './smartfolders/SmartFoldersPage.jsx';

const tabs = [
  { id: 'trashes', label: 'Trashes', component: TrashesPage },
  { id: 'files', label: 'Files', component: FilesPage },
  { id: 'smartfolders', label: 'Smart Folders', component: SmartFoldersPage },
];

function TDocs() {
  const [activeTab, setActiveTab] = useState('trashes');

  const ActiveScreen = tabs.find((tab) => tab.id === activeTab)?.component ?? TrashesPage;

  return (
    <div className="tdocs-base">
      <TabsBar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
      <main className="tdocs-main-content">
        <ActiveScreen />
      </main>
    </div>
  );
}

export default TDocs;
