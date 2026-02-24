/**
 * Nasus Browser Bridge - Background Service Worker
 * Receives commands from the Nasus web app via chrome.runtime.sendMessage
 * and executes them against real browser tabs via the Chrome Debugger API (CDP).
 */

const NASUS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
];

// Track which tabs we have the debugger attached to
const attachedTabs = new Set();

// ─── CDP helpers ────────────────────────────────────────────────────────────

async function ensureAttached(tabId) {
  if (!attachedTabs.has(tabId)) {
    await chrome.debugger.attach({ tabId }, "1.3");
    attachedTabs.add(tabId);
    chrome.debugger.onDetach.addListener((src) => {
      if (src.tabId === tabId) attachedTabs.delete(tabId);
    });
  }
}

async function cdp(tabId, method, params = {}) {
  await ensureAttached(tabId);
  return chrome.debugger.sendCommand({ tabId }, method, params);
}

// ─── Get or create a Nasus-controlled tab ───────────────────────────────────

async function getNasusTab() {
  // Look for an existing tab we already control
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find(
    (t) => t.title?.startsWith("[Nasus]") || t.url?.includes("__nasus__=1")
  );
  if (existing) return existing.id;

  // Create a new tab
  const tab = await chrome.tabs.create({ url: "about:blank", active: true });
  return tab.id;
}

// ─── Wait for page load ──────────────────────────────────────────────────────

function waitForLoad(tabId, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(); // resolve anyway — page may still be useful
    }, timeoutMs);

    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// ─── Tool implementations ────────────────────────────────────────────────────

async function browserNavigate({ url, newTab }) {
  let tabId;
  if (newTab) {
    const tab = await chrome.tabs.create({ url, active: true });
    tabId = tab.id;
  } else {
    tabId = await getNasusTab();
    await chrome.tabs.update(tabId, { url, active: true });
  }
  await waitForLoad(tabId);
  const tab = await chrome.tabs.get(tabId);
  return { success: true, tabId, url: tab.url, title: tab.title };
}

async function browserClick({ tabId, selector, x, y }) {
  if (!tabId) tabId = await getNasusTab();

  if (selector) {
    // Use Runtime.evaluate to click by selector
    const result = await cdp(tabId, "Runtime.evaluate", {
      expression: `
        (function() {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return { error: 'Element not found: ' + ${JSON.stringify(selector)} };
          el.scrollIntoView({ block: 'center' });
          el.click();
          return { success: true, tag: el.tagName, text: el.innerText?.slice(0, 80) };
        })()
      `,
      returnByValue: true,
      awaitPromise: false,
    });
    return result?.result?.value ?? { error: "evaluate failed" };
  }

  if (x !== undefined && y !== undefined) {
    await cdp(tabId, "Input.dispatchMouseEvent", {
      type: "mousePressed", x, y, button: "left", clickCount: 1,
    });
    await cdp(tabId, "Input.dispatchMouseEvent", {
      type: "mouseReleased", x, y, button: "left", clickCount: 1,
    });
    return { success: true, x, y };
  }

  return { error: "Provide selector or x,y coordinates" };
}

async function browserType({ tabId, selector, text, clearFirst }) {
  if (!tabId) tabId = await getNasusTab();

  if (selector) {
    await cdp(tabId, "Runtime.evaluate", {
      expression: `
        (function() {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return;
          el.focus();
          ${clearFirst ? "el.value = '';" : ""}
        })()
      `,
      returnByValue: true,
    });
  }

  // Type char by char via Input.dispatchKeyEvent
  for (const char of text) {
    await cdp(tabId, "Input.dispatchKeyEvent", {
      type: "keyDown", text: char,
    });
    await cdp(tabId, "Input.dispatchKeyEvent", {
      type: "keyUp", text: char,
    });
  }

  return { success: true, typed: text.length + " characters" };
}

async function browserExtract({ tabId, selector }) {
  if (!tabId) tabId = await getNasusTab();

  const result = await cdp(tabId, "Runtime.evaluate", {
    expression: `
      (function() {
        const target = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : "document.body"};
        if (!target) return { error: 'Element not found' };

        // Simple Markdown-ish extraction
        function extractText(node, depth) {
          if (!node) return '';
          if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim();

          const tag = node.tagName?.toLowerCase();
          const children = Array.from(node.childNodes).map(n => extractText(n, depth + 1)).filter(Boolean);
          const inner = children.join(' ');

          if (!inner.trim()) return '';

          if (['script','style','noscript','nav','footer','aside'].includes(tag)) return '';
          if (tag === 'h1') return '# ' + inner;
          if (tag === 'h2') return '## ' + inner;
          if (tag === 'h3') return '### ' + inner;
          if (['h4','h5','h6'].includes(tag)) return '#### ' + inner;
          if (tag === 'a') return inner + ' [' + (node.href || '') + ']';
          if (tag === 'li') return '- ' + inner;
          if (['p','div','section','article','main'].includes(tag)) return inner + '\\n';
          return inner;
        }

        const tab = { url: window.location.href, title: document.title };
        const content = extractText(target, 0).replace(/\\n{3,}/g, '\\n\\n').trim();
        return { ...tab, content, length: content.length };
      })()
    `,
    returnByValue: true,
    awaitPromise: false,
  });

  return result?.result?.value ?? { error: "extract failed" };
}

async function browserScreenshot({ tabId, fullPage }) {
  if (!tabId) tabId = await getNasusTab();
  await ensureAttached(tabId);

  const params = { format: "jpeg", quality: 70 };
  if (fullPage) {
    const metrics = await cdp(tabId, "Page.getLayoutMetrics");
    params.clip = {
      x: 0, y: 0,
      width: metrics.contentSize.width,
      height: Math.min(metrics.contentSize.height, 8000),
      scale: 1,
    };
  }

  const result = await cdp(tabId, "Page.captureScreenshot", params);
  return { success: true, dataUrl: "data:image/jpeg;base64," + result.data };
}

async function browserScroll({ tabId, direction, amount }) {
  if (!tabId) tabId = await getNasusTab();
  const delta = (direction === "up" ? -1 : 1) * (amount || 400);
  await cdp(tabId, "Runtime.evaluate", {
    expression: `window.scrollBy(0, ${delta})`,
  });
  return { success: true, scrolled: delta };
}

async function browserGetTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.map((t) => ({ id: t.id, url: t.url, title: t.title, active: t.active }));
}

// ─── Message router ──────────────────────────────────────────────────────────

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Validate origin
  if (!NASUS_ORIGINS.some((o) => sender.origin?.startsWith(o))) {
    sendResponse({ error: "Unauthorized origin: " + sender.origin });
    return true;
  }

  const { action, params = {} } = message;

  const handlers = {
    browser_navigate: browserNavigate,
    browser_click: browserClick,
    browser_type: browserType,
    browser_extract: browserExtract,
    browser_screenshot: browserScreenshot,
    browser_scroll: browserScroll,
    browser_get_tabs: browserGetTabs,
    ping: async () => ({ pong: true, version: "1.0.0" }),
  };

  const handler = handlers[action];
  if (!handler) {
    sendResponse({ error: "Unknown action: " + action });
    return true;
  }

  handler(params)
    .then((result) => sendResponse({ result }))
    .catch((err) => sendResponse({ error: err?.message ?? String(err) }));

  return true; // keep channel open for async response
});

// Detach debugger when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  if (attachedTabs.has(tabId)) {
    chrome.debugger.detach({ tabId }).catch(() => {});
    attachedTabs.delete(tabId);
  }
});
