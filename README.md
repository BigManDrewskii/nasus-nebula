# Nasus: Orchids Build Handoff Package

This package contains everything needed to build the **Nasus Desktop Application** using Orchids.app. Read the files in the order listed below.
do prop
## Package Contents

| File | Purpose |
| :--- | :--- |
| `README.md` | This file. Start here. |
| `NASUS_PRD.md` | The full Product Requirements Document. Defines the product vision, features, technical architecture, AI gateway strategy, sandbox environment, Docker deployment, and the Tauri 2.0 desktop stack. |
| `ARCHITECTURE_BRIEF.md` | A concise technical blueprint of how the Tauri frontend, Rust backend, and Docker environment interact. Read this to understand the system before writing code. |
| `STYLE_GUIDE.md` | The visual design system. Defines the color palette, typography, spacing, and iconography. All components must follow this guide. |
| `COMPONENT_SPECS.md` | Detailed specifications for each UI component to be built (layout, sidebar, chat view, messages, input area, action chips). |

## Build Order

1. **Scaffold** the Tauri 2.0 project with React + TypeScript + TailwindCSS.
2. **Implement the layout** (sidebar + main view) per `COMPONENT_SPECS.md`.
3. **Build the chat interface** (message list, input area, action chips).
4. **Wire up the Rust backend** to manage Docker via the Bollard crate.
5. **Connect the AI Gateway** (LiteLLM or OpenRouter) for LLM completions.
6. **Test the full flow:** User sends message -> Rust backend -> AI Gateway -> Response streamed to UI.

## Key Constraints

- **Framework:** Tauri 2.0 (not Electron).
- **No OpenAI dependency:** Use OpenRouter or self-hosted LiteLLM as the AI gateway.
- **Dark theme only:** Follow the `STYLE_GUIDE.md` palette. No light mode.
- **Docker-first:** The agent sandbox runs inside Docker containers managed by the Rust backend.
