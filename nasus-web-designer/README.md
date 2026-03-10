# Nasus Web Designer

> AI-powered web design sub-agent. Describe a website in plain English, get a complete, production-ready HTML/CSS/JS file back — streamed token by token.

## What it is

Nasus Web Designer is a desktop application (Tauri v2 + React) that turns natural language into full web pages. It ships as a native desktop app and also runs as a Docker-served web app.

Under the hood it calls DeepSeek or any OpenRouter model via streaming SSE, sends a carefully tuned system prompt, and renders the output live in a sandboxed iframe as tokens arrive.

---

## Architecture

```
nasus-web-designer/
│
├── src/                          # React + TypeScript frontend
│   ├── App.tsx                   # Root layout (toolbar + chat + preview)
│   ├── main.tsx                  # React entry point
│   ├── types/index.ts            # All shared types
│   ├── store/appStore.ts         # Zustand state (sessions, settings, streaming)
│   ├── hooks/
│   │   ├── useAIStream.ts        # Tauri event listener for token streaming
│   │   └── useDesignSession.ts   # Invoke wrapper (generate, refine, cancel)
│   ├── components/
│   │   ├── ChatPanel.tsx         # Left panel: chat UI, message bubbles, input
│   │   ├── PreviewPane.tsx       # Right panel: iframe + code tabs
│   │   ├── CodeViewer.tsx        # Syntax-highlighted code display
│   │   ├── SettingsModal.tsx     # API key + model configuration
│   │   └── Toolbar.tsx           # Header + model selector + session sidebar
│   └── styles/
│       ├── global.css            # CSS reset, tokens, utilities, animations
│       └── components.css        # All component styles
│
├── src-tauri/                    # Rust + Tauri v2 backend
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs               # App entry, AppState, plugin + command registration
│       ├── commands/
│       │   ├── design.rs         # generate_design, refine_design, cancel_generation
│       │   ├── ai.rs             # get_models, update_settings, get_settings
│       │   └── export.rs         # export_project (creates zip in Downloads)
│       ├── ai/
│       │   ├── deepseek.rs       # DeepSeek streaming client
│       │   ├── openrouter.rs     # OpenRouter streaming client
│       │   └── prompts.rs        # System prompt constants
│       └── utils/
│           └── zip.rs            # Zip archive utility
│
├── docker/
│   ├── Dockerfile                # Multi-stage: node build → nginx serve
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Quick Start (Desktop App)

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 18+
- [Tauri v2 prerequisites](https://tauri.app/start/prerequisites/)

### 1. Clone and install

```bash
cd nasus-web-designer
npm install
```

### 2. Configure API keys

```bash
cp .env.example .env
# Edit .env with your keys
```

Or configure them at runtime via the Settings modal (Ctrl/Cmd+,).

### 3. Run in development

```bash
npm run tauri dev
```

### 4. Build for production

```bash
npm run tauri build
```

Installers land in `src-tauri/target/release/bundle/`.

---

## Docker (Web Mode)

In Docker, the app runs as a pure frontend — API calls go directly from the browser to DeepSeek/OpenRouter. No Rust backend required.

```bash
cd docker

# Set your keys
export DEEPSEEK_API_KEY=sk-...
export OPENROUTER_API_KEY=sk-or-...

# Build and run
docker-compose up --build
```

Open `http://localhost:3000`.

> Note: In web mode, you configure API keys in the Settings modal. They are stored in localStorage. The Rust backend commands are replaced by direct browser fetch calls in web mode.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | No* | — | DeepSeek platform API key |
| `OPENROUTER_API_KEY` | No* | — | OpenRouter API key |
| `DEFAULT_MODEL` | No | `deepseek-chat` | Model used for new sessions |
| `MAX_TOKENS` | No | `8192` | Max tokens per completion |

*At least one API key is required to generate designs.

---

## AI Capabilities

| Feature | Description |
|---|---|
| **Generate** | Create a full web page from a natural language prompt |
| **Refine** | Modify existing output with a follow-up instruction |
| **Stream** | Tokens stream in real-time to the preview iframe |
| **Multi-model** | Switch between DeepSeek, Claude, GPT-4o, Llama, Gemini |
| **Export** | Download the project as a `.zip` (HTML + CSS + JS + README) |
| **Sessions** | Multiple independent design sessions with full history |

### Supported Models

**DeepSeek** (via api.deepseek.com)
- `deepseek-chat` — V3, fast and cheap, great for most designs
- `deepseek-reasoner` — R1, slower but stronger for complex layouts
- `deepseek-coder` — Optimized for code generation

**OpenRouter** (300+ models via openrouter.ai)
- `anthropic/claude-3.5-sonnet` — Excellent HTML/CSS quality
- `openai/gpt-4o` — Strong all-rounder
- `openai/gpt-4o-mini` — Fast and affordable
- `meta-llama/llama-3.1-70b-instruct` — Open source, large context
- `google/gemini-pro-1.5` — 1M context window

---

## Nasus Integration Guide

Nasus Web Designer is designed as a sub-agent module that plugs into the Nasus AI platform.

### How it connects

1. **Settings** — Pass API keys via `.env` or the runtime settings modal. Keys are stored in the Tauri AppState and never logged.

2. **Tauri commands** — The frontend calls these backend commands via `invoke()`:
   - `generate_design(prompt, model, stream)` → streams tokens + returns full HTML
   - `refine_design(originalCode, instruction, model)` → patches existing design
   - `cancel_generation()` → sets atomic cancel flag
   - `get_models()` → returns available model list based on configured keys
   - `update_settings(deepseekKey?, openrouterKey?, defaultModel?, maxTokens?)` → runtime key update
   - `get_settings()` → returns masked key status + current config
   - `export_project(html, css, js, projectName)` → writes `.zip` to Downloads folder

3. **Event bus** — The Rust backend emits `ai-token` events via `window.emit()`. The frontend hook `useAIStream` listens with `@tauri-apps/api/event listen()` and streams tokens into the Zustand store.

4. **Extending** — Add new AI providers by following the pattern in `src-tauri/src/ai/deepseek.rs`. Implement `stream_completion(api_key, model, messages, max_tokens, on_token)` and register the model in `commands/ai.rs`.

### Session persistence

Sessions (chat history + generated code) are persisted to localStorage via Zustand `persist` middleware. They survive app restarts.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | Send message |
| `Shift+Enter` | New line in input |
| `Ctrl+,` / `Cmd+,` | Open Settings |
| `Escape` | Close modal |

---

## License

MIT — build whatever you want with it.

---

*Built with Tauri v2, React 18, Zustand, Vite, and a lot of Rust.*
