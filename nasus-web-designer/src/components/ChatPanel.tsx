import React, { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { Send, Square, Copy, Check, Bot, User } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useDesignSession } from '../hooks/useDesignSession';
import type { Message } from '../types';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="copy-btn" onClick={handleCopy} title="Copy code">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-lang">{language ?? 'code'}</span>
        <CopyButton text={code} />
      </div>
      <pre className="code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderMessageContent(content: string) {
  if (!content) return null;

  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <p key={lastIndex} className="msg-text">
          {content.slice(lastIndex, match.index)}
        </p>
      );
    }
    parts.push(
      <CodeBlock key={match.index} language={match[1]} code={match[2].trim()} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <p key={lastIndex} className="msg-text">
        {content.slice(lastIndex)}
      </p>
    );
  }

  return parts.length > 0 ? parts : <p className="msg-text">{content}</p>;
}

function MessageBubble({ message, isStreaming, streamBuffer }: {
  message: Message;
  isStreaming: boolean;
  streamBuffer: string;
}) {
  const isUser = message.role === 'user';
  const isLastAssistant = message.role === 'assistant' && isStreaming && message.content === '';

  const displayContent = isLastAssistant ? streamBuffer : message.content;

  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--assistant'}`}>
      <div className="message-avatar">
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`message-bubble ${isUser ? 'bubble--user' : 'bubble--assistant'}`}>
        {isLastAssistant && streamBuffer === '' ? (
          <div className="typing-indicator">
            <span /><span /><span />
          </div>
        ) : (
          renderMessageContent(displayContent)
        )}
        {isLastAssistant && streamBuffer !== '' && (
          <span className="stream-cursor" />
        )}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { activeSession, isStreaming, streamBuffer, activeSessionId, settings } = useAppStore();
  const { generate, refine, isLoading, error, cancel } = useDesignSession();

  const session = activeSession();
  const messages = session?.messages ?? [];
  const currentModel = session?.model ?? settings.defaultModel;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamBuffer]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !activeSessionId) return;
    setInput('');

    const hasExistingCode = session && session.currentHtml.trim() !== '';
    if (hasExistingCode) {
      await refine(trimmed, currentModel);
    } else {
      await generate(trimmed, currentModel);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-left">
          <Bot size={18} className="chat-header-icon" />
          <span className="chat-header-title">
            {session?.name ?? 'New Session'}
          </span>
        </div>
        <div className="chat-header-model">
          <span className="model-badge">{currentModel}</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <Bot size={40} />
            </div>
            <h3 className="chat-empty-title">Start designing</h3>
            <p className="chat-empty-desc">
              Describe the website you want to build. Be specific about colors,
              layout, content, and style.
            </p>
            <div className="chat-suggestions">
              {[
                'Landing page for a SaaS product with dark theme',
                'Personal portfolio with grid gallery and contact form',
                'E-commerce product page with cart sidebar',
                'Dashboard with stats cards and charts',
              ].map((s) => (
                <button
                  key={s}
                  className="suggestion-chip"
                  onClick={() => setInput(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isStreaming}
              streamBuffer={streamBuffer}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="chat-error">
          <span>{error}</span>
        </div>
      )}

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              session?.currentHtml
                ? 'Describe a change to make...'
                : 'Describe the website you want to build...'
            }
            disabled={isLoading}
            rows={1}
          />
          <div className="chat-input-actions">
            {isLoading ? (
              <button className="btn-send btn-stop" onClick={cancel} title="Stop generation">
                <Square size={16} />
              </button>
            ) : (
              <button
                className="btn-send"
                onClick={handleSend}
                disabled={!input.trim() || !activeSessionId}
                title="Send (Enter)"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="chat-hint">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
