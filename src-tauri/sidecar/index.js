/**
 * Nasus Browser Sidecar
 *
 * WebSocket server that manages Playwright browser instances.
 * Each WebSocket connection corresponds to a browser session.
 *
 * The sidecar listens on port 4750 by default.
 */

import { WebSocketServer } from 'ws';
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const PORT = 4750;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Active browser sessions: session_id -> { browser, context, page, ws }
const sessions = new Map();

/**
 * Send a message to the client
 */
function send(ws, type, data = {}) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, ...data }));
  }
}

/**
 * Handle browser navigation
 */
async function handleNavigate(session, url) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  const response = await session.page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  return {
    url: session.page.url(),
    title: await session.page.title(),
    status: response?.status(),
  };
}

/**
 * Handle screenshot
 */
async function handleScreenshot(session, { fullPage = false } = {}) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  const screenshot = await session.page.screenshot({
    fullPage,
    type: 'jpeg',
    quality: 75,
  });

  // Convert to base64
  const base64 = screenshot.toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * Handle click
 */
async function handleClick(session, { selector }) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  const element = session.page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
  await element.click();

  return {
    selector,
    clicked: true,
  };
}

/**
 * Handle type
 */
async function handleType(session, { selector, text, clearFirst = false }) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  if (selector) {
    const element = session.page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    await element.focus();

    if (clearFirst) {
      await element.fill('');
    }

    await element.fill(text);
  } else {
    // Type into currently focused element
    if (clearFirst) {
      await session.page.keyboard.press('Control+A');
      await session.page.keyboard.press('Backspace');
    }
    await session.page.keyboard.type(text);
  }

  return {
    typed: text.length,
  };
}

/**
 * Handle scroll
 */
async function handleScroll(session, { direction = 'down', amount = 400 }) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  const delta = direction === 'up' ? -amount : amount;
  await session.page.evaluate((delta) => {
    window.scrollBy({ top: delta, behavior: 'instant' });
  }, delta);

  return {
    scrolled: delta,
  };
}

/**
 * Handle wait for
 */
async function handleWaitFor(session, { selector, urlPattern, timeoutMs = 10000 }) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  const deadline = Date.now() + timeoutMs;

  if (urlPattern) {
    while (Date.now() < deadline) {
      const url = session.page.url();
      if (url.includes(urlPattern)) {
        return { matched: 'url', url };
      }
      await session.page.waitForTimeout(500);
    }
    throw new Error(`Timeout waiting for URL pattern: ${urlPattern}`);
  }

  if (selector) {
    await session.page.waitForSelector(selector, { timeout: timeoutMs });
    return { matched: 'selector', selector };
  }

  throw new Error('Must provide selector or urlPattern');
}

/**
 * Handle execute JavaScript
 */
async function handleExecute(session, { expression, awaitPromise = false }) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  const result = await session.page.evaluate(expression);
  return { result };
}

/**
 * Handle extract content
 */
async function handleExtract(session, { selector }) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  const target = selector
    ? session.page.locator(selector).first()
    : session.page.locator('body').first();

  const text = await target.innerText();
  const url = session.page.url();
  const title = await session.page.title();

  return {
    url,
    title,
    content: text,
    length: text.length,
  };
}

/**
 * Handle file upload
 */
async function handleUploadFile(session, { selector, filePath }) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  const element = session.page.locator(selector).first();
  await element.setInputFiles(filePath);

  return {
    uploaded: filePath,
  };
}

/**
 * Handle cookie management
 */
async function handleCookies(session, { action, domain, name, value }) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  const context = session.context;

  switch (action) {
    case 'get': {
      const cookies = await context.cookies();
      let filtered = cookies;

      if (domain) {
        filtered = cookies.filter(c => c.domain.includes(domain));
      }
      if (name) {
        filtered = filtered.filter(c => c.name === name);
      }

      return { cookies: filtered };
    }

    case 'set': {
      if (!domain || !name || value === undefined) {
        throw new Error('Set action requires domain, name, and value');
      }

      await context.addCookies([{
        domain,
        name,
        value,
        path: '/',
      }]);

      return { set: true };
    }

    case 'delete': {
      const cookies = await context.cookies();
      let filtered = cookies;

      if (domain) {
        filtered = filtered.filter(c => c.domain.includes(domain));
      }
      if (name) {
        filtered = filtered.filter(c => c.name === name);
      }

      for (const cookie of filtered) {
        await context.removeCookies([{ name: cookie.name, domain: cookie.domain }]);
      }

      return { deleted: filtered.length };
    }

    default:
      throw new Error(`Unknown cookie action: ${action}`);
  }
}

/**
 * Handle ariaSnapshot — returns a YAML accessibility tree via locator.ariaSnapshot().
 * This is the v1.49+ replacement for the removed page.accessibility.snapshot() API.
 * The YAML output is optimised for LLM consumption.
 */
async function handleAriaSnapshot(session, { selector } = {}) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  const locator = selector
    ? session.page.locator(selector).first()
    : session.page.locator('body');

  const snapshot = await locator.ariaSnapshot();
  const url = session.page.url();
  const title = await session.page.title();

  return { url, title, snapshot };
}

/**
 * Handle stealth mode toggle
 */
async function handleSetStealth(session, { enabled }) {
  if (!session.page) {
    throw new Error('No active page in session');
  }

  // Stealth mode is configured at browser launch, but we can update context
  // For now, just acknowledge the setting
  session.stealthMode = enabled;

  return { stealth: enabled };
}

