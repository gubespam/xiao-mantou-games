
import React, { useMemo, useState } from 'react';
import {
  getDisplayPath,
} from '../files/fileSystemService';

function collectItems(node, path = []) {
  const items = [];
  (node.children ?? []).forEach((item) => {
    const itemPath = [...path, item.name];
    items.push({ item, path, itemPath });
    if (item.type === 'dir') {
      items.push(...collectItems(item, itemPath));
    }
  });
  return items;
}

function defaultFolder() {
  return { id: '', name: '', type: 'any', location: '/', nameQuery: '' };
}

function SmartFolderForm({ value, onChange, onSubmit, onCancel, locations }) {
  const [error, setError] = useState('');
  const update = (key, nextValue) => onChange({ ...value, [key]: nextValue });

  function submit(event) {
    event.preventDefault();
    if (!value.name.trim()) {
      setError('Please enter a smart folder name.');
      return;
    }
    onSubmit({ ...value, name: value.name.trim(), nameQuery: value.nameQuery.trim() });
  }

  return (
    <div className="tdocs-files-prompt-overlay">
      <form className="tdocs-files-prompt-card tdocs-smart-folder-form" onSubmit={submit}>
        <div className="tdocs-files-prompt-title">{value.id ? 'Edit smart folder' : 'New smart folder'}</div>
        <label className="tdocs-files-prompt-label">
          <span>Smart folder name</span>
          <input autoFocus value={value.name} onChange={(event) => update('name', event.target.value)} placeholder="Recently edited" />
        </label>
        <label className="tdocs-files-prompt-label">
          <span>Item type</span>
          <select value={value.type} onChange={(event) => update('type', event.target.value)}>
            <option value="any">Files and folders</option>
            <option value="file">Files only</option>
            <option value="dir">Folders only</option>
          </select>
        </label>
        <label className="tdocs-files-prompt-label">
          <span>Location</span>
          <select value={value.location} onChange={(event) => update('location', event.target.value)}>
            {locations.map((location) => <option key={location} value={location}>{location}</option>)}
          </select>
        </label>
        <label className="tdocs-files-prompt-label">
          <span>Name contains</span>
          <input value={value.nameQuery} onChange={(event) => update('nameQuery', event.target.value)} placeholder="Optional" />
        </label>
        {error ? <div className="tdocs-files-prompt-error">{error}</div> : null}
        <div className="tdocs-files-prompt-actions">
          <button type="submit">Save</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function SmartFoldersPage({ tree, smartFolders = [], onSmartFoldersChange = () => { }, onOpenFolder = () => { }, onOpenFile = () => { } }) {
  const [selectedId, setSelectedId] = useState(null);
  const [formValue, setFormValue] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const allItems = useMemo(() => collectItems(tree), [tree]);
  const locations = useMemo(() => ['/', ...allItems.filter(({ item }) => item.type === 'dir').map(({ itemPath }) => getDisplayPath(itemPath))], [allItems]);
  const selectedFolder = smartFolders.find((folder) => folder.id === selectedId);
  const matches = useMemo(() => {
    if (!selectedFolder) return [];
    return allItems.filter(({ item, itemPath }) => {
      const locationPath = selectedFolder.location === '/' ? [] : selectedFolder.location.split('/').filter(Boolean);
      const activePath = locationPath;
      const insideLocation = itemPath.length > activePath.length && activePath.every((part, index) => itemPath[index] === part);
      const typeMatches = selectedFolder.type === 'any' || item.type === selectedFolder.type;
      const nameMatches = !selectedFolder.nameQuery || item.name.toLowerCase().includes(selectedFolder.nameQuery.toLowerCase());
      return insideLocation && typeMatches && nameMatches;
    }).sort((left, right) => left.item.name.localeCompare(right.item.name));
  }, [allItems, selectedFolder]);

  function saveFolder(folder) {
    const nextFolder = { ...folder, id: folder.id || `smart-${Date.now()}` };
    onSmartFoldersChange((current) => folder.id ? current.map((entry) => entry.id === folder.id ? nextFolder : entry) : [...current, nextFolder]);
    setSelectedId(nextFolder.id);
    setFormValue(null);
  }

  if (!selectedFolder) {
    return (
      <section className="tdocs-tab-screen tdocs-smart-folders-screen">
        <div className="tdocs-smart-folders-header"><div><h2>Smart Folders</h2><p>Saved views that update as your files change.</p></div><button type="button" className="tdocs-files-add-button" onClick={() => setFormValue(defaultFolder())} aria-label="Create a smart folder">+</button></div>
        <div className="tdocs-smart-folders-list">
          {smartFolders.map((folder) => <div className="tdocs-smart-folder-row" key={folder.id}>
            <button type="button" className="tdocs-smart-folder-open" onClick={() => setSelectedId(folder.id)}><span aria-hidden="true">⚙</span><span><strong>{folder.name}</strong><small>{folder.type === 'any' ? 'Files and folders' : `${folder.type === 'file' ? 'Files' : 'Folders'} matching “${folder.nameQuery || 'any name'}”`}</small></span></button>
            <div className="tdocs-files-item-actions"><button type="button" className="tdocs-files-item-action-button" onClick={() => setFormValue(folder)} aria-label={`Edit ${folder.name}`}>Edit</button><button type="button" className="tdocs-files-item-action-button tdocs-files-danger-button" onClick={() => setDeleteTarget(folder)}>Delete</button></div>
          </div>)}
          {smartFolders.length === 0 ? <div className="tdocs-smart-folders-empty">No smart folders yet.</div> : null}
        </div>
        {formValue ? <SmartFolderForm value={formValue} onChange={setFormValue} onSubmit={saveFolder} onCancel={() => setFormValue(null)} locations={locations} /> : null}
        {deleteTarget ? <div className="tdocs-files-prompt-overlay"><div className="tdocs-files-prompt-card"><div className="tdocs-files-prompt-title">Delete “{deleteTarget.name}” permanently?</div><p>This will not affect the files it finds.</p><div className="tdocs-files-prompt-actions"><button type="button" className="tdocs-files-danger-button" onClick={() => { onSmartFoldersChange((current) => current.filter((folder) => folder.id !== deleteTarget.id)); setDeleteTarget(null); }}>Delete</button><button type="button" onClick={() => setDeleteTarget(null)}>Cancel</button></div></div></div> : null}
      </section>
    );
  }

  return (
    <section className="tdocs-tab-screen tdocs-files-screen tdocs-smart-folder-detail">
      <div className="tdocs-files-topbar"><button type="button" className="tdocs-files-back-button" onClick={() => setSelectedId(null)} aria-label="Back to smart folders">←</button><div className="tdocs-files-path-label">⚙ {selectedFolder.name}</div></div>
      <div className="tdocs-smart-folder-criteria">{matches.length} matching item{matches.length === 1 ? '' : 's'} · {selectedFolder.location} · {selectedFolder.type === 'any' ? 'Files and folders' : selectedFolder.type === 'file' ? 'Files' : 'Folders'}</div>
      <div className="tdocs-files-list">{matches.map(({ item, path, itemPath }) => {
        const itemKey = itemPath.join('/');
        const openFolder = () => onOpenFolder(itemPath);
        const openFile = () => onOpenFile({ name: item.name, content: item.content ?? '', path: itemPath });
        return <div className="tdocs-files-item" key={itemKey}><div className="tdocs-files-item-left"><span className="tdocs-files-item-icon" aria-hidden="true">{item.type === 'dir' ? '📁' : '📄'}</span><button type="button" className="tdocs-files-item-name tdocs-files-link" onClick={item.type === 'dir' ? openFolder : openFile}>{item.name}<small className="tdocs-smart-folder-item-path">{getDisplayPath(path)}</small></button></div></div>;
      })}{matches.length === 0 ? <div className="tdocs-smart-folders-empty">Nothing matches this smart folder yet.</div> : null}</div>
    </section>
  );
}

export default SmartFoldersPage;
