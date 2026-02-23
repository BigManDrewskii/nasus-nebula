# Nasus Desktop App: Architecture Brief for Orchids.app

**Objective:** This document provides a concise overview of the Nasus desktop application's architecture. The goal is to give the Orchids agent a clear technical blueprint, focusing on the key components and their interactions.

## Core Technologies

The application is a **Tauri 2.0** desktop app. This is a critical and non-negotiable architectural choice.

- **Frontend:** The UI will be built with **React** and **TypeScript**, styled with **TailwindCSS**.
- **Backend:** The core backend logic is written in **Rust**.

## Architectural Overview

The application operates as a native desktop shell that orchestrates a Docker-based environment where the AI agent's tasks are executed. This provides maximum security and power.

### Key Components & Interaction Flow

1.  **Tauri UI (React Frontend):** This is the user-facing interface. It runs in a system webview and is responsible for displaying the chat interface, task progress, and results. It communicates with the backend exclusively through the Tauri IPC bridge.

2.  **Tauri Core (Rust Backend):** This is the heart of the desktop application. It has three primary responsibilities:
    *   **Orchestrate Docker:** It must be able to start, stop, and manage Docker containers. The recommended approach is to use the **Bollard** Rust crate to interact with the Docker Engine API. This is how it will manage the agent's sandbox.
    *   **Manage Local LLMs:** It needs to manage the lifecycle of local LLM servers like **Ollama**. This can be done by launching the Ollama Docker container as part of a `docker-compose` setup.
    *   **Proxy AI Requests:** It will handle requests from the UI, sending them to the appropriate AI gateway (e.g., a self-hosted LiteLLM instance or a cloud-based one like OpenRouter).

3.  **Docker Environment:** The Rust backend will manage a `docker-compose.yml` file that defines the agent's full runtime environment. This includes:
    *   **The Agent Sandbox Container:** An Ubuntu-based container where the agent's code execution and tool use actually happens.
    *   **The AI Gateway (LiteLLM):** A container running the LiteLLM proxy, which routes LLM requests.
    *   **The Local LLM Server (Ollama):** A container for running local models, for users who want full privacy.

**In summary:** The user interacts with a sleek Tauri/React UI. When they start a task, the Rust backend uses the Docker API to spin up the agent's sandbox container. The agent inside the container then performs its work, making calls to the AI Gateway (also managed by Docker) as needed. The Rust backend monitors this process and streams results back to the UI.
