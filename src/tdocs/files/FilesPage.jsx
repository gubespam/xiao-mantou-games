import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'xmg-tdocs-files';

function createDirectoryNode(name, children = []) {
  return {
    type: 'dir',
    name,
    children,
  };
}

function createFileNode(name, content = '') {
  return {
    type: 'file',
    name,
    content,
  };
}

function buildInitialTree() {
  return createDirectoryNode('root', [
    createDirectoryNode('Documents', [
      createFileNode('meetup-notes.txt', 'Team sync notes'),
      createDirectoryNode('Projects', [
        createFileNode('launch-plan.md', '# Launch plan'),
      ]),
    ]),
    createDirectoryNode('Images', [
      createFileNode('screenshot.png', 'image-bytes'),
    ]),
    createFileNode('welcome.txt', 'Welcome to the Files tab.'),
  ]);
}

function loadTreeFromStorage() {
  if (typeof window === 'undefined') {
    return buildInitialTree();
  }

  const rawTree = window.localStorage.getItem(STORAGE_KEY);

  if (!rawTree) {
    const initialTree = buildInitialTree();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTree));
    return initialTree;
  }

  try {
    const parsedTree = JSON.parse(rawTree);

    if (parsedTree && parsedTree.type === 'dir' && Array.isArray(parsedTree.children)) {
      return parsedTree;
    }
  } catch {
    // Fall through to the default tree if parsing fails.
  }

  const fallbackTree = buildInitialTree();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackTree));
  return fallbackTree;
}

function saveTreeToStorage(tree) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
  }
}

function findDirectoryByPath(root, pathSegments) {
  let currentNode = root;

  for (const segment of pathSegments) {
    if (!currentNode || currentNode.type !== 'dir') {
      return null;
    }

    const nextNode = currentNode.children.find(
      (child) => child.type === 'dir' && child.name === segment,
    );

    if (!nextNode) {
      return null;
    }

    currentNode = nextNode;
  }

  return currentNode;
}

function getDisplayPath(pathSegments) {
  if (pathSegments.length === 0) {
    return '/';
  }

  return `/${pathSegments.join('/')}`;
}

function FilesPage() {
  const [directoryTree, setDirectoryTree] = useState(() => loadTreeFromStorage());
  const [currentPath, setCurrentPath] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [promptKind, setPromptKind] = useState(null);
  const [newName, setNewName] = useState('');
  const [promptError, setPromptError] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    saveTreeToStorage(directoryTree);
  }, [directoryTree]);

  useEffect(() => {
    if (promptKind) {
      nameInputRef.current?.focus();
    }
  }, [promptKind]);

  const currentDirectory = useMemo(
    () => findDirectoryByPath(directoryTree, currentPath),
    [directoryTree, currentPath],
  );

  const directoryItems = currentDirectory?.children ?? [];
  const displayPath = getDisplayPath(currentPath);

  function handleOpenDirectory(nextDirectoryName) {
    setCurrentPath((previousPath) => [...previousPath, nextDirectoryName]);
    setMenuOpen(false);
  }

  function handleGoBack() {
    setCurrentPath((previousPath) => previousPath.slice(0, -1));
    setMenuOpen(false);
  }

  function handleAddItem(kind) {
    setPromptKind(kind);
    setNewName('');
    setPromptError('');
    setMenuOpen(false);
  }

  function handleConfirmNewItem() {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      setPromptError('Please enter a name.');
      return;
    }

    const nameExists = currentDirectory?.children.some(
      (child) => child.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameExists) {
      setPromptError('That name already exists in this directory.');
      return;
    }

    const nextTree = JSON.parse(JSON.stringify(directoryTree));
    const updatedCurrentDirectory = findDirectoryByPath(nextTree, currentPath);

    if (!updatedCurrentDirectory) {
      return;
    }

    if (promptKind === 'file') {
      updatedCurrentDirectory.children.push(createFileNode(trimmedName, ''));
    } else {
      updatedCurrentDirectory.children.push(createDirectoryNode(trimmedName));
    }

    setDirectoryTree(nextTree);
    setPromptKind(null);
    setNewName('');
    setPromptError('');
  }

  function handleCancelNewItem() {
    setPromptKind(null);
    setNewName('');
    setPromptError('');
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
        {directoryItems.map((item) => (
          <div className="tdocs-files-item" key={`${item.type}-${item.name}`}>
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
          </div>
        ))}

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

      {promptKind ? (
        <div className="tdocs-files-prompt-overlay">
          <div className="tdocs-files-prompt-card">
            <div className="tdocs-files-prompt-title">
              New {promptKind === 'file' ? 'file' : 'folder'}
            </div>
            <label className="tdocs-files-prompt-label">
              <span>{promptKind === 'file' ? 'File name' : 'Folder name'}</span>
              <input
                ref={nameInputRef}
                type="text"
                value={newName}
                onChange={(event) => {
                  setNewName(event.target.value);
                  setPromptError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    handleCancelNewItem();
                  }

                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleConfirmNewItem();
                  }
                }}
                placeholder={promptKind === 'file' ? 'example.txt' : 'New folder'}
              />
            </label>
            {promptError ? <div className="tdocs-files-prompt-error">{promptError}</div> : null}
            <div className="tdocs-files-prompt-actions">
              <button type="button" onClick={handleConfirmNewItem}>
                OK
              </button>
              <button type="button" onClick={handleCancelNewItem}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default FilesPage;
