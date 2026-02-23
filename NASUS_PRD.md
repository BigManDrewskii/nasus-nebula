# Product Requirements Document: Nasus.im

**Author:** Nasus AI
**Date:** February 23, 2026
**Version:** 2.0

## 1. Introduction

This document outlines the product requirements for Nasus.im, an autonomous general AI agent designed to execute complex digital tasks from start to finish. Nasus represents a paradigm shift from conversational AI assistants, which primarily provide information, to an action-oriented agent that delivers complete work products. The core vision of Nasus is to serve as a virtual colleague, equipped with its own sandboxed cloud computer, capable of independently planning, executing, and delivering results across a wide range of knowledge work.

### 1.1. Product Vision

To create a general-purpose autonomous agent that seamlessly extends human capability, automating complex workflows and transforming ideas into tangible outcomes with minimal supervision. Nasus aims to become the central orchestration layer for the digital workspace, bridging the gap between user intent and task execution across disparate tools and platforms.

### 1.2. Goals

The primary goals for this version of the PRD are to:

*   **Define the Core Product:** Clearly articulate the fundamental capabilities, architecture, and user experience of the Nasus platform.
*   **Establish a Feature Baseline:** Detail the key features that constitute the Nasus offering, from its autonomous agent core to its specific skills like web development and data analysis.
*   **Align on Target Audience:** Identify the primary user personas and their needs to ensure product development is user-centric.
*   **Clarify Competitive Positioning:** Analyze the market landscape to define Nasus's unique value proposition and strategic differentiators.
*   **Provide a Technical Framework:** Outline the high-level technical architecture that enables Nasus's autonomous capabilities, ensuring a scalable and robust foundation for both cloud and desktop deployments.

## 2. User Personas and Target Audience

Nasus is designed for individuals and teams who perform knowledge work and seek to augment their productivity through advanced automation. The platform caters to a spectrum of users, from individual professionals to large enterprise teams.

| Persona                | Description                                                                                                                              | Needs & Goals                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           - **Alex, the Startup Founder:** Alex needs to move quickly and efficiently, handling tasks from market research to building a web presence and creating investor presentations. Alex has limited resources and needs a force multiplier.
- **Chloe, the Marketing Manager:** Chloe is responsible for creating content, analyzing campaign data, and managing social media. She needs to automate repetitive tasks and generate insights from data without deep technical expertise.
- **David, the Developer:** David builds and maintains web applications. He needs a tool that can accelerate his workflow, handle boilerplate code, and integrate with various APIs and services, while giving him full control over the final output.
- **Rachel, the Research Analyst:** Rachel spends her days gathering, synthesizing, and presenting information from numerous sources. She needs a tool to conduct wide-ranging research, analyze data, and create clear, data-driven reports and presentations.

## 3. Product Overview and Core Concepts

(Content from previous version)

## 4. Features

(Content from previous version)

## 5. Technical Architecture (Expanded)

The Nasus platform is built upon a sophisticated, modular architecture designed for robustness, scalability, and extensibility. The architecture is fundamentally model-agnostic, separating the agent framework from the underlying large language models to leverage continuous advancements in the field. This section provides a more detailed overview of the key architectural components.

### 5.1. AI Gateway and Model-Agnosticism

Nasus is designed to be a "boat on the rising tide of model progress." [3] It achieves this by abstracting the model layer through a flexible AI Gateway, which supports a variety of model providers and deployment strategies, explicitly avoiding vendor lock-in with any single provider like OpenAI.

**Key Principles:**

*   **Unified Interface:** All agent interactions with LLMs are routed through a single, OpenAI-compatible API interface. This allows for seamless switching between different models and providers without altering the agent's core logic.
*   **Provider Flexibility:** The gateway is designed to connect to multiple types of model providers simultaneously.
*   **Dynamic Routing & Fallbacks:** The system can dynamically route requests to the best-suited model based on cost, performance, or availability, and includes fallback mechanisms to ensure high reliability.

**Supported Integration Patterns:**

