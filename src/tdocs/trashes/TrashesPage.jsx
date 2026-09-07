import React, { useMemo, useRef, useState } from 'react';
import FileNameWindow from '../files/FileNameWindow.jsx';
import TrashCanSettingsWindow from './TrashCanSettingsWindow.jsx';

function TrashesPage({ trashCans = [], onTrashCansChange = () => {} }) {
  const [selectedTrashCanId, setSelectedTrashCanId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renameTargetId, setRenameTargetId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [settingsTargetId, setSettingsTargetId] = useState(null);
  const nameInputRef = useRef(null);

  const selectedTrashCan = useMemo(
    () => trashCans.find((trashCan) => trashCan.id === selectedTrashCanId) ?? null,
    [selectedTrashCanId, trashCans],
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

  function validateTrashCanName(trimmedName) {
    if (!trimmedName) {
      return 'Please enter a name.';
    }

    const duplicateName = trashCans.some(
      (trashCan) =>
        trashCan.id !== renameTargetId &&
        trashCan.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (duplicateName) {
      return 'That trash can already exists.';
    }

    return '';
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

    if (selectedTrashCanId === trashCanId) {
      setSelectedTrashCanId(null);
    }
  }

  function handleEmptyTrashCan(trashCanId) {
    updateTrashCan(trashCanId, (trashCan) => ({ ...trashCan, items: [] }));
    setMenuOpenId(null);
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
                        <button type="button" onClick={() => handleDeleteEmptyTrashCan(trashCan.id)}>
                          Delete
                        </button>
                      ) : null}
                      {trashCan.items.length > 0 ? (
                        <button type="button" onClick={() => handleEmptyTrashCan(trashCan.id)}>
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
                <span className="tdocs-trash-item-row-icon" aria-hidden="true">
                  📄
                </span>
                <span className="tdocs-trash-item-row-name">{item.originalFilename}</span>
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
          }}
          validateName={validateTrashCanName}
          inputRef={nameInputRef}
        />
      ) : null}

      {settingsTargetId ? (
        <TrashCanSettingsWindow
          trashCan={trashCans.find((trashCan) => trashCan.id === settingsTargetId)}
          onSave={handleSaveSettings}
          onCancel={() => setSettingsTargetId(null)}
        />
      ) : null}
    </>
  );
}

export default TrashesPage;
