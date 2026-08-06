import React, { useEffect, useMemo, useRef, useState } from 'react';
import FileNameWindow from './FileNameWindow';

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
  //   createDirectoryNode('Documents', [
  //     createFileNode('meetup-notes.txt', 'Team sync notes'),
  //     createDirectoryNode('Projects', [
  //       createFileNode('launch-plan.md', '# Launch plan'),
  //     ]),
  //   ]),
  //   createDirectoryNode('Images', [
  //     createFileNode('screenshot.png', 'image-bytes'),
  //   ]),
  //   createFileNode('welcome.txt', 'Welcome to the Files tab.'),
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
    setMenuOpen(false);
  }

  function validateNewName(trimmedName) {
    if (!trimmedName) {
      return 'Please enter a name.';
    }

    const nameExists = currentDirectory?.children?.some(
      (child) => child.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameExists) {
      return 'That name already exists in this directory.';
    }

    return '';
  }

  function handleConfirmNewItem(trimmedName) {
    const nextTree = JSON.parse(JSON.stringify(directoryTree));
    const updatedCurrentDirectory = findDirectoryByPath(nextTree, currentPath);

    if (!updatedCurrentDirectory) {
      return;
    }

    if (promptKind === 'file') {
      updatedCurrentDirectory.children?.push(createFileNode(trimmedName, ''));
    } else {
      updatedCurrentDirectory.children?.push(createDirectoryNode(trimmedName));
    }

    setDirectoryTree(nextTree);
    setPromptKind(null);
    setNewName('');
  }

  function handleCancelNewItem() {
    setPromptKind(null);
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
        <FileNameWindow
          title={`New ${promptKind === 'file' ? 'file' : 'folder'}`}
          isFolder={promptKind === 'folder'}
          value={newName}
          onChange={setNewName}
          onConfirm={handleConfirmNewItem}
          onCancel={handleCancelNewItem}
          validateName={validateNewName}
          inputRef={nameInputRef}
        />
      ) : null}
    </section>
  );
}

export default FilesPage;
