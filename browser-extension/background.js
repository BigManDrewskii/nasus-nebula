/**
 * Nasus Browser Bridge - Background Service Worker
 * Receives commands from the Nasus web app via chrome.runtime.sendMessage
 * and executes them against real browser tabs via the Chrome Debugger API (CDP).
 */

// Use Set for exact origin matching (more secure than startsWith)
// Note: origins include ports (e.g., http://localhost:5173), so we match base origin
const ALLOWED_ORIGINS = new Set([
  "http://localhost",
  "https://localhost",
  "http://127.0.0.1",
  "https://127.0.0.1",
  "https://nasus.app",
  "https://www.nasus.app",
]);

// Check if origin matches any allowed base (including port variations)
function isOriginAllowed(origin) {
  if (!origin) return false;

  // First try exact match
  if (ALLOWED_ORIGINS.has(origin)) return true;

  // Then try matching base origin (strip port and path)
  try {
    const url = new URL(origin);
    const baseOrigin = `${url.protocol}//${url.hostname}`;
    return ALLOWED_ORIGINS.has(baseOrigin);
  } catch {
    return false;
  }
}

// Track which tabs we have the debugger attached to (also persisted to storage)
const attachedTabs = new Set();

// ─── Storage-backed state persistence ────────────────────────────────────────
// Service workers can be terminated after ~30s of inactivity, losing all in-memory state.
// We use chrome.storage.session to persist attached tabs across restarts.

async function addAttachedTab(tabId) {
  const { attachedTabs: stored = [] } = await chrome.storage.session.get("attachedTabs");
  if (!stored.includes(tabId)) {
    stored.push(tabId);
    await chrome.storage.session.set({ attachedTabs: stored });
  }
  attachedTabs.add(tabId);
}

async function removeAttachedTab(tabId) {
  const { attachedTabs: stored = [] } = await chrome.storage.session.get("attachedTabs");
  const filtered = stored.filter((id) => id !== tabId);
  await chrome.storage.session.set({ attachedTabs: filtered });
  attachedTabs.delete(tabId);
}

// Restore state on service worker startup
chrome.runtime.onStartup.addListener(async () => {
  const { attachedTabs: stored = [] } = await chrome.storage.session.get("attachedTabs");
  for (const tabId of stored) {
    try {
      // Verify tab still exists before trying to attach
      await chrome.tabs.get(tabId);
      await chrome.debugger.attach({ tabId }, "1.3");
      attachedTabs.add(tabId);
    } catch {
      // Tab no longer exists or couldn't attach, clean up
      await removeAttachedTab(tabId);
    }
  }
});

// Also restore on install (for first load or updates)
chrome.runtime.onInstalled.addListener(async () => {
  const { attachedTabs: stored = [] } = await chrome.storage.session.get("attachedTabs");
  for (const tabId of stored) {
    try {
      await chrome.tabs.get(tabId);
      await chrome.debugger.attach({ tabId }, "1.3");
      attachedTabs.add(tabId);
    } catch {
      await removeAttachedTab(tabId);
    }
  }
});

// ─── CDP helpers ─────────────────────────────────────────────────────────────

async function ensureAttached(tabId) {
  if (!attachedTabs.has(tabId)) {
    await chrome.debugger.attach({ tabId }, "1.3");
    await addAttachedTab(tabId);
    // Register detach listener only once per tab
    chrome.debugger.onDetach.addListener(function onDetach(src) {
      if (src.tabId === tabId) {
        removeAttachedTab(tabId);
        chrome.debugger.onDetach.removeListener(onDetach);
      }
    });
  }
}

async function cdp(tabId, method, params = {}) {
  await ensureAttached(tabId);
  try {
    return await chrome.debugger.sendCommand({ tabId }, method, params);
  } catch (err) {
    // Handle "Target closed" errors gracefully
    if (err?.message?.includes("Target closed") || err?.message?.includes("Unable to send message")) {
      await removeAttachedTab(tabId);
    }
    throw err;
  }
}

// ─── Get or create a Nasus-controlled tab ────────────────────────────────────

async function getNasusTab() {
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find(
    (t) => t.title?.startsWith("[Nasus]") || t.url?.includes("__nasus__=1")
  );
  if (existing) return existing.id;

  // Reuse the active tab if it exists rather than always spawning a new one
  const activeTab = tabs.find((t) => t.active);
  if (activeTab) return activeTab.id;

  const tab = await chrome.tabs.create({ url: "about:blank", active: true });
  return tab.id;
}

// ─── Wait for page load ───────────────────────────────────────────────────────
// Fixes the race condition: check if tab is already complete before listening.

function waitForLoad(tabId, timeoutMs = 15000) {
  return new Promise((resolve) => {
    // Check if already loaded
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || tab?.status === "complete") {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(); // Resolve anyway — page may still be usable
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
  });
}

