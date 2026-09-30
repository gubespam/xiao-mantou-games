import React, { useEffect, useRef, useState } from 'react';

function getValidUrl(value) {
  try {
    const trimmedValue = value.trim();
    const normalizedValue = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue)
      ? trimmedValue
      : `https://${trimmedValue}`;
    const parsedUrl = new URL(normalizedValue);
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl : null;
  } catch {
    return null;
  }
}

function getTitleFromHostname(url) {
  const hostnameWords = new URL(url).hostname.split('.').filter(Boolean);
  if (hostnameWords[0]?.toLowerCase() === 'www') {
    hostnameWords.shift();
  }

  const titleWords = hostnameWords.length > 1
    ? hostnameWords.slice(0, -1)
    : hostnameWords;
  return titleWords
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

async function loadPageTitle(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return getTitleFromHostname(url);
    }

    const html = await response.text();
    const documentFromHtml = new DOMParser().parseFromString(html, 'text/html');
    return documentFromHtml.title.trim() || getTitleFromHostname(url);
  } catch {
    return getTitleFromHostname(url);
  }
}

function WebLinkWindow({ initialLink, onConfirm, onCancel, validateName }) {
  const [url, setUrl] = useState(initialLink?.url ?? '');
  const [title, setTitle] = useState(initialLink?.title ?? '');
  const [automaticName, setAutomaticName] = useState(!initialLink);
  const [error, setError] = useState('');
  const requestRef = useRef(null);
  const requestUrlRef = useRef('');
  const immediateRequestUrlRef = useRef('');

  function startTitleRequest(requestedUrl) {
    const validUrl = getValidUrl(requestedUrl);
    if (!validUrl) {
      return null;
    }

    const normalizedUrl = validUrl.href;
    requestUrlRef.current = normalizedUrl;
    const request = loadPageTitle(normalizedUrl).then((pageTitle) => {
      if (requestUrlRef.current === normalizedUrl && pageTitle) {
        setTitle(pageTitle);
      }
      return pageTitle;
    });
    requestRef.current = { url: normalizedUrl, promise: request };
    return request;
  }

  useEffect(() => {
    if (!automaticName) {
      requestUrlRef.current = '';
      return undefined;
    }

    const validUrl = getValidUrl(url);
    if (!validUrl) {
      setTitle('');
      requestUrlRef.current = '';
      immediateRequestUrlRef.current = '';
      return undefined;
    }

    if (immediateRequestUrlRef.current === validUrl.href) {
      immediateRequestUrlRef.current = '';
      return undefined;
    }

    immediateRequestUrlRef.current = '';
    setTitle('');
    const timeoutId = window.setTimeout(() => startTitleRequest(url), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [url, automaticName]);

  function handleConfirm() {
    const validUrl = getValidUrl(url);
    if (!validUrl) {
      setError('Enter a valid http or https URL.');
      return;
    }

    const titleRequest = automaticName
      ? requestRef.current?.url === validUrl.href
        ? requestRef.current.promise
        : startTitleRequest(validUrl.href)
      : null;
    const finalTitle = automaticName ? title.trim() || validUrl.hostname : title.trim();

    if (!finalTitle) {
      setError('Please enter a title.');
      return;
    }

    const validationMessage = validateName?.(finalTitle) ?? '';
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    onConfirm({ url: validUrl.href, title: finalTitle, automaticName, titleRequest });
  }

  return (
    <div className="tdocs-files-prompt-overlay">
      <div className="tdocs-files-prompt-card" role="dialog" aria-modal="true" aria-labelledby="web-link-title">
        <div id="web-link-title" className="tdocs-files-prompt-title">New Web Link</div>
        <label className="tdocs-files-prompt-label">
          <span>URL</span>
          <input
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setError('');
            }}
            onBlur={() => {
              const normalizedUrl = getValidUrl(url);
              if (normalizedUrl) {
                setUrl(normalizedUrl.href);
              }
            }}
            placeholder="https://example.com"
          />
        </label>
        <label className="tdocs-files-prompt-label tdocs-web-link-title-field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError('');
            }}
            readOnly={automaticName}
          />
        </label>
        <label className="tdocs-web-link-auto-name">
          <input
            type="checkbox"
            checked={automaticName}
            onChange={(event) => {
              if (event.target.checked) {
                const validUrl = getValidUrl(url);
                immediateRequestUrlRef.current = validUrl?.href ?? '';
                if (validUrl) {
                  setTitle('');
                  startTitleRequest(validUrl.href);
                }
              }
              setAutomaticName(event.target.checked);
              setError('');
            }}
          />
          <span>Automatically name</span>
        </label>
        {error ? <div className="tdocs-files-prompt-error">{error}</div> : null}
        <div className="tdocs-files-prompt-actions">
          <button type="button" onClick={handleConfirm}>OK</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default WebLinkWindow;