/// Rule-based task classifier — no LLM call required.
/// Runs on the user's first message to determine routing strategy.

#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
pub enum TaskType {
    WebDev,
    Coding,
    Writing,
    Research,
    DataAnalysis,
    SimpleQA,
    General,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
pub enum TaskComplexity {
    Low,
    Medium,
    High,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
pub enum Capability {
    Reasoning,
    Coding,
    Writing,
    Speed,
    InstructionFollowing,
}

#[derive(Debug, Clone, Serialize)]
pub struct TaskClassification {
    pub task_type: TaskType,
    pub complexity: TaskComplexity,
    pub primary_capability: Capability,
}

use serde::Serialize;

pub fn classify_task(message: &str) -> TaskClassification {
    let msg = message.to_lowercase();

    // ── Web Development ──────────────────────────────────────────────────────
    let web_kw = [
        "landing page",
        "website",
        "web app",
        "dashboard",
        "next.js",
        "nextjs",
        "react",
        "vue",
        "svelte",
        "tailwind",
        "shadcn",
        "html",
        "css",
        "frontend",
        "responsive",
    ];
    if web_kw.iter().any(|k| msg.contains(k)) {
        return TaskClassification {
            task_type: TaskType::WebDev,
            complexity: TaskComplexity::High,
            primary_capability: Capability::Coding,
        };
    }

    // ── General Coding ───────────────────────────────────────────────────────
    let code_kw = [
        "write a script",
        "debug",
        "function",
        "algorithm",
        "python",
        "rust",
        "javascript",
        "typescript",
        " api",
        "fix the bug",
        "refactor",
        "implement",
        "class ",
        "module",
    ];
    if code_kw.iter().any(|k| msg.contains(k)) {
        let complexity =
            if msg.len() > 500 || msg.contains("project") || msg.contains("application") {
                TaskComplexity::High
            } else {
                TaskComplexity::Medium
            };
        return TaskClassification {
            task_type: TaskType::Coding,
            complexity,
            primary_capability: Capability::Coding,
        };
    }

    // ── Writing ──────────────────────────────────────────────────────────────
    let write_kw = [
        "blog post",
        "article",
        "email",
        "report",
        "essay",
        "story",
        "copywriting",
        "brand",
        "strategy",
        "proposal",
        "presentation",
    ];
    if write_kw.iter().any(|k| msg.contains(k)) {
        let complexity = if msg.len() > 300 {
            TaskComplexity::Medium
        } else {
            TaskComplexity::Low
        };
        return TaskClassification {
            task_type: TaskType::Writing,
            complexity,
            primary_capability: Capability::Writing,
        };
    }

    // ── Research ─────────────────────────────────────────────────────────────
    let research_kw = [
        "research",
        "find",
        "search",
        "compare",
        "analyze",
        "what is",
        "how does",
        "explain",
        "summarize",
    ];
    if research_kw.iter().any(|k| msg.contains(k)) {
        return TaskClassification {
            task_type: TaskType::Research,
            complexity: TaskComplexity::Medium,
            primary_capability: Capability::Reasoning,
        };
    }

    // ── Data Analysis ────────────────────────────────────────────────────────
    let data_kw = [
        "csv",
        "spreadsheet",
        " data ",
        "chart",
        "graph",
        "calculate",
        "statistics",
        "excel",
        "json",
        "parse",
    ];
    if data_kw.iter().any(|k| msg.contains(k)) {
        return TaskClassification {
            task_type: TaskType::DataAnalysis,
            complexity: TaskComplexity::Medium,
            primary_capability: Capability::Coding,
        };
    }

    // ── Short = Simple Q&A ───────────────────────────────────────────────────
    if msg.len() < 100 && !msg.contains("build") && !msg.contains("create") {
        return TaskClassification {
            task_type: TaskType::SimpleQA,
            complexity: TaskComplexity::Low,
            primary_capability: Capability::Speed,
        };
    }

    // ── Default ──────────────────────────────────────────────────────────────
    TaskClassification {
        task_type: TaskType::General,
        complexity: TaskComplexity::Medium,
        primary_capability: Capability::Reasoning,
    }
}