| Gateway/Provider | Type | Description & Use Case |
| :--- | :--- | :--- |
| **OpenRouter** | Managed API Gateway | A third-party service that provides a unified API for over 300 models from dozens of providers (e.g., Anthropic, Google, Meta, Mistral). Ideal for accessing a wide variety of commercial and open-source models without managing individual API keys and endpoints. [15] |
| **LiteLLM** | Self-Hosted Gateway | An open-source proxy server that can be deployed within the Nasus infrastructure. It unifies calls to over 100 LLM APIs and can be configured to route requests to both cloud-based services and locally hosted models. This provides maximum control and privacy. [16] |
| **Ollama** | Local LLM Server | A tool for easily running open-source models (like Llama 4, Qwen 3, or DeepSeek R1) directly on local or dedicated hardware. Ollama provides an OpenAI-compatible API that the LiteLLM gateway can connect to, making it perfect for development, testing, and privacy-sensitive tasks. [17] |
| **vLLM** | High-Performance Local Server | A high-throughput inference engine for serving LLMs in production environments. For scaled deployments requiring support for multiple concurrent users, vLLM offers significantly better performance than Ollama and can be integrated as a provider within the self-hosted LiteLLM gateway. [18] |

### 5.2. Sandbox Environment Specification

The agent's ability to perform meaningful work is enabled by its **Docker-based Sandbox Environment**. This is a significant evolution from the initial VM-based approach, providing greater security, portability, and efficiency.

> Docker Sandboxes lets you run AI coding agents in isolated environments on your machine. Sandboxes provides a secure way to give agents autonomy without compromising your system. [19]

Each task is executed within a dedicated, isolated sandbox, which is instantiated from a pre-defined Docker image. This ensures a clean, reproducible environment for every task, eliminating any risk of cross-contamination.

**Sandbox Characteristics:**

*   **Isolation:** The sandbox uses Docker's containerization technology, potentially enhanced with microVMs (via Docker Sandboxes feature on macOS/Windows), to provide strong isolation from the host system and other running tasks. The agent has no access to the host filesystem, network, or processes outside of its designated workspace.
*   **Base Image:** The sandbox is based on a standard **Ubuntu 22.04** image, pre-loaded with a suite of essential development tools (e.g., Python, Node.js, Git, curl, etc.).
*   **Persistent Workspace:** A specific directory from the host machine (the "project workspace") is mounted as a volume into the sandbox. This allows the agent to have a persistent filesystem to read and write files, ensuring that work is not lost when the sandbox is shut down.
*   **Ephemeral Runtime:** The rest of the container's filesystem is ephemeral. Any installed packages or system modifications that are not written to the persistent workspace volume are lost when the task is complete and the container is destroyed.
*   **Network Control:** Network access for the sandbox is configurable. By default, it has controlled internet access, but policies can be applied to restrict access to specific domains or internal networks for enhanced security.
*   **Resource Limits:** Each sandbox is run with defined CPU and memory limits to prevent any single task from consuming excessive resources and impacting the stability of the host system.

### 5.3. API Integration Framework (MCP)

Nasus extends its capabilities by integrating with external tools and services through the **Model Context Protocol (MCP)**. This framework allows the agent to discover and utilize new tools on the fly.

*   **MCP Connectors:** These are pre-built integrations that expose the API of a third-party service (e.g., Google Drive, Slack, Notion) in a format the agent can understand.
*   **Custom MCP Servers:** Users and developers can create their own MCP servers to connect Nasus to proprietary or internal systems, making the platform infinitely extensible.

### 5.4. Docker-Based Deployment Strategy

To facilitate ease of deployment, scalability, and environment consistency, the entire Nasus platform, including the agent, its gateways, and any local models, is designed to be deployed via Docker and Docker Compose.

**Example `docker-compose.yml` Structure:**

