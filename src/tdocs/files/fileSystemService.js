export const STORAGE_KEY = 'xmg-tdocs-files';

export function createDirectoryNode(name, children = []) {
  return {
    type: 'dir',
    name,
    children,
  };
}

export function createFileNode(name, content = '') {
  return {
    type: 'file',
    name,
    content,
  };
}

export function buildInitialTree() {
  return createDirectoryNode('root', []);
}

export function cloneTree(tree) {
  return JSON.parse(JSON.stringify(tree));
}

export function loadTreeFromStorage(storage) {
  if (typeof window === 'undefined' || !storage) {
    return buildInitialTree();
  }

  const rawTree = storage.getItem(STORAGE_KEY);

  if (!rawTree) {
    const initialTree = buildInitialTree();
    storage.setItem(STORAGE_KEY, JSON.stringify(initialTree));
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
  storage.setItem(STORAGE_KEY, JSON.stringify(fallbackTree));
  return fallbackTree;
}

export function saveTreeToStorage(tree, storage) {
  if (typeof window !== 'undefined' && storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(tree));
  }
}

export function findDirectoryByPath(root, pathSegments) {
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

export function getDisplayPath(pathSegments) {
  if (pathSegments.length === 0) {
    return '/';
  }

  return `/${pathSegments.join('/')}`;
}

export function getDirectoryItems(tree, pathSegments) {
  const currentDirectory = findDirectoryByPath(tree, pathSegments);
  return currentDirectory?.children ?? [];
}

export function navigateToDirectory(pathSegments, nextDirectoryName) {
  return [...pathSegments, nextDirectoryName];
}

export function goToParentDirectory(pathSegments) {
  return pathSegments.slice(0, -1);
}

export function addItem(tree, pathSegments, kind, name) {
  const nextTree = cloneTree(tree);
  const currentDirectory = findDirectoryByPath(nextTree, pathSegments);

  if (!currentDirectory) {
    return tree;
  }

  currentDirectory.children = currentDirectory.children ?? [];
  currentDirectory.children.push(
    kind === 'folder' ? createDirectoryNode(name) : createFileNode(name, ''),
  );

  return nextTree;
}

export function renameItem(tree, pathSegments, index, name) {
  const nextTree = cloneTree(tree);
  const currentDirectory = findDirectoryByPath(nextTree, pathSegments);

  if (!currentDirectory?.children?.[index]) {
    return tree;
  }

  currentDirectory.children[index].name = name;
  return nextTree;
}

export function deleteItem(tree, pathSegments, index) {
  const nextTree = cloneTree(tree);
  const currentDirectory = findDirectoryByPath(nextTree, pathSegments);

  if (!currentDirectory?.children || index < 0 || index >= currentDirectory.children.length) {
    return tree;
  }

  const [removedItem] = currentDirectory.children.splice(index, 1);
  return removedItem ? nextTree : tree;
}

export function explodeFolder(tree, pathSegments, index) {
  const nextTree = cloneTree(tree);
  const currentDirectory = findDirectoryByPath(nextTree, pathSegments);

  if (!currentDirectory?.children || index < 0 || index >= currentDirectory.children.length) {
    return tree;
  }

  const folder = currentDirectory.children[index];

  if (folder.type !== 'dir') {
    return tree;
  }

  currentDirectory.children.splice(index, 1, ...(folder.children ?? []));
  return nextTree;
}

export function moveItem(tree, sourcePath, index, targetPath) {
  if (sourcePath.length === targetPath.length && sourcePath.every((segment, pathIndex) => segment === targetPath[pathIndex])) {
    return tree;
  }

  const nextTree = cloneTree(tree);
  const sourceDirectory = findDirectoryByPath(nextTree, sourcePath);
  const targetDirectory = findDirectoryByPath(nextTree, targetPath);

  if (!sourceDirectory?.children || !targetDirectory || index < 0 || index >= sourceDirectory.children.length) {
    return tree;
  }

  const item = sourceDirectory.children[index];
  const itemPath = [...sourcePath, item.name];
  const targetIsInsideItem = item.type === 'dir'
    && targetPath.length >= itemPath.length
    && itemPath.every((segment, pathIndex) => targetPath[pathIndex] === segment);

  if (targetIsInsideItem) {
    return tree;
  }

  const [removedItem] = sourceDirectory.children.splice(index, 1);
  targetDirectory.children = targetDirectory.children ?? [];
  targetDirectory.children.push(removedItem);
  return nextTree;
}

export function restoreItem(tree, item, originalPath = []) {
  if (!item || !Array.isArray(originalPath)) {
    return tree;
  }

  const nextTree = cloneTree(tree);
  let targetPath = originalPath.slice();
  let targetDirectory = findDirectoryByPath(nextTree, targetPath);

  while (!targetDirectory && targetPath.length > 0) {
    targetPath = targetPath.slice(0, -1);
    targetDirectory = findDirectoryByPath(nextTree, targetPath);
  }

  if (!targetDirectory) {
    return tree;
  }

  targetDirectory.children = targetDirectory.children ?? [];
  targetDirectory.children.push(cloneTree(item));
  return nextTree;
}
