import type { ToolDefinition } from './llm'

/**
 * Tool schema definitions for the web agent loop.
 * Extracted here to keep loop.ts focused on control flow only.
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'bash',
      description:
        'Run a simple shell command. ONLY these commands work: cat, ls, echo, mkdir, cp, mv, rm, pwd. THESE ALWAYS FAIL AND MUST NEVER BE USED: npm, node, npx, pip, python, python3, curl, wget, git, apt, apt-get, brew, yarn, pnpm, bun. For web/code tasks, use write_file instead of npm/npx. For network, use http_fetch. For Python, use python_execute.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Simple shell command (cat/ls/echo/mkdir only — NO npm/node/npx/pip/python/curl).' },
          timeout_secs: { type: 'integer', description: 'Max seconds (default 30).', default: 30 },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description:
        'Read the contents of a file from the workspace. Use to check task_plan.md, findings.md, progress.md.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description:
        'Write content to a file in the workspace. Use to update task_plan.md, findings.md, progress.md, or create output artifacts.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
          content: { type: 'string', description: 'Full file content to write.' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files and directories in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path (default: /workspace).', default: '/workspace' },
          recursive: { type: 'boolean', description: 'List recursively (default false).', default: false },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'http_fetch',
      description:
        'Make an HTTP GET or POST request to a URL. Note: cross-origin requests may be blocked by CORS in browser mode. JSON APIs with CORS headers work best.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          method: { type: 'string', enum: ['GET', 'POST'], default: 'GET' },
          body: { type: 'string', description: 'Request body for POST' },
          headers: { type: 'object', description: 'Headers map' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'patch_file',
      description:
        'Replace an exact string in a workspace file. Safer than write_file for small edits like checking off a phase checkbox in task_plan.md. Fails if old_str is not found — read the file first.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
          old_str: { type: 'string', description: 'Exact string to find (must be unique in the file).' },
          new_str: { type: 'string', description: 'Replacement string.' },
        },
        required: ['path', 'old_str', 'new_str'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description:
        'Search the web for current information. Use this tool when you need: real-time data, recent events, facts you are unsure about, current prices/stats, or anything that may have changed after your training cutoff. Do NOT use for general knowledge you are already confident about, coding syntax, math, or creative writing. Do NOT search again if results are already in context for the same topic.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'A concise, specific search query written like you would type into Google — use keywords, not full sentences. GOOD: "React 19 release date 2025", "SearXNG JSON API format". BAD: "Can you please find information about when React 19 was released?" (too verbose). The agent should generate the query, never pass the user\'s raw message directly.',
          },
          num_results: {
            type: 'integer',
            description: 'Number of results to return. Use 3 for simple factual lookups, 5 (default) for general research, 10 for comprehensive research.',
            default: 5,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'python_execute',
      description:
        'Execute Python code in a sandbox. When a cloud sandbox (E2B or Daytona) is configured this runs in a full Linux environment with all packages available — use pip install via bash_execute first if needed. Otherwise falls back to Pyodide (WebAssembly) in the browser. Use for data analysis, math, parsing, text processing, charts (matplotlib), and computation. stdout/stderr are captured and returned.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Python source code to execute. Use print() to produce output.',
          },
        },
        required: ['code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bash_execute',
      description:
        'Execute a shell command in a cloud sandbox (E2B or Daytona). Requires an E2B or Daytona API key in Settings → Code Execution. Use for: installing packages (pip install, apt-get), running CLI tools, file operations, compiling code, running scripts. Not available in Pyodide-only mode.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Shell command to run (bash). Examples: "pip install pandas", "python script.py", "ls /workspace".',
          },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_navigate',
      description:
        'Navigate the user\'s real browser to a URL. Requires the Nasus Browser Bridge extension. Use to open websites, web apps, or any URL in the user\'s actual browser session (with their real cookies/logins). Returns the page title and final URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full URL to navigate to (include https://).' },
          new_tab: { type: 'boolean', description: 'Open in a new tab (default false).', default: false },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_click',
      description:
        'Click an element in the user\'s browser tab. Use a CSS selector (preferred) or x,y pixel coordinates. Returns success info or an error if the element was not found.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector of the element to click (e.g. "button.submit", "#login-btn").' },
          x: { type: 'number', description: 'X pixel coordinate (use if no selector).' },
          y: { type: 'number', description: 'Y pixel coordinate (use if no selector).' },
          tab_id: { type: 'number', description: 'Target tab ID (omit to use the current Nasus-controlled tab).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_type',
      description:
        'Type text into the focused element or a specific input in the user\'s browser. Use browser_click to focus an input first, then browser_type to enter text.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to type.' },
          selector: { type: 'string', description: 'CSS selector of input to focus before typing.' },
          clear_first: { type: 'boolean', description: 'Clear the field before typing (default false).' },
          tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_extract',
      description:
        'Extract the readable text content of the current browser page (or a specific element) as Markdown. Use this to read page content, scrape data, or verify the state of a page after navigation or interaction.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector to extract from (default: full page body).' },
          tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_screenshot',
      description:
        'Take a screenshot of the current browser tab and return it as a base64 image. Use to visually verify a page state, capture a result, or inspect a UI element.',
      parameters: {
        type: 'object',
        properties: {
          full_page: { type: 'boolean', description: 'Capture the full scrollable page (default false = viewport only).' },
          tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_scroll',
      description: 'Scroll the current browser tab up or down.',
      parameters: {
        type: 'object',
        properties: {
          direction: { type: 'string', enum: ['up', 'down'], description: 'Scroll direction.' },
          amount: { type: 'number', description: 'Pixels to scroll (default 400).' },
          tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
        },
        required: ['direction'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_get_tabs',
      description:
        'List all open browser tabs with their IDs, titles, and URLs. Use this to find a specific tab to target, or to understand what the user currently has open.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_wait_for',
      description:
        'Wait until a CSS selector appears in the DOM or the current URL matches a pattern. Essential after navigation on SPAs (React, Vue, Angular) where page content loads asynchronously after the URL changes. Use before browser_extract or browser_click on dynamically rendered content.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector to wait for (e.g. "main.content", "#results").' },
          url_pattern: { type: 'string', description: 'Substring to match against the current tab URL (e.g. "/dashboard", "search?q=").' },
          timeout_ms: { type: 'number', description: 'How long to wait in milliseconds (default 10000).', default: 10000 },
          tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_eval',
      description:
        'Evaluate a JavaScript expression in the current page and return its value. Use to read page state that browser_extract cannot capture: form field values, JavaScript variables, computed styles, element counts, localStorage values, etc. Keep expressions simple and side-effect-free when possible.',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'JavaScript expression to evaluate. Examples: "document.querySelector(\'input#email\').value", "window.__APP_STATE__.user.name", "document.querySelectorAll(\'.item\').length".',
          },
          await_promise: { type: 'boolean', description: 'If the expression returns a Promise, await it before returning (default false).', default: false },
          tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_select',
      description:
        'Select an option in a <select> dropdown by value or visible label text. More reliable than browser_click for dropdowns.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector of the <select> element.' },
          value: { type: 'string', description: 'The option value attribute to select.' },
          label: { type: 'string', description: 'The visible option text to select (use if value is unknown).' },
          tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
        },
        required: ['selector'],
      },
    },
  },
]
