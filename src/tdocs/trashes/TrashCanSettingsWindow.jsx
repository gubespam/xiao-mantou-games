import React, { useEffect, useState } from 'react';

function TrashCanSettingsWindow({ trashCan, onSave, onCancel }) {
  const [formState, setFormState] = useState({
    action: trashCan?.settings?.action ?? 'nothing',
    deleteAfterDays: trashCan?.settings?.deleteAfterDays ?? 30,
  });

  useEffect(() => {
    setFormState({
      action: trashCan?.settings?.action ?? 'nothing',
      deleteAfterDays: trashCan?.settings?.deleteAfterDays ?? 30,
    });
  }, [trashCan]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        onSave(formState);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formState, onCancel, onSave]);

  function handleSubmit(event) {
    event.preventDefault();
    onSave(formState);
  }

  return (
    <div className="tdocs-files-prompt-overlay">
      <div className="tdocs-files-prompt-card tdocs-trash-settings-card">
        <div className="tdocs-files-prompt-title">Trash can settings</div>

        <form className="tdocs-trash-settings-form" onSubmit={handleSubmit}>
          <fieldset className="tdocs-trash-settings-group">
            <legend>Action</legend>
            <label>
              <input
                type="radio"
                name="trash-action"
                checked={formState.action === 'nothing'}
                onChange={() => setFormState((current) => ({ ...current, action: 'nothing' }))}
              />
              Do nothing
            </label>
            <label>
              <input
                type="radio"
                name="trash-action"
                checked={formState.action === 'delete'}
                onChange={() => setFormState((current) => ({ ...current, action: 'delete' }))}
              />
              Auto-delete
            </label>
            <label>
              <input
                type="radio"
                name="trash-action"
                checked={formState.action === 'recover'}
                onChange={() => setFormState((current) => ({ ...current, action: 'recover' }))}
              />
              Auto-recover
            </label>
          </fieldset>

          {formState.action !== 'nothing' ? (
            <fieldset className="tdocs-trash-settings-group">
              <legend>After how long?</legend>
              <label>
                <input
                  type="radio"
                  name="trash-delete-after"
                  checked={formState.deleteAfterDays === 1}
                  onChange={() => setFormState((current) => ({ ...current, deleteAfterDays: 1 }))}
                />
                24 hours
              </label>
              <label>
                <input
                  type="radio"
                  name="trash-delete-after"
                  checked={formState.deleteAfterDays === 7}
                  onChange={() => setFormState((current) => ({ ...current, deleteAfterDays: 7 }))}
                />
                1 week
              </label>
              <label>
                <input
                  type="radio"
                  name="trash-delete-after"
                  checked={formState.deleteAfterDays === 30}
                  onChange={() => setFormState((current) => ({ ...current, deleteAfterDays: 30 }))}
                />
                30 days
              </label>
            </fieldset>
          ) : null}

          <div className="tdocs-files-prompt-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TrashCanSettingsWindow;
