/**
 * Nasus Browser Sidecar
 *
 * WebSocket server that manages Playwright browser instances.
 * Each WebSocket connection corresponds to a persistent browser session —
 * the connection is kept alive for the lifetime of the session, so all
 * commands share a single socket instead of reconnecting per call.
 *
 * The sidecar listens on port 4750 by default.
 */

import { WebSocketServer } from 'ws';
import { chromium } from 'playwright-core';

const PORT = 4750;
const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

// Active browser sessions: session_id -> SessionState
const sessions = new Map();

// ─── Stealth init script ──────────────────────────────────────────────────────
// Injected into every new page to remove Playwright/Chromium fingerprints.
const STEALTH_INIT_SCRIPT = `
  (() => {
    // Hide webdriver flag
    Object.defineProperty(navigator, 'webdriver', { get: () => false });

    // Patch languages / plugins to look real
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const p = [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
          { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
        ];
        p.item = (i) => p[i];
        p.namedItem = (n) => p.find(x => x.name === n) || null;
        p.refresh = () => {};
        Object.setPrototypeOf(p, PluginArray.prototype);
        return p;
      }
    });

    // Patch permission query (Playwright returns "denied" for notifications by default)
    const origQuery = window.navigator.permissions?.query;
    if (origQuery) {
      window.navigator.permissions.query = (params) =>
        params?.name === 'notifications'
          ? Promise.resolve({ state: 'default', onchange: null })
          : origQuery.call(window.navigator.permissions, params);
    }

    // Remove Playwright-specific chrome runtime properties
    if (!window.chrome) {
      window.chrome = { runtime: {} };
    }
  })();
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function send(ws, type, data = {}) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, ...data }));
  }
}

function ensurePage(session) {
  if (!session.page) throw new Error('No active page in session');
}

// ─── DOM → Markdown extraction (runs inside Playwright page context) ──────────
// This mirrors the logic in htmlExtractor.ts but runs in-page via evaluate(),
// so it works on the live rendered DOM (including JS-rendered content).
const DOM_TO_MARKDOWN_SCRIPT = `
  (() => {
    function getAbsUrl(href) {
      try { return new URL(href, location.href).href; } catch { return href; }
    }

    function walkNode(node, parts, depth) {
      if (node.nodeType === 3) { // TEXT_NODE
        const t = (node.textContent || '').replace(/\\s+/g, ' ');
        if (t.trim()) parts.push(t);
        return;
      }
      if (node.nodeType !== 1) return; // ELEMENT_NODE
      const el = node;
      const tag = el.tagName.toLowerCase();

      if (el.getAttribute('hidden') !== null) return;
      if (el.getAttribute('aria-hidden') === 'true') return;

      switch (tag) {
        case 'script': case 'style': case 'noscript':
        case 'iframe': case 'svg': case 'canvas': return;
        case 'h1': parts.push('\\n\\n# ' + (el.textContent||'').replace(/\\s+/g,' ').trim() + '\\n\\n'); return;
        case 'h2': parts.push('\\n\\n## ' + (el.textContent||'').replace(/\\s+/g,' ').trim() + '\\n\\n'); return;
        case 'h3': parts.push('\\n\\n### ' + (el.textContent||'').replace(/\\s+/g,' ').trim() + '\\n\\n'); return;
        case 'h4': case 'h5': case 'h6':
          parts.push('\\n\\n#### ' + (el.textContent||'').replace(/\\s+/g,' ').trim() + '\\n\\n'); return;
        case 'p':
          parts.push('\\n\\n');
          walkChildren(el, parts, depth);
          parts.push('\\n\\n');
          return;
        case 'br': parts.push('\\n'); return;
        case 'hr': parts.push('\\n\\n---\\n\\n'); return;
        case 'li':
          parts.push('\\n• ');
          walkChildren(el, parts, depth);
          return;
        case 'blockquote':
          parts.push('\\n\\n> ' + (el.textContent||'').replace(/\\s+/g,' ').trim().replace(/\\n/g,'\\n> ') + '\\n\\n');
          return;
        case 'pre':
          parts.push('\\n\\n\`\`\`\\n' + (el.textContent||'').trim() + '\\n\`\`\`\\n\\n');
          return;
        case 'code':
          if (el.closest('pre')) { walkChildren(el, parts, depth); return; }
          parts.push('\`' + (el.textContent||'') + '\`');
          return;
        case 'a': {
          const href = el.getAttribute('href');
          const text = (el.textContent||'').replace(/\\s+/g,' ').trim();
          if (!text) return;
          if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
            parts.push('[' + text + '](' + getAbsUrl(href) + ')');
          } else {
            parts.push(text);
          }
          return;
        }
        case 'img': {
          const alt = (el.getAttribute('alt')||'').trim();
          if (alt) parts.push('[image: ' + alt + ']');
          return;
        }
        case 'table': parts.push('\\n\\n'); walkChildren(el, parts, depth); parts.push('\\n\\n'); return;
        case 'tr': parts.push('\\n'); walkChildren(el, parts, depth); return;
        case 'td': case 'th': walkChildren(el, parts, depth); parts.push(' | '); return;
        default: walkChildren(el, parts, depth + 1);
      }
    }

    function walkChildren(el, parts, depth) {
      for (const child of Array.from(el.childNodes)) walkNode(child, parts, depth);
    }

    // Remove noise
    const noiseSelectors = [
      'script','style','noscript','iframe','svg','canvas',
      'nav','header','footer',
      '[role="navigation"]','[role="banner"]','[role="contentinfo"]','[role="complementary"]',
      '.nav','.navbar','.header','.footer','.sidebar','.side-bar',
      '.menu','.breadcrumb','.breadcrumbs','.pagination',
      '.ad','.ads','.advert','.advertisement','.adsbygoogle',
      '.cookie-banner','.cookie-notice','.cookie-consent','.cookie-bar',
      '.popup','.modal','.overlay','.dialog',
      '.social-share','.share-buttons','.social',
      '.comments','.comment-section','#comments',
      '.related-posts','.related-articles','.recommended',
      '.newsletter','.subscribe','.subscription',
      '[data-ad]','[data-advertisement]',
    ];

    // Work on a clone so we don't mutate the live DOM
    const clone = document.body.cloneNode(true);
    for (const sel of noiseSelectors) {
      try { clone.querySelectorAll(sel).forEach(e => e.remove()); } catch {}
    }

    // Find main content container
    let container = null;
    for (const sel of ['main','article','[role="main"]','#main','#content','.content','.post','.article']) {
      const el = clone.querySelector(sel);
      if (el && (el.textContent||'').trim().length > 200) { container = el; break; }
    }
    if (!container) {
      // Fallback: densest text block
      let best = clone, bestScore = 0;
      for (const el of Array.from(clone.querySelectorAll('div,section'))) {
        const text = (el.textContent||'').trim();
        if (text.length < 200 || text.length > 500000) continue;
        const linkChars = Array.from(el.querySelectorAll('a')).reduce((s,a) => s+(a.textContent||'').length,0);
        if (linkChars/text.length > 0.6) continue;
        const score = text.length / Math.max(Math.log2((el.children.length||1)+1),1);
        if (score > bestScore) { bestScore = score; best = el; }
      }
      container = best;
    }

    const parts = [];
    walkNode(container, parts, 0);
    return parts.join('')
      .replace(/\\n{3,}/g,'\\n\\n')
      .replace(/[ \\t]{2,}/g,' ')
      .replace(/^\\s+$/gm,'')
      .trim();
  })()