```yaml
services:
  nasus-agent:
    image: nasus/agent:latest
    volumes:
      - ./workspace:/home/ubuntu/workspace
    environment:
      - AI_GATEWAY_URL=http://litellm-proxy:8000
    depends_on:
      - litellm-proxy

  litellm-proxy:
    image: docker.litellm.ai/berriai/litellm:main-latest
    volumes:
      - ./litellm-config.yaml:/app/config.yaml
    ports:
      - "8000:8000"
    command: ["--config", "/app/config.yaml"]
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama
    volumes:
      - ollama-data:/root/.ollama
    # GPU support would be configured here

volumes:
  ollama-data:
```

This approach allows a user to launch the entire stack with a single `docker compose up` command, providing a self-contained, private, and powerful instance of the Nasus agent.

### 5.5. Desktop Application Technology Stack

To deliver a native, high-performance, and secure experience, the Nasus desktop application will be built using the **Tauri 2.0** framework. This choice is a strategic decision to prioritize performance, security, and a small resource footprint, which are critical for an application designed to run alongside resource-intensive AI models and development environments.

**Framework Justification: Tauri vs. Electron**

While Electron is a mature and popular choice for desktop apps, its architecture, which bundles a full Chromium instance, leads to significant memory and disk space overhead. For an AI agent application where users may also be running local LLMs that consume gigabytes of RAM, minimizing the application's own footprint is paramount. Tauri's architecture, which leverages the operating system's native webview and a Rust backend, offers a superior alternative for this use case.

| Metric | Tauri 2.0 | Electron | Justification for Nasus |
| :--- | :--- | :--- | :--- |
| **Idle RAM Usage** | ~30-60 MB | ~150-300 MB | Frees up critical memory for local LLMs and other development tools. |
| **Binary Size** | ~15-20 MB | ~120-150 MB | Enables faster downloads, installations, and updates. |
| **Backend Performance** | Native (Rust) | Node.js (V8) | Rust provides near-bare-metal performance for system operations like managing Docker containers and file I/O, with ~40% lower latency than Node.js under load. [20] |
| **Security** | High | Moderate | Rust's memory safety and Tauri's explicit permission model for system capabilities provide a more secure foundation than a full Node.js runtime. |

**Recommended Technology Stack:**

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Desktop Framework** | **Tauri 2.0** | For its performance, security, small footprint, and cross-platform capabilities (macOS, Windows, Linux). [21] |
| **Backend Logic** | **Rust** | Provides a high-performance, memory-safe backend for all system-level operations, including managing the Docker environment and communicating with the AI gateway. |
| **Frontend UI** | **React + TypeScript** | Leverages a mature, well-supported ecosystem for building a modern, responsive user interface. |
| **Styling** | **TailwindCSS** | For rapid, utility-first UI development that is consistent and maintainable. |
| **Docker Management** | **Bollard (Rust Crate)** | A native Rust client for the Docker Engine API, allowing for robust, programmatic management of the agent's sandbox containers directly from the Rust backend. |
| **Local LLM Orchestration** | **Tauri Sidecar / Shell Plugin** | The Tauri application will manage the lifecycle of local LLM servers like Ollama, either by packaging them as a sidecar or by using the shell plugin to launch and manage their Docker containers. [22] |

### 5.6. Desktop Application Architecture

The Nasus desktop application acts as the central user interface and orchestration layer for the entire agent ecosystem. It is responsible for managing the agent's lifecycle, providing a user interface for task management, and coordinating the various backend components.

**Architectural Diagram Flow:**

1.  **UI (Webview):** The user interacts with the React-based frontend running inside the system's native webview.
2.  **Tauri IPC Bridge:** User actions are sent from the JavaScript frontend to the Rust backend via Tauri's secure Inter-Process Communication (IPC) bridge.
3.  **Rust Backend:** The Rust core logic receives the commands. Based on the user's request, it can:
    *   Use the **Bollard** crate to communicate with the Docker daemon, starting, stopping, or interacting with the agent's sandbox container.
    *   Make HTTP requests to the **AI Gateway** (LiteLLM or OpenRouter) to get completions from the selected LLM.
    *   Use the **Shell Plugin** or manage a **Sidecar** process to control a local Ollama instance.
