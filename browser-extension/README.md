# Nasus Browser Bridge

Chrome extension that allows the Nasus AI agent to control your browser tabs for automation tasks.

## Features

- **Browser Navigation**: Open URLs in existing or new tabs
- **Element Interaction**: Click, type into inputs, select dropdowns
- **Content Extraction**: Extract page content as markdown
- **Screenshots**: Capture viewport or full-page screenshots
- **Page Control**: Scroll, wait for elements, evaluate JavaScript
- **Tab Management**: List and manage browser tabs

## Installation (Development)

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select this `browser-extension/` directory
5. Copy the **Extension ID** (32-character string like `abcdefghijklmnopqrstuvwxyzabcdef`)
6. In Nasus app → **Settings** → **Browser Access**, paste the Extension ID
7. Click **Test** to verify the connection

## Permissions

This extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `debugger` | Chrome DevTools Protocol (CDP) access for browser automation |
| `tabs` | Query and control browser tabs |
| `scripting` | Inject scripts when needed |
| `activeTab` | Interact with the active tab |
| `storage` | Persist state across service worker restarts |
| `<all_urls>` | Access all websites for automation |

## Security

This extension only accepts connections from authorized origins:

- `http://localhost/*`
- `https://localhost/*`
- `http://127.0.0.1/*`
- `https://127.0.0.1/*`
- `https://nasus.app/*`
- `https://*.nasus.app/*`

All incoming messages are validated against schemas before processing.

## Troubleshooting

### Extension not detected by the app

1. Verify **Developer mode** is enabled at `chrome://extensions`
2. Check the Extension ID matches exactly (32 characters)
3. Try reloading the extension
4. Refresh the Nasus app page after installing

### CDP errors (Chrome DevTools Protocol)

- Only one debugger can be attached per tab
- Close other DevTools windows before running automation
- Try reloading the extension if errors persist

### "No search providers configured" error

This is unrelated to the browser extension. Check your Exa API key in Settings → Search.

## Development

### Building for distribution

```bash
# Create distribution ZIP
cd browser-extension
zip -r ../dist/nasus-browser-extension.zip . -x '*.DS_Store'
```

### Testing the extension

1. Load the extension unpacked
2. Click the extension icon to see attached tabs count
3. Use "Test Connection" button to verify app connectivity
4. Check browser console for errors

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Nasus App  │────────▶│   Extension  │────────▶│   Browser   │
│  (Web App)  │  RPC    │ background.js │   CDP    │    Tabs     │
└─────────────┘         └──────────────┘         └─────────────┘
```

The app sends RPC messages via `chrome.runtime.sendMessage`. The extension uses the Chrome Debugger Protocol to control browser tabs.

## Available Actions

| Action | Description |
|--------|-------------|
| `browser_navigate` | Navigate to a URL |
| `browser_click` | Click an element by selector or coordinates |
| `browser_type` | Type text into an input |
| `browser_extract` | Extract page content as markdown |
| `browser_screenshot` | Capture a screenshot |
| `browser_scroll` | Scroll the page |
| `browser_get_tabs` | List all tabs |
| `browser_wait_for` | Wait for selector or URL |
| `browser_eval` | Evaluate JavaScript |
| `browser_select` | Select dropdown option |
| `ping` | Health check |
| `status` | Get extension status |

## License

MIT
