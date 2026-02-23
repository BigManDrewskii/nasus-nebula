# Nasus Desktop App: Component Specifications

**Objective:** This document breaks down the UI into key components for the Orchids agent to build. The agent should implement these components using React, TypeScript, and TailwindCSS, following the `STYLE_GUIDE.md`.

## 1. Main Layout

- **Description:** A two-panel layout.
- **Left Panel (Sidebar):** Contains a list of past and current tasks. The active task is highlighted.
- **Right Panel (Main View):** The primary interaction area, containing the chat/agent interface.
- **Styling:** Use `bg-neutral-900` for the main background and `bg-neutral-800` for the sidebar. A `border-neutral-700` should separate them.

## 2. Task List Item (in Sidebar)

- **Description:** A single item in the task list.
- **States:**
  - **Default:** Shows the task title and a status indicator (e.g., "In Progress", "Completed").
  - **Active:** Has a different background color (`bg-neutral-700`) and a visible accent border on the left (`border-l-2 border-blue-500`).
  - **Hover:** Subtle background color change (`hover:bg-neutral-700`).
- **Props:** `title: string`, `status: string`, `isActive: boolean`

## 3. Chat View (in Main View)

- **Description:** The main chat interface for interacting with the agent.
- **Contains:**
  - A scrollable message history area.
  - A user input area at the bottom.
- **Scrolling:** Should automatically scroll to the latest message.

## 4. Chat Message

- **Description:** A single message bubble in the chat history.
- **Variants:**
  - **User Message:** Aligned to the right. Simple text.
  - **Agent Message:** Aligned to the left. Can contain text, code blocks, and other rich content.
- **Styling:**
  - **Code Blocks:** Use the monospace font (JetBrains Mono) with a slightly darker background (`bg-neutral-800`) and syntax highlighting.
  - **Text:** Use the primary UI font (Inter).
- **Props:** `author: 'user' | 'agent'`, `content: string`

## 5. User Input Area

- **Description:** The text area at the bottom of the Chat View for user input.
- **Contains:**
  - A `textarea` that grows with the user's input.
  - A "Send" button (icon-only, using a paper plane icon from Heroicons).
  - Buttons for attaching files or triggering other special actions.
- **Styling:** The `textarea` should have a `border-neutral-700` and a `focus:ring-blue-400` focus ring. The background should be `bg-neutral-800`.

## 6. Action Chips

- **Description:** Small, pill-shaped buttons that suggest actions to the user (e.g., "Create slides", "Build website").
- **Location:** Displayed above the user input area when the agent is ready for a new command.
- **Styling:** Subtle `border-neutral-700`, `hover:bg-neutral-700`, and an icon from Heroicons.
- **Props:** `label: string`, `icon: React.ReactNode`