4.  **Docker Environment:** The Rust backend orchestrates the `docker-compose.yml` stack, which includes the agent's sandbox, the LiteLLM proxy, and the Ollama service.
5.  **Data Flow:** The agent running inside its Docker sandbox communicates with the AI Gateway, which in turn routes requests to the appropriate LLM (cloud or local). The results are passed back through the layers to the UI.

This architecture provides a clean separation of concerns, with the Tauri application serving as a lightweight, high-performance native shell that orchestrates the powerful but isolated Docker-based agent environment.

## 6. Competitive Landscape

(Content from previous version)

## 7. Go-to-Market Strategy

(Content from previous version)

## 8. Future Work

(Content from previous version)

## 9. References (Updated)

[1]: Nasus. "Nasus: Hands On AI." [Online]. Available: https://nasus.im/
[2]: Nasus. "Understanding Nasus sandbox - your cloud computer." [Online]. Available: https://nasus.im/blog/nasus-sandbox
[3]: Yichao 'Peak' Ji. "Context Engineering for AI Agents: Lessons from Building Nasus." [Online]. Available: https://nasus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Nasus
[4]: Nasus. "Nasus Skills - Nasus Documentation." [Online]. Available: https://nasus.im/docs/features/skills
[5]: Nasus. "Projects - Nasus Documentation." [Online]. Available: https://nasus.im/docs/features/projects
[6]: Nasus. "Wide Research: Beyond the Context Window." [Online]. Available: https://nasus.im/blog/nasus-wide-research-solve-context-problem
[7]: Nasus. "Getting started - Nasus Documentation." [Online]. Available: https://nasus.im/docs/website-builder/getting-started
[8]: Nasus. "AI website builder | Build full-stack web apps with..." [Online]. Available: https://nasus.im/features/webapp
[9]: Nasus. "Data Analysis & Visualization - Nasus Documentation." [Online]. Available: https://nasus.im/docs/features/data-visualization
[10]: Nasus. "Nasus Slides - Nasus Documentation." [Online]. Available: https://nasus.im/docs/features/slides
[11]: Nasus. "Integrate Nasus with Your Existing Tools - Nasus Documentation." [Online]. Available: https://nasus.im/docs/integrations/integrations
[12]: Nasus. "Nasus vs. Lovable: Compare AI Agents for Building Modern Web Apps." [Online]. Available: https://nasus.im/compare/lovable
[13]: FutureAGI. "Edition 9 - Inside Nasus AI: Architecture and Benchmarks." [Online]. Available: https://www.linkedin.com/pulse/edition-9-inside-nasus-ai-architecture-benchmarks-futureagi-vd7ee
[14]: Bind AI. "Nasus AI Agent scores >65% in GAIA benchmarks, promises..." [Online]. Available: https://blog.getbind.co/nasus-ai-agent-what-does-it-mean-for-coding/
[15]: OpenRouter. "OpenRouter - One API for Any Model." [Online]. Available: https://openrouter.ai/
[16]: LiteLLM. "LiteLLM AI Gateway (LLM Proxy)." [Online]. Available: https://docs.litellm.ai/docs/simple_proxy
[17]: Ollama. "Ollama." [Online]. Available: https://ollama.com/
[18]: vLLM. "vLLM: Easy, Fast, and Cheap LLM Serving." [Online]. Available: https://vllm.ai/
[19]: Docker. "Docker Sandboxes | Docker Docs." [Online]. Available: https://docs.docker.com/ai/sandboxes/
[20]: Agents UI. "Tauri vs Electron for Developer Tools: Why We Chose Tauri." [Online]. Available: https://agents-ui.com/blog/tauri-vs-electron-for-developer-tools/
[21]: Tauri. "Tauri 2.0." [Online]. Available: https://v2.tauri.app/
[22]: Tauri. "Shell." [Online]. Available: https://v2.tauri.app/plugin/shell/
