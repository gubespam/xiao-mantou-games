const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function decodePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function resolveDocumentLink(currentDocumentId, href, publicDocumentIds) {
  if (typeof href !== "string" || typeof currentDocumentId !== "string") {
    return { type: "invalid" };
  }

  const target = href.trim();
  if (!target) {
    return { type: "invalid" };
  }

  const schemeMatch = target.match(/^([a-z][a-z\d+.-]*:)/i);
  if (schemeMatch) {
    try {
      const url = new URL(target);
      if (ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol)) {
        return { type: "external", href: target };
      }
    } catch {
      return { type: "invalid" };
    }
    return { type: "invalid" };
  }

  if (target.startsWith("#")) {
    const fragment = decodePart(target.slice(1));
    return fragment === null
      ? { type: "invalid" }
      : { type: "fragment", fragment };
  }

  if (target.startsWith("/") || target.includes("\\")) {
    return { type: "invalid" };
  }

  const fragmentIndex = target.indexOf("#");
  const pathWithQuery = fragmentIndex === -1 ? target : target.slice(0, fragmentIndex);
  const rawFragment = fragmentIndex === -1 ? null : target.slice(fragmentIndex + 1);
  if (pathWithQuery.includes("?")) {
    return { type: "invalid" };
  }

  const decodedPath = decodePart(pathWithQuery);
  const fragment = rawFragment === null ? null : decodePart(rawFragment);
  if (
    decodedPath === null ||
    (fragment === null && rawFragment !== null) ||
    !decodedPath.endsWith(".md")
  ) {
    return { type: "invalid" };
  }

  const pathSegments = currentDocumentId.split("/").slice(0, -1);
  for (const segment of decodedPath.split("/")) {
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      if (pathSegments.length === 0) {
        return { type: "invalid" };
      }
      pathSegments.pop();
      continue;
    }
    pathSegments.push(segment);
  }

  const documentId = pathSegments.join("/").replace(/\.md$/, "");
  if (!publicDocumentIds.has(documentId)) {
    return { type: "invalid" };
  }

  return { type: "document", documentId, fragment };
}