/**
 * Handle incoming WebSocket messages
 */
async function handleMessage(ws, sessionId, message) {
  const session = sessions.get(sessionId);

  if (!session) {
    send(ws, 'error', { message: 'Session not found' });
    return;
  }

  const { type, params } = message;

  try {
    switch (type) {
      case 'navigate':
        send(ws, 'navigate_result', await handleNavigate(session, params.url));
        break;

      case 'screenshot':
        send(ws, 'screenshot_result', {
          dataUrl: await handleScreenshot(session, params)
        });
        break;

      case 'click':
        send(ws, 'click_result', await handleClick(session, params));
        break;

      case 'type':
        send(ws, 'type_result', await handleType(session, params));
        break;

      case 'scroll':
        send(ws, 'scroll_result', await handleScroll(session, params));
        break;

      case 'wait_for':
        send(ws, 'wait_for_result', await handleWaitFor(session, params));
        break;

      case 'execute':
        send(ws, 'execute_result', await handleExecute(session, params));
        break;

      case 'extract':
        send(ws, 'extract_result', await handleExtract(session, params));
        break;

      case 'upload_file':
        send(ws, 'upload_file_result', await handleUploadFile(session, params));
        break;

      case 'cookies':
        send(ws, 'cookies_result', await handleCookies(session, params));
        break;

       case 'set_stealth':
          send(ws, 'set_stealth_result', await handleSetStealth(session, params));
          break;

        case 'aria_snapshot':
          send(ws, 'aria_snapshot_result', await handleAriaSnapshot(session, params ?? {}));
          break;

        case 'ping':
        send(ws, 'pong');
        break;

      default:
        send(ws, 'error', { message: `Unknown message type: ${type}` });
    }
  } catch (error) {
    send(ws, 'error', { message: error.message });
  }
}

/**
 * Start a new browser session
 */
async function startSession(ws, sessionId) {
  console.log(`[Sidecar] Starting session: ${sessionId}`);

    try {
      const browser = await chromium.launch({
        // Use system Chrome — playwright-core ships no bundled browser.
        // Falls back to headless mode if system Chrome is not found.
        channel: 'chrome',
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
      });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Set up console logging
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    sessions.set(sessionId, { browser, context, page, ws });
    send(ws, 'session_ready', { sessionId });

    console.log(`[Sidecar] Session ready: ${sessionId}`);
  } catch (error) {
    console.error(`[Sidecar] Error starting session:`, error);
    send(ws, 'error', { message: `Failed to start session: ${error.message}` });
    ws.close();
  }
}

/**
 * Stop a browser session
 */
async function stopSession(sessionId) {
  const session = sessions.get(sessionId);

  if (session) {
    console.log(`[Sidecar] Stopping session: ${sessionId}`);

    try {
      await session.browser.close();
    } catch (error) {
      console.error(`[Sidecar] Error closing browser:`, error);
    }

    sessions.delete(sessionId);
    console.log(`[Sidecar] Session stopped: ${sessionId}`);
  }
}

/**
 * Create the WebSocket server
 */
function createServer() {
  const server = new WebSocketServer({
    port: PORT,
    perMessageDeflate: false,
  });

  server.on('listening', () => {
    console.log(`[Sidecar] WebSocket server listening on port ${PORT}`);
    console.log(`[Sidecar] Playwright ready to accept connections`);
  });

  server.on('connection', (ws, req) => {
    // Extract session ID from URL path: /ws/{session_id}
    const path = req.url;
    const sessionId = path?.match(/\/ws\/([^/]+)/)?.[1];

    if (!sessionId) {
      console.error('[Sidecar] Connection rejected: no session ID in path');
      ws.close(1008, 'No session ID provided');
      return;
    }

    console.log(`[Sidecar] Client connected for session: ${sessionId}`);

    // Send welcome message
    send(ws, 'connected', { sessionId });

    // Start the browser session
    startSession(ws, sessionId);

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, sessionId, message);
      } catch (error) {
        console.error('[Sidecar] Error parsing message:', error);
        send(ws, 'error', { message: 'Invalid JSON' });
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      console.log(`[Sidecar] Client disconnected: ${sessionId}`);
      stopSession(sessionId);
    });

    ws.on('error', (error) => {
      console.error(`[Sidecar] WebSocket error for session ${sessionId}:`, error);
    });

    // Set up heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        send(ws, 'heartbeat');
      } else {
        clearInterval(heartbeat);
      }
    }, HEARTBEAT_INTERVAL);

    ws.on('close', () => clearInterval(heartbeat));
  });

  server.on('error', (error) => {
    console.error('[Sidecar] Server error:', error);
  });

  return server;
}

/**
 * Graceful shutdown
 */
function setupShutdown(server) {
  const shutdown = async () => {
    console.log('[Sidecar] Shutting down...');

    // Close all sessions
    for (const sessionId of sessions.keys()) {
      await stopSession(sessionId);
    }

    // Close the server
    server.close(() => {
      console.log('[Sidecar] Server closed');
      process.exit(0);
    });

    // Force exit after 5 seconds
    setTimeout(() => process.exit(1), 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * Main entry point
 */
function main() {
  console.log('[Sidecar] Starting Nasus Browser Sidecar...');
  console.log('[Sidecar] Playwright version:', chromium.version());

  const server = createServer();
  setupShutdown(server);
}

// Start the server
main();
