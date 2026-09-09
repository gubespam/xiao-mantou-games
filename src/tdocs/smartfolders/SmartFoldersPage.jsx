
import React, { useMemo, useState } from 'react';
import FileNameWindow from '../files/FileNameWindow.jsx';
import MoveToWindow from '../files/MoveToWindow.jsx';
import {
  deleteItem,
  explodeFolder,
  findDirectoryByPath,
  getDisplayPath,
  moveItem,
  renameItem,
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

function SmartFoldersPage({ tree, onTreeChange, smartFolders = [], onSmartFoldersChange = () => {}, trashCans = [], onTrashCansChange = () => {} }) {
  const [selectedId, setSelectedId] = useState(null);
  const [formValue, setFormValue] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [deleteMenuId, setDeleteMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);
  const [explodeTarget, setExplodeTarget] = useState(null);
  const [trashTarget, setTrashTarget] = useState(null);
  const [selectedTrashCanId, setSelectedTrashCanId] = useState('');
  const [browsePath, setBrowsePath] = useState([]);
  const allItems = useMemo(() => collectItems(tree), [tree]);
  const locations = useMemo(() => ['/', ...allItems.filter(({ item }) => item.type === 'dir').map(({ itemPath }) => getDisplayPath(itemPath))], [allItems]);
  const selectedFolder = smartFolders.find((folder) => folder.id === selectedId);
  const matches = useMemo(() => {
    if (!selectedFolder) return [];
    return allItems.filter(({ item, itemPath }) => {
        const locationPath = selectedFolder.location === '/' ? [] : selectedFolder.location.split('/').filter(Boolean);
        const activePath = [...locationPath, ...browsePath];
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

  function updateTree(nextTree, message) {
    if (nextTree !== tree) onTreeChange(nextTree);
    return message;
  }

  function handleRename(name) {
    const nextTree = renameItem(tree, renameTarget.path, renameTarget.index, name);
    updateTree(nextTree);
    setRenameTarget(null);
  }

  function handleDelete() {
    const nextTree = deleteItem(tree, deleteTarget.path, deleteTarget.index);
    updateTree(nextTree);
    setDeleteTarget(null);
  }

  function handleExplode() {
    const nextTree = explodeFolder(tree, explodeTarget.path, explodeTarget.index);
    updateTree(nextTree);
    setExplodeTarget(null);
  }

  function handleOpenTrashPrompt(path, index, item) {
    setTrashTarget({ path, index, item });
    setSelectedTrashCanId(trashCans[0]?.id ?? '');
    setDeleteMenuId(null);
    setMenuId(null);
  }

  function handleMoveToTrash() {
    if (!trashTarget || !selectedTrashCanId) return;

    const nextTree = deleteItem(tree, trashTarget.path, trashTarget.index);
    if (nextTree === tree) return;

    const trashItem = {
      id: `${selectedTrashCanId}-${Date.now()}`,
      originalPath: trashTarget.path,
      originalFolderPath: getDisplayPath(trashTarget.path),
      originalFilename: trashTarget.item.name,
      deletedAt: new Date().toISOString(),
      item: trashTarget.item,
    };

    onTrashCansChange((currentTrashCans) => (currentTrashCans ?? []).map((trashCan) => (
      trashCan.id === selectedTrashCanId
        ? { ...trashCan, items: [...(trashCan.items ?? []), trashItem] }
        : trashCan
    )));
    updateTree(nextTree);
    setTrashTarget(null);
    setSelectedTrashCanId('');
  }

  function handleDownload(item) {
    if (item.type !== 'file') return;

    const blob = new Blob([item.content ?? ''], { type: 'text/plain;charset=utf-8' });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = item.name;
    anchor.click();
    window.URL.revokeObjectURL(objectUrl);
    setMenuId(null);
    setDeleteMenuId(null);
  }

  function handleMove(targetPath) {
    const nextTree = moveItem(tree, moveTarget.path, moveTarget.index, targetPath);
    updateTree(nextTree);
    setMoveTarget(null);
  }

  if (!selectedFolder) {
    return (
      <section className="tdocs-tab-screen tdocs-smart-folders-screen">
        <div className="tdocs-smart-folders-header"><div><h2>Smart Folders</h2><p>Saved views that update as your files change.</p></div><button type="button" className="tdocs-files-add-button" onClick={() => setFormValue(defaultFolder())} aria-label="Create a smart folder">+</button></div>
        <div className="tdocs-smart-folders-list">
          {smartFolders.map((folder) => <div className="tdocs-smart-folder-row" key={folder.id}>
            <button type="button" className="tdocs-smart-folder-open" onClick={() => setSelectedId(folder.id)}><span aria-hidden="true">⚙</span><span><strong>{folder.name}</strong><small>{folder.type === 'any' ? 'Files and folders' : `${folder.type === 'file' ? 'Files' : 'Folders'} matching “${folder.nameQuery || 'any name'}”`}</small></span></button>
            <div className="tdocs-files-item-actions"><button type="button" className="tdocs-files-item-action-button" onClick={() => setMenuId(menuId === folder.id ? null : folder.id)} aria-label={`Manage ${folder.name}`}>⋯</button>{menuId === folder.id ? <div className="tdocs-files-menu"><button type="button" onClick={() => { setFormValue(folder); setMenuId(null); }}>Edit</button><button type="button" className="tdocs-files-danger-button" onClick={() => { setDeleteTarget(folder); setMenuId(null); }}>Delete</button></div> : null}</div>
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
      <div className="tdocs-files-topbar"><button type="button" className="tdocs-files-back-button" onClick={() => browsePath.length > 0 ? setBrowsePath((path) => path.slice(0, -1)) : setSelectedId(null)} aria-label={browsePath.length > 0 ? 'Go to parent smart folder location' : 'Back to smart folders'}>←</button><div className="tdocs-files-path-label">⚙ {selectedFolder.name}{browsePath.length > 0 ? ` / ${browsePath.join('/')}` : ''}</div></div>
      <div className="tdocs-smart-folder-criteria">{matches.length} matching item{matches.length === 1 ? '' : 's'} · {selectedFolder.location} · {selectedFolder.type === 'any' ? 'Files and folders' : selectedFolder.type === 'file' ? 'Files' : 'Folders'}</div>
      <div className="tdocs-files-list">{matches.map(({ item, path, itemPath }) => {
        const index = (findDirectoryByPath(tree, path)?.children ?? []).findIndex((child) => child === item);
        const itemKey = itemPath.join('/');
        return <div className="tdocs-files-item" key={itemKey}><div className="tdocs-files-item-left"><span className="tdocs-files-item-icon" aria-hidden="true">{item.type === 'dir' ? '📁' : '📄'}</span>{item.type === 'dir' ? <button type="button" className="tdocs-files-item-name tdocs-files-link" onClick={() => setBrowsePath(itemPath.slice((selectedFolder.location === '/' ? 0 : selectedFolder.location.split('/').filter(Boolean).length)))}>{item.name}<small className="tdocs-smart-folder-item-path">{getDisplayPath(path)}</small></button> : <span className="tdocs-files-item-name">{item.name}<small className="tdocs-smart-folder-item-path">{getDisplayPath(path)}</small></span>}</div><div className="tdocs-files-item-actions"><button type="button" className="tdocs-files-item-action-button" onClick={() => { setMenuId(menuId === itemKey ? null : itemKey); setDeleteMenuId(null); }} aria-label={`More actions for ${item.name}`}>⋯</button>{menuId === itemKey ? <div className="tdocs-files-menu"><button type="button" onClick={() => { setRenameTarget({ path, index, item }); setMenuId(null); }}>Rename</button>{item.type === 'file' ? <div className="tdocs-files-submenu-container"><button type="button" className="tdocs-files-delete-option" aria-haspopup="menu" aria-expanded={deleteMenuId === itemKey} onMouseOver={() => setDeleteMenuId(itemKey)} onClick={() => setDeleteMenuId(itemKey)}>Delete</button><div className="tdocs-files-submenu tdocs-files-menu" role="menu" hidden={deleteMenuId !== itemKey} onMouseEnter={() => setDeleteMenuId(itemKey)}><button type="button" onClick={() => { setDeleteTarget({ path, index, item }); setMenuId(null); setDeleteMenuId(null); }}>Delete Forevermore</button><button type="button" onClick={() => handleOpenTrashPrompt(path, index, item)}>To Trash...</button></div></div> : null}{item.type === 'dir' ? <button type="button" onClick={() => { setExplodeTarget({ path, index, item }); setMenuId(null); }}>Explode</button> : null}<button type="button" onClick={() => { setMoveTarget({ path, index, item }); setMenuId(null); setDeleteMenuId(null); }}>Move to...</button>{item.type === 'file' ? <button type="button" onClick={() => handleDownload(item)}>Download</button> : null}</div> : null}</div></div>;
      })}{matches.length === 0 ? <div className="tdocs-smart-folders-empty">Nothing matches this smart folder yet.</div> : null}</div>
      {renameTarget ? <FileNameWindow title="Rename item" isFolder={renameTarget.item.type === 'dir'} value={renameTarget.value ?? renameTarget.item.name} onChange={(name) => setRenameTarget({ ...renameTarget, value: name })} onConfirm={handleRename} onCancel={() => setRenameTarget(null)} validateName={() => ''} /> : null}
      {deleteTarget?.item ? <div className="tdocs-files-prompt-overlay"><div className="tdocs-files-prompt-card"><div className="tdocs-files-prompt-title">Delete “{deleteTarget.item.name}” forevermore?</div><div className="tdocs-files-prompt-actions"><button type="button" className="tdocs-files-danger-button" onClick={handleDelete}>Delete</button><button type="button" onClick={() => setDeleteTarget(null)}>Cancel</button></div></div></div> : null}
      {explodeTarget ? <div className="tdocs-files-prompt-overlay"><div className="tdocs-files-prompt-card"><div className="tdocs-files-prompt-title">Explode “{explodeTarget.item.name}”?</div><div>All items inside this folder will move here, and the folder will be permanently deleted.</div><div className="tdocs-files-prompt-actions"><button type="button" className="tdocs-files-danger-button" onClick={handleExplode}>Explode</button><button type="button" onClick={() => setExplodeTarget(null)}>Cancel</button></div></div></div> : null}
      {trashTarget ? <div className="tdocs-files-prompt-overlay"><div className="tdocs-files-prompt-card" role="dialog" aria-modal="true" aria-labelledby="smart-trash-prompt-title"><div id="smart-trash-prompt-title" className="tdocs-files-prompt-title">Move “{trashTarget.item.name}” to trash</div>{trashCans.length > 0 ? <label className="tdocs-files-prompt-label"><span>Trash can</span><select value={selectedTrashCanId} onChange={(event) => setSelectedTrashCanId(event.target.value)}>{trashCans.map((trashCan) => <option key={trashCan.id} value={trashCan.id}>{trashCan.name}</option>)}</select></label> : <div className="tdocs-files-prompt-error">There are no trash cans. You must create one before you can move items to it.</div>}<div className="tdocs-files-prompt-actions"><button type="button" onClick={trashCans.length > 0 ? handleMoveToTrash : () => { setTrashTarget(null); setSelectedTrashCanId(''); }} disabled={trashCans.length > 0 && !selectedTrashCanId}>OK</button>{trashCans.length > 0 ? <button type="button" onClick={() => { setTrashTarget(null); setSelectedTrashCanId(''); }}>Cancel</button> : null}</div></div></div> : null}
      {moveTarget ? <MoveToWindow tree={tree} sourcePath={moveTarget.path} sourceItem={moveTarget.item} onConfirm={handleMove} onCancel={() => setMoveTarget(null)} /> : null}
    </section>
  );
}

export default SmartFoldersPage;
