# AGENTS.md

Guidance for agentic coding assistants working in the Nasus repository.

## Project Overview

**Nasus** is a Tauri 2.0 desktop application — an autonomous AI agent built with React 19 and Rust. It uses a multi-agent architecture (Planning, Execution, Verification) with tool-based execution. Desktop-only; no browser/WASM mode.

## Commands

```bash
# Development
npm run tauri:dev          # Tauri dev mode (React frontend + Rust backend)

# Build
npm run build              # TypeScript compile + Vite production build
npm run tauri:build        # Full desktop app build
npm run tauri:build:debug  # Debug build with symbols

# Code Quality
npm run lint               # ESLint
npx tsc -b                 # TypeScript type check (no emit)

# Testing
npm test                   # Run all tests (vitest)
npm test -- --run          # Single run (no watch)
npm test -- src/lib/errors.test.ts           # Run single test file
npm test -- src/lib/errors.test.ts --run     # Single run, single file
npm test -- -t "should create an error"      # Run tests matching name pattern
npm test -- --coverage                       # With coverage
npm run test:ui            # Vitest browser UI
```

## Code Style

### TypeScript

- **Target**: ES2022, **Module**: ESNext, **Strict mode** enabled
- `noUnusedLocals`, `noUnusedParameters` enforced — prefix intentional unused vars/params with `_`
- `verbatimModuleSyntax` — use `import type` for type-only imports
- `erasableSyntaxOnly` — no `enum` declarations; use `as const` objects instead
- `noFallthroughCasesInSwitch` enforced
- JSX runtime: `react-jsx` (no React import needed in components)

### Imports

- Use `import type` for type-only imports:
  ```ts
  import type { AgentConfig } from './Agent'
  import { AgentState } from './AgentState' // value import
  ```
- Prefer named exports over default exports
- Keep imports sorted: external packages first, then internal modules
- Use `.ts`/`.tsx` extensions only when required by the module resolver

### Naming Conventions

- **Files**: PascalCase for components/classes (`BaseAgent.ts`), camelCase for utilities (`logger.ts`)
- **Classes**: PascalCase (`ExecutionAgent`, `ToolRegistry`)
- **Interfaces/Types**: PascalCase, no `I` prefix (`AgentConfig`, not `IAgentConfig`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`DEFAULT_MAX_ITERATIONS`)
- **Functions/variables**: camelCase
- **React components**: PascalCase, in `.tsx` files

### Error Handling

- Custom errors extend `UserFacingError` (`src/lib/errors.ts`)
- Agent errors use the 3-strike escalation pattern: diagnose → different approach → block & escalate
- Never use empty catch blocks — at minimum log the error
- Prefer `Result`-style returns or thrown errors, not silent failures

### React

- Functional components only (no class components)
- Use hooks; follow `react-hooks/rules-of-hooks` (error) and `react-hooks/exhaustive-deps` (warn)
- Tailwind CSS v4 with `@tailwindcss/vite` plugin — utility classes only, no inline styles
- UI font: Inter; Code font: JetBrains Mono

### State Management

- Zustand store (`src/store.ts`) with Immer middleware for immutable updates
- Persist via SQLite through Tauri backend commands

## Testing

- **Framework**: Vitest with jsdom environment
- **Setup**: `src/test/setup.ts` (global test config)
- **Location**: Co-locate tests with source: `errors.ts` → `errors.test.ts`
- **Style**: Use `describe`/`it`/`expect` from vitest (globals enabled)
- **React testing**: `@testing-library/react` available
- Tests run in jsdom; no browser automation tests in this repo

## Architecture

- `src/agent/` — Multi-agent system (Planning, Execution, Verification agents)
- `src/agent/tools/` — Tool registry and tool implementations
- `src/agent/gateway/` — LLM routing and model selection
- `src/agent/workspace/` — Per-task isolated file workspaces
- `src/components/` — React UI components
- `src/store/` — Zustand state stores
- `src/lib/` — Shared utilities, logger, constants
- `src-tauri/src/` — Rust backend (gateway, docker, sidecar, SQLite)

## Lint Rules

- ESLint flat config (`eslint.config.js`)
- TypeScript ESLint recommended + React hooks + React Refresh
- Unused vars/params must be prefixed with `_` to suppress warnings
- Ignored: `dist/`, `public/ort/`, `docker/`, `src-tauri/target/`

## Adding New Code

**New tools**: Extend `BaseTool` in `src/agent/tools/`, implement `execute()` returning `ToolResult`, register in `globalToolRegistry`.

**New agents**: Extend `BaseAgent`, implement `doExecute()`, specify agent type (`planner`|`executor`|`verifier`|`specialist`).

**New components**: Follow existing patterns in `src/components/`. Use Tailwind for styling. PascalCase filenames.

## Rust Backend

- Tauri 2.0 commands in `src-tauri/src/lib.rs`
- Key crates: bollard (Docker), reqwest (HTTP), rusqlite (SQLite), tokio (async)
- Build: `cargo build` in `src-tauri/` or `npm run tauri:build`
