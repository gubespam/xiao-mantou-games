import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import { useSearchParams } from "react-router-dom";
import { publicDocumentIds, publicDocuments } from "./documentRegistry.js";
import { resolveDocumentLink } from "./documentLinks.js";

function createDocumentHref(documentId, fragment) {
  const params = new URLSearchParams({ tab: "documentation", doc: documentId });
  const hash = fragment ? `#${encodeURIComponent(fragment)}` : "";
  return `?${params.toString()}${hash}`;
}

function isUnmodifiedPrimaryClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function DocumentationLink({ href = "", children, currentDocumentId, onNavigateDocument }) {
  const result = resolveDocumentLink(
    currentDocumentId,
    href,
    publicDocumentIds,
  );

  if (result.type === "external") {
    return <a href={result.href}>{children}</a>;
  }

  if (result.type === "fragment") {
    return <a href={`#${encodeURIComponent(result.fragment)}`}>{children}</a>;
  }

  if (result.type === "document") {
    return (
      <a
        href={createDocumentHref(result.documentId, result.fragment)}
        onClick={(event) => {
          if (!isUnmodifiedPrimaryClick(event)) {
            return;
          }
          event.preventDefault();
          onNavigateDocument(result.documentId, result.fragment);
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <span className="tdocs-documentation-invalid-link" title="This documentation link is unavailable.">
      {children}
    </span>
  );
}

function getDocumentLabel(documentId) {
  return documentId.split("/").at(-1).replaceAll("-", " ");
}

function DocumentationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDocumentId = searchParams.get("doc");
  const isInvalidDocument =
    requestedDocumentId !== null && !publicDocumentIds.has(requestedDocumentId);
  const selectedDocumentId = isInvalidDocument || requestedDocumentId === null
    ? "Main"
    : requestedDocumentId;
  const markdown = publicDocuments.get(selectedDocumentId);
  const [showInvalidDocumentNotice, setShowInvalidDocumentNotice] = useState(false);
  const pendingFragmentRef = useRef(null);

  useEffect(() => {
    if (!isInvalidDocument) {
      return;
    }

    setShowInvalidDocumentNotice(true);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.delete("doc");
      return nextParams;
    }, { replace: true });
  }, [isInvalidDocument, setSearchParams]);

  useEffect(() => {
    const fragment = pendingFragmentRef.current;
    if (!fragment) {
      return;
    }
    pendingFragmentRef.current = null;
    document.getElementById(fragment)?.scrollIntoView();
  }, [selectedDocumentId]);

  function navigateToDocument(documentId, fragment) {
    setShowInvalidDocumentNotice(false);
    if (documentId === selectedDocumentId) {
      if (fragment) {
        document.getElementById(fragment)?.scrollIntoView();
      }
      return;
    }

    pendingFragmentRef.current = fragment;
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("tab", "documentation");
      nextParams.set("doc", documentId);
      return nextParams;
    });
  }

  if (typeof markdown !== "string") {
    return (
      <section className="tdocs-tab-screen tdocs-documentation-screen">
        <p>This documentation page is unavailable.</p>
      </section>
    );
  }

  const MarkdownLinkWithNavigation = (props) => (
    <DocumentationLink
      {...props}
      currentDocumentId={selectedDocumentId}
      onNavigateDocument={navigateToDocument}
    />
  );

  return (
    <section className="tdocs-tab-screen tdocs-documentation-screen">
      <nav className="tdocs-documentation-nav" aria-label="Documentation navigation">
        <button
          type="button"
          onClick={() => navigateToDocument("Main", null)}
          disabled={selectedDocumentId === "Main"}
        >
          Contents
        </button>
        <span>{getDocumentLabel(selectedDocumentId)}</span>
      </nav>
      {showInvalidDocumentNotice && (
        <p className="tdocs-documentation-notice" role="status">
          That page is unavailable. Showing the documentation contents.
        </p>
      )}
      <article className="tdocs-markdown-content">
        <ReactMarkdown
          rehypePlugins={[rehypeSlug]}
          components={{ a: MarkdownLinkWithNavigation }}
        >
          {markdown}
        </ReactMarkdown>
      </article>
    </section>
  );
}

export default DocumentationPage;