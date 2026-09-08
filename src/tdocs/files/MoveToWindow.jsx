import React, { useMemo, useState } from 'react';
import {
  findDirectoryByPath,
  getDisplayPath,
  goToParentDirectory,
  navigateToDirectory,
} from './fileSystemService';

function isSamePath(leftPath, rightPath) {
  return leftPath.length === rightPath.length
    && leftPath.every((segment, index) => segment === rightPath[index]);
}

function isPathInside(path, parentPath) {
  return path.length >= parentPath.length
    && parentPath.every((segment, index) => path[index] === segment);
}

function MoveToWindow({ tree, sourcePath, sourceItem, onConfirm, onCancel }) {
  const [browserPath, setBrowserPath] = useState(sourcePath);
  const [selectedPath, setSelectedPath] = useState(sourcePath);
  const browserDirectory = findDirectoryByPath(tree, browserPath);
  const directories = useMemo(
    () => (browserDirectory?.children ?? [])
      .filter((item) => item.type === 'dir')
      .sort((left, right) => left.name.localeCompare(right.name)),
    [browserDirectory],
  );

  function handleGoBack() {
    setBrowserPath((path) => goToParentDirectory(path));
  }

  function handleMove() {
    onConfirm(selectedPath);
  }

  return (
    <div className="tdocs-files-prompt-overlay">
      <div className="tdocs-files-prompt-card tdocs-files-move-card" role="dialog" aria-modal="true" aria-labelledby="move-prompt-title">
        <div id="move-prompt-title" className="tdocs-files-prompt-title">
          Move &quot;{sourceItem.name}&quot; to...
        </div>
        <div className="tdocs-files-move-browser">
          <div className="tdocs-files-move-toolbar">
            <button
              type="button"
              className="tdocs-files-back-button"
              onClick={handleGoBack}
              disabled={browserPath.length === 0}
              aria-label="Go to parent directory"
            >
              ←
            </button>
            <span>{getDisplayPath(browserPath)}</span>
            <button
              type="button"
              className="tdocs-files-move-current-button"
              onClick={() => setSelectedPath(browserPath)}
            >
              Select this directory
            </button>
          </div>
          <div className="tdocs-files-move-list">
            {directories.map((directory) => {
              const directoryPath = navigateToDirectory(browserPath, directory.name);
              const isDisabled = sourceItem.type === 'dir' && isPathInside(directoryPath, [...sourcePath, sourceItem.name]);
              const isSelected = isSamePath(selectedPath, directoryPath);

              return (
                <div className={`tdocs-files-move-item${isSelected ? ' is-selected' : ''}`} key={directory.name}>
                  <button
                    type="button"
                    className="tdocs-files-link tdocs-files-move-name"
                    onClick={() => setBrowserPath(directoryPath)}
                    disabled={isDisabled}
                  >
                    <span aria-hidden="true">📁</span>
                    {directory.name}
                  </button>
                  <button
                    type="button"
                    className="tdocs-files-move-select"
                    onClick={() => setSelectedPath(directoryPath)}
                    disabled={isDisabled}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              );
            })}
            {directories.length === 0 ? <div className="tdocs-files-move-empty">No subdirectories</div> : null}
          </div>
        </div>
        <div className="tdocs-files-move-selected">Destination: {getDisplayPath(selectedPath)}</div>
        <div className="tdocs-files-prompt-actions">
          <button type="button" onClick={handleMove}>Move</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default MoveToWindow;