import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

// Minimal syntax highlighter using regex patterns
function highlight(code: string, language: string): string {
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (language === 'html') {
    return escaped
      .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="hl-tag">$2</span>')
      .replace(/([\w-]+=)(&quot;[^&]*&quot;)/g, '<span class="hl-attr">$1</span><span class="hl-string">$2</span>')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>');
  }

  if (language === 'css') {
    return escaped
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
      .replace(/([.#]?[\w-]+)\s*\{/g, '<span class="hl-selector">$1</span> {')
      .replace(/([\w-]+)\s*:/g, '<span class="hl-property">$1</span>:')
      .replace(/:\s*([^;{}\n]+)/g, ': <span class="hl-value">$1</span>');
  }

  if (language === 'javascript' || language === 'js') {
    return escaped
      .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|default|async|await|new|this|typeof|instanceof|in|of|try|catch|throw|null|undefined|true|false)\b/g, '<span class="hl-keyword">$1</span>')
      .replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;|`[^`]*`)/g, '<span class="hl-string">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
  }

  return escaped;
}

export function CodeViewer({ code, language = 'html', showLineNumbers = true }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const highlighted = highlight(code, language);
  const highlightedLines = highlighted.split('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-viewer" ref={containerRef}>
      <div className="code-viewer-header">
        <span className="code-viewer-lang">{language.toUpperCase()}</span>
        <div className="code-viewer-actions">
          <span className="code-viewer-lines">{lines.length} lines</span>
          <button className="code-viewer-copy" onClick={handleCopy}>
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="code-viewer-body">
        {showLineNumbers && (
          <div className="code-line-numbers" aria-hidden="true">
            {lines.map((_, i) => (
              <span key={i} className="line-number">{i + 1}</span>
            ))}
          </div>
        )}
        <pre className="code-viewer-pre">
          <code
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    </div>
  );
}
