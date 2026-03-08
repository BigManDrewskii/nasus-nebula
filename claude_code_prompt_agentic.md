Based on the agentic capabilities analysis, here is a Claude Code prompt to implement the three highest-value, moderate-effort recommendations.

### Step 1: Enable Phase-Aware Tool Masking

The goal is to activate the existing but disabled tool masking infrastructure. This involves defining which tools are active during which phase of a plan.

**1.1. Define Phase-to-Tool Mapping:**
In `src/agent/agents/ExecutionAgent.ts`, create a new function to map a plan phase to a list of active tools.

```typescript
// Add this function inside the ExecutionAgent class
private getActiveToolsForPhase(phaseTitle: string): string[] {
  const lowerTitle = phaseTitle.toLowerCase();
  if (lowerTitle.includes("research") || lowerTitle.includes("gather")) {
    return ["search_web", "http_fetch", "browser_navigate", "browser_extract"];
  }
  if (lowerTitle.includes("plan") || lowerTitle.includes("structure")) {
    return ["write_file", "edit_file", "update_plan", "think"];
  }
  if (lowerTitle.includes("implement") || lowerTitle.includes("write") || lowerTitle.includes("code")) {
    return ["read_file", "write_file", "edit_file", "patch_file", "list_files", "search_files", "bash_execute", "python_execute", "serve_preview"];
  }
  if (lowerTitle.includes("verify") || lowerTitle.includes("test")) {
    return ["read_file", "bash_execute", "list_files"];
  }
  // Default: all tools active
  return []; // An empty array means no masking
}
```

**1.2. Activate Masking in `executeOnce`:**
In `src/agent/agents/ExecutionAgent.ts`, inside the `executeOnce` method, find the `ContextBuilder` instantiation and update it.

*   **Find this line (around line 265):**
    ```typescript
    const contextBuilder = new ContextBuilder({
      maskInactiveTools: false, // masking disabled until tool-phase logic is added
    });
    ```
*   **Replace it with this:**
    ```typescript
    const currentPhase = params.plan?.phases.find(p => p.status === "in_progress");
    const activeTools = currentPhase ? this.getActiveToolsForPhase(currentPhase.title) : [];

    const contextBuilder = new ContextBuilder({
      maskInactiveTools: activeTools.length > 0,
      activeTools: activeTools.length > 0 ? activeTools : undefined,
    });
    ```

### Step 2: Integrate Vision for Browser Automation

The goal is to create a new tool, `browser_analyze_screenshot`, that sends the current page screenshot to a vision-capable model and returns its analysis.

**2.1. Create the New Tool File:**
Create a new file at `src/agent/tools/browser/BrowserAnalyzeScreenshotTool.ts`.

```typescript
import { BaseTool } from "../core/BaseTool";
import { toolSuccess, toolFailure } from "../core/ToolResult";
import type { ToolResult, ToolParameterSchema } from "../core/ToolResult";
import { tauriInvoke } from "../../../tauri";
import { getTauriSessionId } from "../../browserBridge";
import { chatOnceViaGateway } from "../../llm";
import { useAppStore } from "../../../store";

export class BrowserAnalyzeScreenshotTool extends BaseTool {
  readonly name = "browser_analyze_screenshot";
  readonly description = "Analyze the current browser screenshot with a vision model to answer a question about the page content or layout. Use this to find elements when you are unsure of the CSS selector.";
  readonly parameters: ToolParameterSchema = {
    type: "object",
    properties: {
      question: { type: "string", description: "The question to ask the vision model about the screenshot (e.g., \"Where is the login button?\", \"What is the main headline?\")." },
    },
    required: ["question"],
  };

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const question = args.question as string;
    if (!question) {
      return toolFailure("The 'question' parameter is required.");
    }

    try {
      const sessionId = await getTauriSessionId();
      const screenshotResult = await tauriInvoke<{ base64: string }>("browser_screenshot", {
        session_id: sessionId,
        full_page: false,
      });

      if (!screenshotResult?.base64) {
        return toolFailure("Failed to capture screenshot.");
      }

      const { apiKey, model, apiBase, provider } = useAppStore.getState().settings;

      // Ensure we use a vision-capable model
      const visionModel = model.includes("vision") || model.includes("gpt-4o") || model.includes("claude-3") ? model : "gpt-4o";

      const visionResponse = await chatOnceViaGateway({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: question },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${screenshotResult.base64}` },
              },
            ],
          },
        ],
        apiKey,
        model: visionModel,
        apiBase,
        provider,
        temperature: 0.1,
      });

      return toolSuccess(visionResponse.content as string);
    } catch (error) {
      return toolFailure(error instanceof Error ? error.message : String(error));
    }
  }
}
```

**2.2. Register the New Tool:**
In `src/agent/tools/index.ts`, import and register the new tool in the `ToolRegistry`.

```typescript
// Add this import
import { BrowserAnalyzeScreenshotTool } from "./browser/BrowserAnalyzeScreenshotTool";