// ─── Tool implementations ─────────────────────────────────────────────────────

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
    const result = await cdp(tabId, "Runtime.evaluate", {
      expression: `
        (function() {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return { error: 'Element not found: ' + ${JSON.stringify(selector)} };
          el.scrollIntoView({ block: 'center' });
          // Use both .click() and a real pointer event for SPA frameworks
          el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
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

  // Focus the element first if a selector is provided
  if (selector) {
    await cdp(tabId, "Runtime.evaluate", {
      expression: `
        (function() {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return { error: 'Element not found' };
          el.focus();
          el.scrollIntoView({ block: 'center' });
          ${clearFirst ? `
          el.select?.();
          document.execCommand('selectAll', false, null);
          ` : ""}
          return { ok: true };
        })()
      `,
      returnByValue: true,
      awaitPromise: false,
    });
  }

  if (clearFirst) {
    // Dispatch select-all + delete to clear the field properly
    await cdp(tabId, "Input.dispatchKeyEvent", { type: "keyDown", key: "a", modifiers: 8 /* Ctrl/Cmd */ });
    await cdp(tabId, "Input.dispatchKeyEvent", { type: "keyUp", key: "a", modifiers: 8 });
    await cdp(tabId, "Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace" });
    await cdp(tabId, "Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace" });
  }

  // Use Input.insertText for reliable typing that triggers React/Vue/Angular input events.
  // Falls back to char-by-char for special keys like Enter.
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 0) {
      await cdp(tabId, "Input.insertText", { text: lines[i] });
    }
    // Send Enter between lines (but not after the last segment)
    if (i < lines.length - 1) {
      await cdp(tabId, "Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      await cdp(tabId, "Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    }
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

        function extractText(node, depth) {
          if (!node) return '';
          if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim();

          const tag = node.tagName?.toLowerCase();
          const children = Array.from(node.childNodes).map(n => extractText(n, depth + 1)).filter(Boolean);
          const inner = children.join(' ');

          if (!inner.trim()) return '';

          if (['script','style','noscript','nav','footer','aside'].includes(tag)) return '';
          if (tag === 'h1') return '\\n# ' + inner + '\\n';
          if (tag === 'h2') return '\\n## ' + inner + '\\n';
          if (tag === 'h3') return '\\n### ' + inner + '\\n';
          if (['h4','h5','h6'].includes(tag)) return '\\n#### ' + inner + '\\n';
          if (tag === 'a') return inner + ' [' + (node.href || '') + ']';
          if (tag === 'li') return '\\n- ' + inner;
          if (['p','div','section','article','main'].includes(tag)) return inner + '\\n';
          return inner;
        }

        const pageInfo = {
          url: window.location.href,
          title: document.title,
          readyState: document.readyState,
        };
        const content = extractText(target, 0).replace(/\\n{3,}/g, '\\n\\n').trim();
        return { ...pageInfo, content, length: content.length };
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

  const params = { format: "jpeg", quality: 75 };
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
    expression: `window.scrollBy({ top: ${delta}, behavior: 'instant' })`,
  });
  return { success: true, scrolled: delta };
}

async function browserGetTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.map((t) => ({ id: t.id, url: t.url, title: t.title, active: t.active }));
}

/** Wait for a selector to appear or a URL pattern to match. */
async function browserWaitFor({ tabId, selector, urlPattern, timeoutMs = 10000 }) {
  if (!tabId) tabId = await getNasusTab();

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (urlPattern) {
      const tab = await chrome.tabs.get(tabId);
      if (tab.url && tab.url.includes(urlPattern)) {
        return { success: true, matched: "url", url: tab.url };
      }
    }

    if (selector) {
      const result = await cdp(tabId, "Runtime.evaluate", {
        expression: `!!document.querySelector(${JSON.stringify(selector)})`,
        returnByValue: true,
        awaitPromise: false,
      });
      if (result?.result?.value === true) {
        return { success: true, matched: "selector", selector };
      }
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return {
    success: false,
    error: `Timed out after ${timeoutMs}ms waiting for ${selector || urlPattern}`,
  };
}

/** Evaluate arbitrary JavaScript in the page and return the result. */
async function browserEval({ tabId, expression, awaitPromise = false }) {
  if (!tabId) tabId = await getNasusTab();

  const result = await cdp(tabId, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise,
  });

  const val = result?.result?.value;
  const exceptionDetails = result?.exceptionDetails;

  if (exceptionDetails) {
    return { error: exceptionDetails.text || "JS evaluation threw an exception" };
  }

  return { success: true, result: val };
}

/** Select an option in a <select> element. */
async function browserSelect({ tabId, selector, value, label }) {
  if (!tabId) tabId = await getNasusTab();

  const matchExpr = value !== undefined
    ? `el.value = ${JSON.stringify(String(value))};`
    : `Array.from(el.options).forEach(o => { if (o.text.trim() === ${JSON.stringify(String(label))}) el.value = o.value; });`;

  const result = await cdp(tabId, "Runtime.evaluate", {
    expression: `
      (function() {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return { error: 'Element not found: ' + ${JSON.stringify(selector)} };
        ${matchExpr}
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true, selectedValue: el.value };
      })()
    `,
    returnByValue: true,
    awaitPromise: false,
  });
  return result?.result?.value ?? { error: "evaluate failed" };
}

// ─── Message validation schema ─────────────────────────────────────────────────
// Prevent malformed requests from reaching the browser automation functions

const SCHEMAS = {
  browser_navigate: {
    required: ["url"],
    validate: ({ url }) => typeof url === "string" && url.length > 0 && URL.canParse(url)
  },
  browser_click: {
    validate: ({ selector, x, y }) =>
      (typeof selector === "string" && selector.length > 0) ||
      (typeof x === "number" && typeof y === "number")
  },
  browser_type: {
    required: ["text"],
    validate: ({ text }) => typeof text === "string"
  },
  browser_extract: {
    validate: ({ selector }) =>
      !selector || typeof selector === "string"
  },
  browser_screenshot: {
    validate: ({ fullPage }) =>
      fullPage === undefined || typeof fullPage === "boolean"
  },
  browser_scroll: {
    required: ["direction"],
    validate: ({ direction, amount }) =>
      ["up", "down"].includes(direction) &&
      (amount === undefined || typeof amount === "number")
  },
  browser_get_tabs: {},
  browser_wait_for: {
    validate: ({ selector, urlPattern, timeoutMs }) =>
      (!selector || typeof selector === "string") &&
      (!urlPattern || typeof urlPattern === "string") &&
      (!timeoutMs || typeof timeoutMs === "number")
  },
  browser_eval: {
    required: ["expression"],
    validate: ({ expression }) => typeof expression === "string"
  },
  browser_select: {
    required: ["selector"],
    validate: ({ selector, value, label }) =>
      typeof selector === "string" &&
      ((value !== undefined) || (label !== undefined))
  },
  ping: {},
  status: {},
};

function validateMessage(action, params) {
  const schema = SCHEMAS[action];
  if (!schema) return { valid: true }; // Unknown actions pass through (will be caught by handler lookup)

  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in params)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }
  }

  if (schema.validate && !schema.validate(params)) {
    return { valid: false, error: `Invalid parameters for ${action}` };
  }

  return { valid: true };
}

// ─── Message router ───────────────────────────────────────────────────────────

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Debug logging
  console.log("[Nasus Extension] Received message:", {
    action: message?.action,
    origin: sender.origin,
    url: sender.url,
    hasId: !!sender.id,
  });

  // Validate origin using the isOriginAllowed function (handles ports correctly)
  if (!sender.origin || !isOriginAllowed(sender.origin)) {
    console.log("[Nasus Extension] Origin rejected:", sender.origin);
    sendResponse({ error: "Unauthorized origin: " + (sender.origin || "null") });
    return false; // Don't keep channel open for unauthorized origins
  }

  const { action, params = {} } = message;
  console.log("[Nasus Extension] Action:", action, "Params:", params);

  // Validate message parameters
  const validation = validateMessage(action, params);
  if (!validation.valid) {
    sendResponse({ error: validation.error });
    return false;
  }

  const handlers = {
    browser_navigate:  browserNavigate,
    browser_click:     browserClick,
    browser_type:      browserType,
    browser_extract:   browserExtract,
    browser_screenshot: browserScreenshot,
    browser_scroll:    browserScroll,
    browser_get_tabs:  browserGetTabs,
    browser_wait_for:  browserWaitFor,
    browser_eval:      browserEval,
    browser_select:    browserSelect,
    ping: async () => ({ pong: true, version: "1.1.0" }),
    status: async () => ({
      status: "healthy",
      version: "1.1.0",
      attachedTabs: Array.from(attachedTabs),
      availableActions: Object.keys({
        browser_navigate:  browserNavigate,
        browser_click:     browserClick,
        browser_type:      browserType,
        browser_extract:   browserExtract,
        browser_screenshot: browserScreenshot,
        browser_scroll:    browserScroll,
        browser_get_tabs:  browserGetTabs,
        browser_wait_for:  browserWaitFor,
        browser_eval:      browserEval,
        browser_select:    browserSelect,
      }),
    }),
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
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (attachedTabs.has(tabId)) {
    chrome.debugger.detach({ tabId }).catch(() => {});
    await removeAttachedTab(tabId);
  }
});
