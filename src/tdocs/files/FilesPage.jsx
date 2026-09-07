import React, { useEffect, useMemo, useRef, useState } from 'react';
import FileNameWindow from './FileNameWindow';
import {
  addItem,
  deleteItem,
  findDirectoryByPath,
  getDirectoryItems,
  getDisplayPath,
  navigateToDirectory,
  goToParentDirectory,
  renameItem,
  saveTreeToStorage,
} from './fileSystemService';

function FilesPage({ tree, onTreeChange, trashCans = [], onTrashCansChange = () => {} }) {
  const [directoryTree, setDirectoryTree] = useState(tree);
  const [currentPath, setCurrentPath] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenuItemKey, setActiveMenuItemKey] = useState(null);
  const [deleteMenuItemKey, setDeleteMenuItemKey] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [trashTarget, setTrashTarget] = useState(null);
  const [selectedTrashCanId, setSelectedTrashCanId] = useState('');
  const [promptKind, setPromptKind] = useState(null);
  const [promptTarget, setPromptTarget] = useState(null);
  const [newName, setNewName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    setDirectoryTree(tree);
  }, [tree]);

  useEffect(() => {
    saveTreeToStorage(directoryTree, window.localStorage);
    onTreeChange?.(directoryTree);
  }, [directoryTree, onTreeChange]);

  useEffect(() => {
    if (promptKind) {
      nameInputRef.current?.focus();
    }
  }, [promptKind]);

  useEffect(() => {
    setStatusMessage('');
  }, [currentPath]);

  const currentDirectory = useMemo(
    () => findDirectoryByPath(directoryTree, currentPath),
    [directoryTree, currentPath],
  );

  const directoryItems = useMemo(() => {
    const items = getDirectoryItems(directoryTree, currentPath);
    return [...items].sort((left, right) => left.name.localeCompare(right.name));
  }, [directoryTree, currentPath]);

  const displayPath = getDisplayPath(currentPath);

  function handleOpenDirectory(nextDirectoryName) {
    setCurrentPath((previousPath) => navigateToDirectory(previousPath, nextDirectoryName));
    setMenuOpen(false);
    setActiveMenuItemKey(null);
    setDeleteMenuItemKey(null);
  }

  function handleGoBack() {
    setCurrentPath((previousPath) => goToParentDirectory(previousPath));
    setMenuOpen(false);
    setActiveMenuItemKey(null);
    setDeleteMenuItemKey(null);
  }

  function handleAddItem(kind) {
    setPromptKind(kind);
    setPromptTarget(null);
    setNewName('');
    setMenuOpen(false);
    setActiveMenuItemKey(null);
    setDeleteMenuItemKey(null);
  }

  function toggleItemMenu(itemKey) {
    setActiveMenuItemKey((currentKey) => (currentKey === itemKey ? null : itemKey));
    setDeleteMenuItemKey(null);
    setMenuOpen(false);
  }

  function handleRenameItem(index, item) {
    setPromptKind('rename');
    setPromptTarget({ index, item });
    setNewName(item.name);
    setActiveMenuItemKey(null);
    setDeleteMenuItemKey(null);
    setMenuOpen(false);
  }

  function handleOpenDeleteMenu(itemKey) {
    setDeleteMenuItemKey(itemKey);
  }

  function handleDeleteForevermore() {
    if (!deleteTarget) {
      return;
    }

    handleDeleteItem(deleteTarget.index);
    setDeleteTarget(null);
    setDeleteMenuItemKey(null);
  }

  function handleOpenTrashPrompt(index, item) {
    setTrashTarget({ index, item });
    setSelectedTrashCanId(trashCans[0]?.id ?? '');
    setDeleteMenuItemKey(null);
    setActiveMenuItemKey(null);
  }

  function handleMoveToTrash() {
    if (!trashTarget || !selectedTrashCanId) {
      return;
    }

    const currentItems = getDirectoryItems(directoryTree, currentPath);
    const itemIndex = currentItems.findIndex((item) => item === trashTarget.item);

    if (itemIndex < 0) {
      setTrashTarget(null);
      setSelectedTrashCanId('');
      return;
    }

    const nextTree = deleteItem(directoryTree, currentPath, itemIndex);

    if (nextTree === directoryTree) {
      return;
    }

    const trashItem = {
      id: `${selectedTrashCanId}-${Date.now()}`,
      originalFolderPath: displayPath,
      originalFilename: trashTarget.item.name,
      deletedAt: new Date().toISOString(),
      item: trashTarget.item,
    };

    onTrashCansChange((currentTrashCans) =>
      (currentTrashCans ?? []).map((trashCan) =>
        trashCan.id === selectedTrashCanId
          ? { ...trashCan, items: [...(trashCan.items ?? []), trashItem] }
          : trashCan,
      ),
    );
    onTreeChange?.(nextTree);
    setDirectoryTree(nextTree);
    setTrashTarget(null);
    setSelectedTrashCanId('');
    setStatusMessage(`${trashTarget.item.name} moved to trash.`);
  }

  function handleDeleteItem(index) {
    const targetItem = getDirectoryItems(directoryTree, currentPath)[index];
    const nextTree = deleteItem(directoryTree, currentPath, index);

    if (nextTree === directoryTree) {
      return;
    }

    setDirectoryTree(nextTree);
    setActiveMenuItemKey(null);
    setDeleteMenuItemKey(null);
    setStatusMessage(`${targetItem.name} deleted.`);
  }

  function handleMoveItem() {
    setStatusMessage('Move is not implemented yet.');
    setActiveMenuItemKey(null);
    setDeleteMenuItemKey(null);
  }

  function handleDownloadItem(item) {
    if (item.type !== 'file') {
      return;
    }

    const blob = new Blob([item.content ?? ''], { type: 'text/plain;charset=utf-8' });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = item.name;
    anchor.click();
    window.URL.revokeObjectURL(objectUrl);
    setActiveMenuItemKey(null);
    setDeleteMenuItemKey(null);
  }

  function validateNewName(trimmedName) {
    if (!trimmedName) {
      return 'Please enter a name.';
    }

    if (promptKind === 'rename' && promptTarget) {
      const currentItem = currentDirectory?.children?.[promptTarget.index];
      if (currentItem && currentItem.name === trimmedName) {
        return 'Please choose a different name.';
      }
    }

    const nameExists = currentDirectory?.children?.some((child, index) => {
      const isSameTarget = promptKind === 'rename' && promptTarget && index === promptTarget.index;
      return !isSameTarget && child.name.toLowerCase() === trimmedName.toLowerCase();
    });

    if (nameExists) {
      return 'That name already exists in this directory.';
    }

    return '';
  }

  function handleConfirmNewItem(trimmedName) {
    let nextTree = directoryTree;

    if (promptKind === 'rename' && promptTarget) {
      nextTree = renameItem(directoryTree, currentPath, promptTarget.index, trimmedName);
    } else if (promptKind === 'file' || promptKind === 'folder') {
      nextTree = addItem(directoryTree, currentPath, promptKind, trimmedName);
    }

    if (nextTree === directoryTree) {
      return;
    }

    setDirectoryTree(nextTree);
    setPromptKind(null);
    setPromptTarget(null);
    setNewName('');
  }

  function handleCancelNewItem() {
    setPromptKind(null);
    setPromptTarget(null);
    setNewName('');
  }

  return (
    <section className="tdocs-tab-screen tdocs-files-screen">
      <div className="tdocs-files-topbar">
        <button
          type="button"
          className="tdocs-files-back-button"
          onClick={handleGoBack}
          disabled={currentPath.length === 0}
          aria-label="Go to parent directory"
        >
          ←
        </button>
        <div className="tdocs-files-path-label">{displayPath}</div>
      </div>

      <div className="tdocs-files-list">
        {directoryItems.map((item, index) => {
          const itemKey = `${item.type}-${item.name}-${index}`;
          const isMenuOpen = activeMenuItemKey === itemKey;

          return (
            <div className="tdocs-files-item" key={itemKey}>
              <div className="tdocs-files-item-left">
                <span className="tdocs-files-item-icon" aria-hidden="true">
                  {item.type === 'dir' ? '📁' : '📄'}
                </span>
                {item.type === 'dir' ? (
                  <button
                    type="button"
                    className="tdocs-files-item-name tdocs-files-link"
                    onClick={() => handleOpenDirectory(item.name)}
                  >
                    {item.name}
                  </button>
                ) : (
                  <span className="tdocs-files-item-name">{item.name}</span>
                )}
              </div>

              <div className="tdocs-files-item-actions">
                <button
                  type="button"
                  className="tdocs-files-item-action-button"
                  onClick={() => toggleItemMenu(itemKey)}
                  aria-label={`More actions for ${item.name}`}
                >
                  ⋯
                </button>

                {isMenuOpen ? (
                  <div className="tdocs-files-menu">
                    <button type="button" onClick={() => handleRenameItem(index, item)}>
                      Rename
                    </button>
                    <div className="tdocs-files-submenu-container">
                      <button
                        type="button"
                        className="tdocs-files-delete-option"
                        aria-haspopup="menu"
                        aria-expanded={deleteMenuItemKey === itemKey}
                        onMouseOver={() => handleOpenDeleteMenu(itemKey)}
                        onClick={() => handleOpenDeleteMenu(itemKey)}
                      >
                        Delete
                      </button>
                      <div
                        className="tdocs-files-submenu tdocs-files-menu"
                        role="menu"
                        hidden={deleteMenuItemKey !== itemKey}
                        onMouseEnter={() => handleOpenDeleteMenu(itemKey)}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget({ index, item });
                            setActiveMenuItemKey(null);
                          }}
                        >
                          Delete Forevermore
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenTrashPrompt(index, item)}
                        >
                          To Trash...
                        </button>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleMoveItem()}>
                      Move to...
                    </button>
                    {item.type === 'file' ? (
                      <button type="button" onClick={() => handleDownloadItem(item)}>
                        Download
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        <div className="tdocs-files-add-row">
          <button
            type="button"
            className="tdocs-files-add-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Create a new file or folder"
          >
            +
          </button>

          {menuOpen ? (
            <div className="tdocs-files-menu">
              <button type="button" onClick={() => handleAddItem('file')}>
                File
              </button>
              <button type="button" onClick={() => handleAddItem('folder')}>
                Folder
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {statusMessage ? <div className="tdocs-files-status">{statusMessage}</div> : null}

      {promptKind ? (
        <FileNameWindow
          title={promptKind === 'rename' ? 'Rename item' : `New ${promptKind === 'file' ? 'file' : 'folder'}`}
          isFolder={promptKind === 'folder'}
          value={newName}
          onChange={setNewName}
          onConfirm={handleConfirmNewItem}
          onCancel={handleCancelNewItem}
          validateName={validateNewName}
          inputRef={nameInputRef}
        />
      ) : null}

      {deleteTarget ? (
        <div className="tdocs-files-prompt-overlay">
          <div className="tdocs-files-prompt-card" role="alertdialog" aria-modal="true">
            <div className="tdocs-files-prompt-title">
              Are you sure you want to delete &quot;{deleteTarget.item.name}&quot; forevermore?
            </div>
            <div className="tdocs-files-prompt-actions">
              <button type="button" className="tdocs-files-danger-button" onClick={handleDeleteForevermore}>
                Delete
              </button>
              <button type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {trashTarget ? (
        <div className="tdocs-files-prompt-overlay">
          <div className="tdocs-files-prompt-card" role="dialog" aria-modal="true" aria-labelledby="trash-prompt-title">
            <div id="trash-prompt-title" className="tdocs-files-prompt-title">
              Move &quot;{trashTarget.item.name}&quot; to trash
            </div>
            {trashCans.length > 0 ? (
              <label className="tdocs-files-prompt-label">
                <span>Trash can</span>
                <select value={selectedTrashCanId} onChange={(event) => setSelectedTrashCanId(event.target.value)}>
                  {trashCans.map((trashCan) => (
                    <option key={trashCan.id} value={trashCan.id}>
                      {trashCan.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="tdocs-files-prompt-error">There are no trash cans. You must create one before you can move items to it.</div>
            )}
            <div className="tdocs-files-prompt-actions">
              <button
                type="button"
                onClick={trashCans.length > 0 ? handleMoveToTrash : () => {
                  setTrashTarget(null);
                  setSelectedTrashCanId('');
                }}
                disabled={trashCans.length > 0 && !selectedTrashCanId}
              >
                OK
              </button>
              {trashCans.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setTrashTarget(null);
                    setSelectedTrashCanId('');
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default FilesPage;
