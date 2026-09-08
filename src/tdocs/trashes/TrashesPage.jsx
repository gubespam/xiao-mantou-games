import React, { useMemo, useRef, useState } from 'react';
import FileNameWindow from '../files/FileNameWindow.jsx';
import { restoreItem } from '../files/fileSystemService.js';
import TrashCanSettingsWindow from './TrashCanSettingsWindow.jsx';

function TrashesPage({ tree, onTreeChange = () => {}, trashCans = [], onTrashCansChange = () => {} }) {
  const [selectedTrashCanId, setSelectedTrashCanId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [itemMenuOpenId, setItemMenuOpenId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [trashCanAction, setTrashCanAction] = useState(null);
  const [renameTargetId, setRenameTargetId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [isAddingTrashCan, setIsAddingTrashCan] = useState(false);
  const [newTrashCanName, setNewTrashCanName] = useState('');
  const [settingsTargetId, setSettingsTargetId] = useState(null);
  const nameInputRef = useRef(null);

  const selectedTrashCan = useMemo(
    () => trashCans.find((trashCan) => trashCan.id === selectedTrashCanId) ?? null,
    [selectedTrashCanId, trashCans],
  );
  const trashCanActionTarget = useMemo(
    () => trashCans.find((trashCan) => trashCan.id === trashCanAction?.trashCanId) ?? null,
    [trashCanAction, trashCans],
  );

  function updateTrashCan(trashCanId, updater) {
    onTrashCansChange((currentTrashCans) =>
      (currentTrashCans ?? []).map((trashCan) =>
        trashCan.id === trashCanId ? updater(trashCan) : trashCan,
      ),
    );
  }

  function handleRenameRequest(trashCan) {
    setRenameTargetId(trashCan.id);
    setRenameValue(trashCan.name);
    setMenuOpenId(null);
  }

  function handleAddTrashCanRequest() {
    setIsAddingTrashCan(true);
    setNewTrashCanName('');
  }

  function validateTrashCanName(trimmedName) {
    if (!trimmedName) {
      return 'Please enter a name.';
    }

    const duplicateName = trashCans.some(
      (trashCan) =>
        (!renameTargetId || trashCan.id !== renameTargetId) &&
        trashCan.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (duplicateName) {
      return 'That trash can already exists.';
    }

    return '';
  }

  function handleAddTrashCanConfirm(trimmedName) {
    const newTrashCanId = `trash-can-${Date.now()}`;
    const newTrashCan = {
      id: newTrashCanId,
      name: trimmedName,
      settings: { action: 'nothing', deleteAfterDays: 30 },
      items: [],
    };

    onTrashCansChange((currentTrashCans) => [...(currentTrashCans ?? []), newTrashCan]);
    setIsAddingTrashCan(false);
    setNewTrashCanName('');
    setSettingsTargetId(newTrashCanId);
  }

  function handleRenameConfirm(trimmedName) {
    if (!renameTargetId) {
      return;
    }

    updateTrashCan(renameTargetId, (trashCan) => ({ ...trashCan, name: trimmedName }));
    setRenameTargetId(null);
    setRenameValue('');
  }

  function handleDeleteEmptyTrashCan(trashCanId) {
    onTrashCansChange((currentTrashCans) => (currentTrashCans ?? []).filter((trashCan) => trashCan.id !== trashCanId));
    setMenuOpenId(null);
    setTrashCanAction(null);

    if (selectedTrashCanId === trashCanId) {
      setSelectedTrashCanId(null);
    }
  }

  function handleEmptyTrashCan(trashCanId) {
    updateTrashCan(trashCanId, (trashCan) => ({ ...trashCan, items: [] }));
    setMenuOpenId(null);
    setTrashCanAction(null);
  }

  function handleTrashCanActionConfirm() {
    if (!trashCanAction) {
      return;
    }

    if (trashCanAction.type === 'delete') {
      handleDeleteEmptyTrashCan(trashCanAction.trashCanId);
      return;
    }

    handleEmptyTrashCan(trashCanAction.trashCanId);
  }

  function handleDeleteForevermore() {
    if (!deleteTarget) {
      return;
    }

    updateTrashCan(deleteTarget.trashCanId, (trashCan) => ({
      ...trashCan,
      items: (trashCan.items ?? []).filter((item) => item.id !== deleteTarget.item.id),
    }));
    setDeleteTarget(null);
    setItemMenuOpenId(null);
  }

  function handleRestoreItem(trashCanId, item) {
    if (!item.item) {
      return;
    }

    const originalPath = item.originalPath
      ?? item.originalFolderPath?.split('/').filter(Boolean)
      ?? [];
    const nextTree = restoreItem(tree, item.item, originalPath);

    if (nextTree === tree) {
      return;
    }

    onTreeChange(nextTree);
    updateTrashCan(trashCanId, (trashCan) => ({
      ...trashCan,
      items: (trashCan.items ?? []).filter((trashItem) => trashItem.id !== item.id),
    }));
    setItemMenuOpenId(null);
  }

  function handleSaveSettings(nextSettings) {
    if (!settingsTargetId) {
      return;
    }

    updateTrashCan(settingsTargetId, (trashCan) => ({
      ...trashCan,
      settings: {
        action: nextSettings.action,
        deleteAfterDays: nextSettings.action === 'nothing' ? 30 : nextSettings.deleteAfterDays,
      },
    }));
    setSettingsTargetId(null);
  }

  function renderTrashList() {
    return (
      <section className="tdocs-tab-screen tdocs-trash-screen">
        <div className="tdocs-trash-header">
          <h2>Trash cans</h2>
        </div>

        <div className="tdocs-trash-list">
          {trashCans.length === 0 ? (
            <div className="tdocs-trash-empty-state">No trash cans yet.</div>
          ) : (
            trashCans.map((trashCan) => (
              <div
                className="tdocs-trash-item"
                key={trashCan.id}
                onClick={() => setSelectedTrashCanId(trashCan.id)}
              >
                <div className="tdocs-trash-item-main">
                  <span className="tdocs-trash-item-icon" aria-hidden="true">
                    🗑️
                  </span>
                  <button
                    type="button"
                    className="tdocs-trash-item-name"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedTrashCanId(trashCan.id);
                    }}
                  >
                    {trashCan.name}
                  </button>
                </div>

                <div className="tdocs-trash-item-actions">
                  <button
                    type="button"
                    className="tdocs-trash-item-menu-button"
                    aria-label={`More actions for ${trashCan.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpenId((currentId) => (currentId === trashCan.id ? null : trashCan.id));
                    }}
                  >
                    ⋯
                  </button>

                  {menuOpenId === trashCan.id ? (
                    <div className="tdocs-files-menu tdocs-trash-menu">
                      {trashCan.items.length === 0 ? (
                        <button type="button" onClick={() => setTrashCanAction({ type: 'delete', trashCanId: trashCan.id })}>
                          Delete
                        </button>
                      ) : null}
                      {trashCan.items.length > 0 ? (
                        <button type="button" onClick={() => setTrashCanAction({ type: 'empty', trashCanId: trashCan.id })}>
                          Empty
                        </button>
                      ) : null}
                      <button type="button" onClick={() => handleRenameRequest(trashCan)}>
                        Rename
                      </button>
                      <button type="button" onClick={() => { setSettingsTargetId(trashCan.id); setMenuOpenId(null); }}>
                        Settings...
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}

          <div className="tdocs-files-add-row">
            <button
              type="button"
              className="tdocs-files-add-button"
              onClick={handleAddTrashCanRequest}
              aria-label="Create a new trash can"
            >
              +
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderSelectedTrashCan() {
    if (!selectedTrashCan) {
      return null;
    }

    return (
      <section className="tdocs-tab-screen tdocs-trash-screen">
        <div className="tdocs-trash-detail-header">
          <button
            type="button"
            className="tdocs-files-back-button"
            onClick={() => setSelectedTrashCanId(null)}
            aria-label="Back to trash can list"
          >
            ←
          </button>
          <div className="tdocs-trash-detail-title">{selectedTrashCan.name}</div>
        </div>

        {selectedTrashCan.items.length === 0 ? (
          <div className="tdocs-trash-empty-state">This trash can is empty.</div>
        ) : (
          <div className="tdocs-trash-item-list">
            {selectedTrashCan.items.map((item) => (
              <div className="tdocs-trash-item-row" key={item.id}>
                <div className="tdocs-trash-item-row-main">
                  <span className="tdocs-trash-item-row-icon" aria-hidden="true">
                    📄
                  </span>
                  <span className="tdocs-trash-item-row-name">{item.originalFilename}</span>
                </div>
                <div className="tdocs-trash-item-actions">
                  <button
                    type="button"
                    className="tdocs-trash-item-menu-button"
                    aria-label={`More actions for ${item.originalFilename}`}
                    onClick={() => setItemMenuOpenId((currentId) => (currentId === item.id ? null : item.id))}
                  >
                    ⋯
                  </button>
                  {itemMenuOpenId === item.id ? (
                    <div className="tdocs-files-menu tdocs-trash-menu">
                      <button type="button" onClick={() => setDeleteTarget({ trashCanId: selectedTrashCan.id, item })}>
                        Delete forevermore
                      </button>
                      <button type="button" onClick={() => handleRestoreItem(selectedTrashCan.id, item)}>
                        Restore
                      </button>
                      <button type="button" disabled>
                        Reset clock
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      {selectedTrashCan ? renderSelectedTrashCan() : renderTrashList()}

      {renameTargetId ? (
        <FileNameWindow
          title="Rename trash can"
          isFolder={false}
          value={renameValue}
          onChange={setRenameValue}
          onConfirm={handleRenameConfirm}
          onCancel={() => {
            setRenameTargetId(null);
            setRenameValue('');
            setSelectedTrashCanId(null);
          }}
          validateName={validateTrashCanName}
          inputRef={nameInputRef}
        />
      ) : null}

      {isAddingTrashCan ? (
        <FileNameWindow
          title="New trash can"
          isFolder={false}
          value={newTrashCanName}
          onChange={setNewTrashCanName}
          onConfirm={handleAddTrashCanConfirm}
          onCancel={() => {
            setIsAddingTrashCan(false);
            setNewTrashCanName('');
          }}
          validateName={validateTrashCanName}
          inputRef={nameInputRef}
        />
      ) : null}

      {settingsTargetId ? (
        <TrashCanSettingsWindow
          trashCan={trashCans.find((trashCan) => trashCan.id === settingsTargetId)}
          onSave={handleSaveSettings}
          onCancel={() => {
            setSettingsTargetId(null);
            setSelectedTrashCanId(null);
          }}
        />
      ) : null}

      {trashCanAction ? (
        <div className="tdocs-files-prompt-overlay">
          <div className="tdocs-files-prompt-card" role="alertdialog" aria-modal="true">
            <div className="tdocs-files-prompt-title">
              {trashCanAction.type === 'delete'
                ? `Are you sure you want to delete "${trashCanActionTarget?.name ?? 'this trash can'}"?`
                : `Are you sure you want to empty "${trashCanActionTarget?.name ?? 'this trash can'}"?`}
            </div>
            <div className="tdocs-files-prompt-actions">
              <button type="button" className="tdocs-files-danger-button" onClick={handleTrashCanActionConfirm}>
                {trashCanAction.type === 'delete' ? 'Delete' : 'Empty'}
              </button>
              <button type="button" onClick={() => setTrashCanAction(null)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="tdocs-files-prompt-overlay">
          <div className="tdocs-files-prompt-card" role="alertdialog" aria-modal="true">
            <div className="tdocs-files-prompt-title">
              Are you sure you want to delete &quot;{deleteTarget.item.originalFilename}&quot; forevermore?
            </div>
            <div className="tdocs-files-prompt-actions">
              <button type="button" className="tdocs-files-danger-button" onClick={handleDeleteForevermore}>
                Delete
              </button>
              <button type="button" onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default TrashesPage;