`;

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleNavigate(session, { url, timeoutMs = 30000 }) {
  ensurePage(session);

  let response;
  try {
    response = await session.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    });
  } catch (err) {
    // Enrich common network errors with human-readable messages
    const msg = err.message || String(err);
    if (msg.includes('ERR_NAME_NOT_RESOLVED')) throw new Error(`DNS lookup failed — "${url}" could not be resolved. Check the URL.`);
    if (msg.includes('ERR_CONNECTION_REFUSED')) throw new Error(`Connection refused at "${url}". The server may be down.`);
    if (msg.includes('ERR_CONNECTION_TIMED_OUT') || msg.includes('Timeout')) throw new Error(`Navigation timed out after ${timeoutMs}ms loading "${url}".`);
    if (msg.includes('ERR_CERT')) throw new Error(`SSL certificate error for "${url}".`);
    if (msg.includes('net::ERR')) throw new Error(`Network error navigating to "${url}": ${msg}`);
    throw err;
  }

  const status = response?.status() ?? 0;
  if (status >= 400) {
    console.warn(`[Sidecar] HTTP ${status} for ${url}`);
  }

  return {
    url: session.page.url(),
    title: await session.page.title(),
    status,
  };
}

async function handleScreenshot(session, { fullPage = false } = {}) {
  ensurePage(session);
  const screenshot = await session.page.screenshot({ fullPage, type: 'jpeg', quality: 75 });
  return `data:image/jpeg;base64,${screenshot.toString('base64')}`;
}

async function handleClick(session, { selector, x, y }) {
  ensurePage(session);

  if (selector) {
    const element = session.page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    // Get element info before clicking
    const info = await element.evaluate(el => ({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0, 80),
      href: el.href || null,
    })).catch(() => ({ tag: 'unknown', text: '', href: null }));
    await element.click();
    return { selector, clicked: true, tag: info.tag, text: info.text, href: info.href };
  } else if (x !== undefined && y !== undefined) {
    await session.page.mouse.click(x, y);
    return { x, y, clicked: true };
  } else {
    throw new Error('click requires selector or x,y coordinates');
  }
}

async function handleType(session, { selector, text, clearFirst = false }) {
  ensurePage(session);
  if (selector) {
    const element = session.page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    await element.focus();
    if (clearFirst) await element.fill('');
    await element.fill(text);
  } else {
    if (clearFirst) {
      await session.page.keyboard.press('Control+A');
      await session.page.keyboard.press('Backspace');
    }
    await session.page.keyboard.type(text);
  }
  return { typed: text.length };
}

async function handleScroll(session, { direction = 'down', amount = 400 }) {
  ensurePage(session);
  const delta = direction === 'up' ? -amount : amount;
  await session.page.evaluate((d) => window.scrollBy({ top: d, behavior: 'instant' }), delta);
  return { scrolled: delta };
}

async function handleWaitFor(session, { selector, urlPattern, timeoutMs = 10000 }) {
  ensurePage(session);
  const deadline = Date.now() + timeoutMs;

  if (urlPattern) {
    while (Date.now() < deadline) {
      if (session.page.url().includes(urlPattern)) {
        return { matched: 'url', url: session.page.url() };
      }
      await session.page.waitForTimeout(300);
    }
    throw new Error(`Timeout waiting for URL pattern: ${urlPattern}`);
  }

  if (selector) {
    await session.page.waitForSelector(selector, { timeout: timeoutMs });
    return { matched: 'selector', selector };
  }

  throw new Error('Must provide selector or urlPattern');
}

async function handleExecute(session, { expression }) {
  ensurePage(session);
  const result = await session.page.evaluate(expression);
  return { result };
}

/**
 * handleExtract — runs the DOM-to-Markdown script in-page via evaluate().
 * Falls back to innerText if evaluate fails (CSP or sandbox restrictions).
 */
async function handleExtract(session, { selector } = {}) {
  ensurePage(session);
  const url = session.page.url();
  const title = await session.page.title();

  let content;

  if (selector) {
    // Scoped extraction: use innerText for specific elements (fast + reliable)
    try {
      content = await session.page.locator(selector).first().innerText();
    } catch {
      content = '';
    }
  } else {
    // Full-page: run the rich DOM→Markdown walker
    try {
      content = await session.page.evaluate(DOM_TO_MARKDOWN_SCRIPT);
    } catch (err) {
      console.warn('[Sidecar] DOM→Markdown evaluate failed, falling back to innerText:', err.message);
      try {
        content = await session.page.locator('body').first().innerText();
        // Basic cleanup
        content = content.replace(/\n{3,}/g, '\n\n').trim();
      } catch {
        content = '';
      }
    }
  }

  return { url, title, content: content || '', length: (content || '').length };
}

/**
 * handleReadPage — high-level: navigate + wait for network idle + extract.
 * Single round-trip for "read this URL" use cases.
 */
async function handleReadPage(session, { url, timeoutMs = 30000, selector }) {
  ensurePage(session);

  // Navigate
  await handleNavigate(session, { url, timeoutMs });

  // Wait for network to settle (up to 3s after domcontentloaded)
  try {
    await session.page.waitForLoadState('networkidle', { timeout: 3000 });
  } catch {
    // networkidle timeout is fine — page is loaded enough
  }

  // Extract
  const extracted = await handleExtract(session, { selector });
  return extracted;
}

async function handleUploadFile(session, { selector, filePath }) {
  ensurePage(session);
  await session.page.locator(selector).first().setInputFiles(filePath);
  return { uploaded: filePath };
}

async function handleCookies(session, { action, domain, name, value }) {
  ensurePage(session);
  const context = session.context;

  switch (action) {
    case 'get': {
      let cookies = await context.cookies();
      if (domain) cookies = cookies.filter(c => c.domain.includes(domain));
      if (name) cookies = cookies.filter(c => c.name === name);
      return { cookies };
    }
    case 'set': {
      if (!domain || !name || value === undefined) throw new Error('set requires domain, name, value');
      await context.addCookies([{ domain, name, value, path: '/' }]);
      return { set: true };
    }
    case 'delete': {
      let cookies = await context.cookies();
      if (domain) cookies = cookies.filter(c => c.domain.includes(domain));
      if (name) cookies = cookies.filter(c => c.name === name);
      for (const c of cookies) await context.removeCookies([{ name: c.name, domain: c.domain }]);
      return { deleted: cookies.length };
    }
    default:
      throw new Error(`Unknown cookie action: ${action}`);
  }
}

async function handleAriaSnapshot(session, { selector } = {}) {
  ensurePage(session);
  const locator = selector
    ? session.page.locator(selector).first()
    : session.page.locator('body');
  const snapshot = await locator.ariaSnapshot();
  return {
    url: session.page.url(),
    title: await session.page.title(),
    snapshot,
  };
}

async function handleGetTabs(session) {
  ensurePage(session);
  return {
    tabs: [{ id: 0, url: session.page.url(), title: await session.page.title(), active: true }],
  };
}

async function handleSelect(session, { selector, value, label }) {
  ensurePage(session);
  const element = session.page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
  let selectedValue;
  if (value !== undefined) {
    await element.selectOption({ value: String(value) });
    selectedValue = String(value);
  } else if (label !== undefined) {
    await element.selectOption({ label: String(label) });
    selectedValue = label;
  } else {
    throw new Error('select requires value or label');
  }
  return { selectedValue };
}

// ─── Message router ───────────────────────────────────────────────────────────

async function handleMessage(ws, sessionId, message) {
  const session = sessions.get(sessionId);
  if (!session) { send(ws, 'error', { message: 'Session not found' }); return; }

  const { type, params } = message;

  try {
    switch (type) {
      case 'navigate':      send(ws, 'navigate_result',       await handleNavigate(session, params));      break;
      case 'screenshot':    send(ws, 'screenshot_result',     { dataUrl: await handleScreenshot(session, params) }); break;
      case 'click':         send(ws, 'click_result',          await handleClick(session, params));         break;
      case 'type':          send(ws, 'type_result',           await handleType(session, params));          break;
      case 'scroll':        send(ws, 'scroll_result',         await handleScroll(session, params));        break;
      case 'wait_for':      send(ws, 'wait_for_result',       await handleWaitFor(session, params));       break;
      case 'execute':       send(ws, 'execute_result',        await handleExecute(session, params));       break;
      case 'extract':       send(ws, 'extract_result',        await handleExtract(session, params ?? {})); break;
      case 'read_page':     send(ws, 'read_page_result',      await handleReadPage(session, params));      break;
      case 'upload_file':   send(ws, 'upload_file_result',    await handleUploadFile(session, params));    break;
      case 'cookies':       send(ws, 'cookies_result',        await handleCookies(session, params));       break;
      case 'aria_snapshot': send(ws, 'aria_snapshot_result',  await handleAriaSnapshot(session, params ?? {})); break;
      case 'get_tabs':      send(ws, 'get_tabs_result',       await handleGetTabs(session));               break;
      case 'select':        send(ws, 'select_result',         await handleSelect(session, params));        break;
      case 'set_stealth':   send(ws, 'set_stealth_result',    { stealth: params?.enabled ?? false });      break;
      case 'ping':          send(ws, 'pong');                                                               break;
      default:              send(ws, 'error', { message: `Unknown message type: ${type}` });
    }
  } catch (error) {
    send(ws, 'error', { message: error.message });
  }
}

// ─── Browser launch ───────────────────────────────────────────────────────────

/**
 * Launch a browser with anti-detection flags.
 * Tries CDP to system Chrome first; falls back to launching headless Chromium.
 */
async function launchBrowser() {
  // Try CDP connection to system Chrome first (no download required)
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('[Sidecar] Connected to system Chrome via CDP');
    return { browser, viaCDP: true };
  } catch {
    // Chrome not running with CDP endpoint — fall back to headless Chromium
    console.log('[Sidecar] No CDP endpoint found — launching headless Chromium with stealth args');

    const browser = await chromium.launch({
      headless: true,
      args: [
        // Core anti-detection
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        // Disable infobars / automation indicators
        '--disable-infobars',
        '--no-first-run',
        '--no-default-browser-check',
        // GPU/sandbox (common in CI/headless envs)
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        // Memory / perf
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        // Disable crash reporting / metrics that reveal automation
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--no-pings',
        '--safebrowsing-disable-auto-update',
        '--password-store=basic',
        '--use-mock-keychain',
        // Stable window size
        '--window-size=1920,1080',
        '--start-maximized',
      ],
    });
    return { browser, viaCDP: false };
  }
}

// ─── Session management ───────────────────────────────────────────────────────

async function startSession(ws, sessionId) {
  console.log(`[Sidecar] Starting session: ${sessionId}`);

  try {
    const { browser, viaCDP } = await launchBrowser();

    let context;
    if (viaCDP) {
      const contexts = browser.contexts();
      context = contexts.length > 0 ? contexts[0] : await browser.newContext({
        viewport: { width: 1920, height: 1080 },
      });
    } else {
      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        // Realistic UA — Chrome 131 on macOS
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        // Disable permission prompts
        permissions: [],
        // Accept-Language header
        extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
        // Emulate real timezone
        timezoneId: 'America/New_York',
        locale: 'en-US',
        // Colour scheme
        colorScheme: 'light',
      });

      // Inject stealth script into every new page BEFORE any scripts run
      await context.addInitScript(STEALTH_INIT_SCRIPT);
    }

    const page = await context.newPage();

    // Also inject into the first page (addInitScript only runs on future pages in some versions)
    try { await page.addInitScript(STEALTH_INIT_SCRIPT); } catch {}

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
      }
    });

    sessions.set(sessionId, { browser, context, page, ws, viaCDP });
    send(ws, 'session_ready', { sessionId });
    console.log(`[Sidecar] Session ready: ${sessionId}`);
  } catch (error) {
    console.error(`[Sidecar] Error starting session:`, error);
    send(ws, 'error', { message: `Failed to start session: ${error.message}` });
    ws.close();
  }
}

async function stopSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  console.log(`[Sidecar] Stopping session: ${sessionId}`);
  try {
    await session.page.close();
    if (!session.viaCDP) await session.browser.close();
  } catch (error) {
    console.error(`[Sidecar] Error closing session:`, error);
  }

  sessions.delete(sessionId);
  console.log(`[Sidecar] Session stopped: ${sessionId}`);
}

// ─── WebSocket server ─────────────────────────────────────────────────────────

/**
 * Architecture: ONE persistent WebSocket connection per session.
 *
 * The Rust side connects once (on browser_start_session), keeps the socket
 * open, and sends all commands over the same connection for the lifetime of
 * the session. This eliminates the 2–5 s per-command handshake overhead.
 *
 * Session lifecycle:
 *   connect  → startSession (launches browser, sets up page)
 *   messages → handleMessage (stateless command dispatch)
 *   close    → stopSession (cleans up browser)
 */
function createServer() {
  const server = new WebSocketServer({ port: PORT, perMessageDeflate: false });

  server.on('listening', () => {
    console.log(`[Sidecar] WebSocket server listening on port ${PORT}`);
    console.log(`[Sidecar] Playwright ready (persistent-connection mode)`);
  });

  server.on('connection', (ws, req) => {
    const sessionId = req.url?.match(/\/ws\/([^/]+)/)?.[1];
    if (!sessionId) {
      console.error('[Sidecar] Connection rejected: no session ID in path');
      ws.close(1008, 'No session ID provided');
      return;
    }

    // Reject duplicate connections for same session (prevent ghost sessions)
    if (sessions.has(sessionId)) {
      const existing = sessions.get(sessionId);
      console.warn(`[Sidecar] Session ${sessionId} already exists — reusing existing session, updating WS ref`);
      // Update the ws reference so new commands go to the new connection
      existing.ws = ws;
      send(ws, 'session_ready', { sessionId });
    } else {
      console.log(`[Sidecar] New connection for session: ${sessionId}`);
      send(ws, 'connected', { sessionId });
      startSession(ws, sessionId);
    }

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, sessionId, message);
      } catch (error) {
        console.error('[Sidecar] Error parsing message:', error);
        send(ws, 'error', { message: 'Invalid JSON' });
      }
    });

    ws.on('close', () => {
      console.log(`[Sidecar] Client disconnected: ${sessionId}`);
      stopSession(sessionId);
    });

    ws.on('error', (error) => {
      console.error(`[Sidecar] WebSocket error for session ${sessionId}:`, error);
    });

    // Heartbeat to keep NAT/proxy connections alive
    const heartbeat = setInterval(() => {
      if (ws.readyState === ws.OPEN) send(ws, 'heartbeat');
      else clearInterval(heartbeat);
    }, HEARTBEAT_INTERVAL);

    ws.on('close', () => clearInterval(heartbeat));
  });

  server.on('error', (error) => {
    console.error('[Sidecar] Server error:', error);
  });

  return server;
}

// ─── Shutdown ─────────────────────────────────────────────────────────────────

function setupShutdown(server) {
  const shutdown = async () => {
    console.log('[Sidecar] Shutting down...');
    for (const sessionId of sessions.keys()) await stopSession(sessionId);
    server.close(() => {
      console.log('[Sidecar] Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('[Sidecar] Starting Nasus Browser Sidecar...');
  const server = createServer();
  setupShutdown(server);
}

main();