// ... inside the ToolRegistry constructor ...
this.register(new BrowserAnalyzeScreenshotTool());
```

### Step 3: Adopt Structured Output for Planning

The goal is to modify the `PlanningAgent` to use the `tool_choice` parameter to force the LLM to call a `create_plan` tool, ensuring a valid JSON response.

**3.1. Define the `create_plan` Tool Schema:**
In `src/agent/agents/PlanningAgent.ts`, add a new constant for the tool definition.

```typescript
// Add this at the top of the file
const CREATE_PLAN_TOOL = {
  type: "function" as const,
  function: {
    name: "create_plan",
    description: "Creates a structured execution plan based on the user\'s request.",
    parameters: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Brief 3-6 word title for the plan." },
        description: { type: "string", description: "One sentence overview of the plan." },
        rationale: { type: "string", description: "Why this approach was chosen." },
        complexity: { type: "string", enum: ["low", "medium", "high"] },
        estimatedSteps: { type: "number" },
        phases: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              steps: {
                type: "array" as const,
                items: {
                  type: "object" as const,
                  properties: {
                    id: { type: "string" },
                    description: { type: "string" },
                    agent: { type: "string", enum: ["executor", "research"] },
                    tools: { type: "array" as const, items: { type: "string" } },
                    estimatedDuration: { type: "number" },
                  },
                  required: ["id", "description", "agent", "tools"],
                },
              },
            },
            required: ["id", "title", "description", "steps"],
          },
        },
      },
      required: ["title", "description", "rationale", "complexity", "phases"],
    },
  },
};
```

**3.2. Update `doExecute` to Use `tool_choice`:**
In `src/agent/agents/PlanningAgent.ts`, modify the `doExecute` method to call the LLM with the new tool.

*   **Find this block (around line 70):**
    ```typescript
    const response = await chatOnceViaGateway({ ... });
    const parsed = this.parsePlan(response.content as string);
    const plan = this.validatePlan(parsed, userMessage);
    ```
*   **Replace it with this:**
    ```typescript
    const response = await chatOnceViaGateway({
      messages: [{ role: "user", content: prompt }],
      apiKey,
      model,
      apiBase,
      provider,
      tools: [CREATE_PLAN_TOOL],
      tool_choice: { type: "function", function: { name: "create_plan" } },
    });

    if (!response.tool_calls || response.tool_calls.length === 0) {
      throw new Error("LLM failed to call the create_plan tool.");
    }

    const planArgs = JSON.parse(response.tool_calls[0].function.arguments);
    const plan = this.validatePlan(planArgs, userMessage);
    ```

**3.3. Update `buildPlanningPrompt`:**
In `src/agent/agents/PlanningAgent.ts`, simplify the `buildPlanningPrompt` method to remove the manual JSON format instructions.

*   **Find the long prompt string that starts with `You are a Planning Agent...`**
*   **Replace the entire prompt string with this:**
    ```typescript
    let prompt = `You are a Planning Agent. Your job is to break down the user\'s request into a structured plan by calling the 
    `create_plan` tool.

    User Request: ${userMessage}`;
    // ... (the memory context part can stay the same) ...
    return prompt;
    ```

### Verification Steps

1.  Run `pnpm tsc --noEmit` to ensure there are no TypeScript errors.
2.  Start a new task and observe the console logs. You should see the `ContextBuilder` using `maskInactiveTools: true` and providing a list of active tools.
3.  Try a browser-based task and use the `browser_analyze_screenshot` tool. Verify it calls the vision model and returns a useful description.
4.  Start another new task and check the plan generation. The LLM call should now include the `tools` and `tool_choice` parameters, and the response should be a tool call to `create_plan`.
