import React, { useState } from 'react';

function FileNameWindow({
  title,
  isFolder,
  value,
  onChange,
  onConfirm,
  onCancel,
  validateName,
  inputRef,
}) {
  const [promptError, setPromptError] = useState('');
  const labelText = isFolder ? 'Folder name' : 'File name';
  const placeholder = isFolder ? 'New folder' : 'example.txt';

  function handleChange(nextValue) {
    onChange(nextValue);

    if (promptError) {
      setPromptError('');
    }
  }

  function handleConfirm() {
    const trimmedValue = value.trim();
    const validationMessage = validateName ? validateName(trimmedValue) : '';

    if (validationMessage) {
      setPromptError(validationMessage);
      return;
    }

    onConfirm(trimmedValue);
  }

  function handleCancel() {
    setPromptError('');
    onCancel();
  }

  return (
    <div className="tdocs-files-prompt-overlay">
      <div className="tdocs-files-prompt-card">
        <div className="tdocs-files-prompt-title">{title}</div>
        <label className="tdocs-files-prompt-label">
          <span>{labelText}</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                handleCancel();
              }

              if (event.key === 'Enter') {
                event.preventDefault();
                handleConfirm();
              }
            }}
            placeholder={placeholder}
          />
        </label>
        {promptError ? <div className="tdocs-files-prompt-error">{promptError}</div> : null}
        <div className="tdocs-files-prompt-actions">
          <button type="button" onClick={handleConfirm}>
            OK
          </button>
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileNameWindow;
