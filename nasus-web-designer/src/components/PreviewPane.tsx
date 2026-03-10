import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw, ExternalLink, Monitor, Code2, Layers, Braces } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { CodeViewer } from './CodeViewer';
import type { PreviewTab } from '../types';

function EmptyPreview() {
  return (
    <div className="preview-empty">
      <div className="preview-empty-icon">
        <Monitor size={48} />
      </div>
      <h3 className="preview-empty-title">No preview yet</h3>
      <p className="preview-empty-desc">
        Ask Nasus to build a website and it will appear here in real-time.
      </p>
    </div>
  );
}

export function PreviewPane() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('preview');
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { activeSession, isStreaming, streamBuffer } = useAppStore();
  const session = activeSession();

  const html = session?.currentHtml ?? '';
  const css = session?.currentCss ?? '';
  const js = session?.currentJs ?? '';

  // Build the full document for the iframe
  const buildDocument = () => {
    if (!html) return '';

    // If html is already a full doc
    if (html.trim().startsWith('<!DOCTYPE') || html.trim().startsWith('<html')) {
      return html;
    }

    // Wrap partial html
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  ${css ? `<style>${css}</style>` : ''}
</head>
<body>
  ${html}
  ${js ? `<script>${js}</script>` : ''}
</body>
</html>`;
  };

  // For streaming preview — show partial HTML as it streams
  const getLiveDocument = () => {
    if (isStreaming && streamBuffer) {
      const buf = streamBuffer.trim();
      if (buf.startsWith('<!DOCTYPE') || buf.startsWith('<html')) {
        return buf;
      }
    }
    return buildDocument();
  };

  const srcdoc = getLiveDocument();

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleOpenExternal = () => {
    const doc = buildDocument();
    if (!doc) return;
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const tabs: { id: PreviewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'preview', label: 'Preview', icon: <Monitor size={14} /> },
    { id: 'html', label: 'HTML', icon: <Code2 size={14} /> },
    { id: 'css', label: 'CSS', icon: <Layers size={14} /> },
    { id: 'js', label: 'JS', icon: <Braces size={14} /> },
  ];

  return (
    <div className="preview-pane">
      <div className="preview-header">
        <div className="preview-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`preview-tab ${activeTab === tab.id ? 'preview-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="preview-actions">
          {isStreaming && (
            <div className="preview-streaming-badge">
              <span className="streaming-dot" />
              Generating...
            </div>
          )}
          <button className="preview-action-btn" onClick={handleRefresh} title="Refresh preview">
            <RefreshCw size={15} />
          </button>
          <button
            className="preview-action-btn"
            onClick={handleOpenExternal}
            title="Open in browser"
            disabled={!html}
          >
            <ExternalLink size={15} />
          </button>
        </div>
      </div>

      <div className="preview-content">
        {activeTab === 'preview' && (
          <>
            {!srcdoc ? (
              <EmptyPreview />
            ) : (
              <iframe
                key={refreshKey}
                ref={iframeRef}
                className="preview-iframe"
                srcDoc={srcdoc}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                title="Website Preview"
              />
            )}
          </>
        )}

        {activeTab === 'html' && (
          <CodeViewer code={html || '<!-- No HTML yet -->'} language="html" />
        )}

        {activeTab === 'css' && (
          <CodeViewer code={css || '/* No CSS yet */'} language="css" />
        )}

        {activeTab === 'js' && (
          <CodeViewer code={js || '// No JavaScript yet'} language="javascript" />
        )}
      </div>
    </div>
  );
}
