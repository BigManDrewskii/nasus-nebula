## Claude Code Prompt: Implement High-Impact Enhancements for Nasus

Your task is to implement three key enhancements to the Nasus agent codebase. Follow the instructions for each file modification precisely.

### Goal

Refactor three core components of the agent to improve efficiency, reliability, and performance:

1.  **Context Compression:** Replace the LLM-based summarization in `ExecutionAgent.ts` with a zero-cost observation masking strategy.
2.  **Tool Constraints:** Add support for hard tool constraints in `llm.ts` using the `tool_choice` parameter.
3.  **Output Truncation:** Replace the crude character-based truncation in `ExecutionAgent.ts` with a semantic, line-based truncation function.

--- 

### File 1: `src/agent/agents/ExecutionAgent.ts`

**Modification 1: Implement Semantic Output Truncation**

1.  **Add a new private method** to the `ExecutionAgent` class called `truncateOutput`.

    ```typescript
    private truncateOutput(output: string, toolName: string): string {
      const lines = output.split("\n");
      let maxLines = 150; // Default

      if (toolName.startsWith('read_file')) maxLines = 300;
      if (toolName.startsWith('list_files')) maxLines = 100;
      if (toolName.startsWith('search_files')) maxLines = 200;

      if (lines.length <= maxLines) {
        return output;
      }

      const headCount = Math.ceil(maxLines * 0.7);
      const tailCount = Math.floor(maxLines * 0.3);
      const head = lines.slice(0, headCount).join("\n");
      const tail = lines.slice(lines.length - tailCount).join("\n");
      const omitted = lines.length - (headCount + tailCount);

      return `${head}\n\n[... ${omitted} lines omitted for brevity ...]\n\n${tail}`;
    }
    ```

2.  **Find the existing truncation logic** inside the `executeTool` method (around line 794).

3.  **Replace this code block:**

    ```typescript
    // Truncate tool output
    const output = typeof rawOutput === 'string'
      ? rawOutput.length > 15_000
        ? rawOutput.slice(0, 7_500) + '\n\n[…truncated…]\n\n' + rawOutput.slice(-5_000)
        : rawOutput
      : JSON.stringify(rawOutput)
    ```

4.  **With a call to your new method:**

    ```typescript
    // Truncate tool output
    const output = typeof rawOutput === 'string'
      ? this.truncateOutput(rawOutput, fnName)
      : JSON.stringify(rawOutput);
    ```

**Modification 2: Implement Observation Masking**

1.  **Find the `compressContext` method** (around line 906).

2.  **Delete the entire body** of the `compressContext` method.

3.  **Replace it with this new implementation:**

    ```typescript
    private async compressContext(
      messages: LlmMessage[],
      taskId: string,
      messageId: string,
    ): Promise<number> {
      const toolCallBlocks: { assistantIndex: number; toolResultIndices: number[] }[] = [];

      // First, identify all atomic tool call blocks (assistant message + tool results)
      for (let i = 0; i < messages.length; i++) {
        const m = messages[i];
        if (m.role === 'assistant' && m.tool_calls?.length) {
          const block = { assistantIndex: i, toolResultIndices: [] as number[] };
          let j = i + 1;
          while (j < messages.length && messages[j].role === 'tool') {
            block.toolResultIndices.push(j);
            j++;
          }
          if (block.toolResultIndices.length > 0) {
            toolCallBlocks.push(block);
          }
        }
      }

      if (toolCallBlocks.length <= 8) {
        // Not enough history to compress, do nothing
        return 0;
      }

      // Identify blocks to mask: keep the first 3 and last 5
      const toMask = toolCallBlocks.slice(3, -5);
      let maskedCount = 0;

      for (const block of toMask) {
        for (const toolIndex of block.toolResultIndices) {
          const toolMessage = messages[toolIndex];
          if (toolMessage && toolMessage.role === 'tool') {
            // MASK the observation, don't remove it
            toolMessage.content = '[Observation masked for brevity. The tool call was successful.]';
            maskedCount++;
          }
        }
      }

      if (maskedCount > 0) {
        const step: AgentStep = { kind: 'context_compressed', removedCount: maskedCount };
        useAppStore.getState().addStep(taskId, messageId, step);
      }

      return maskedCount;
    }
    ```

--- 

### File 2: `src/agent/llm.ts`

**Modification: Add `tool_choice` to `streamCompletion`**

1.  **Find the `streamCompletion` function signature** (around line 101).

2.  **Add a new parameter** to the `cb` (callbacks) object called `toolChoice`.

    *   Find: `cb: StreamCallbacks & { gatewayId?: string }`
    *   Add: `toolChoice?: { type: 'function'; function: { name: string } } | 'auto' | 'required'` to the `StreamCallbacks` interface definition (around line 43).

3.  **In the `streamText` call** (around line 225), add the `tool_choice` parameter.

    *   Find the line: `tools: Object.keys(sdkTools).length > 0 ? sdkTools : undefined,`
    *   **Add this line directly below it:**

        ```typescript
        tool_choice: cb.toolChoice,
        ```

--- 

### File 3: `src/agent/context/ContextBuilder.ts`

**Modification: Update Tool Masking Logic**

1.  **Find the `formatTools` function** (around line 91).

2.  **Find this block of code** that adds a system message for masked tools (around line 171):

    ```typescript
    if (options.maskInactiveTools) {
      const inactiveTools = processedTools.filter(t => t.inactive)
      if (inactiveTools.length > 0) {
        const inactiveNames = inactiveTools.map(t => t.function.name).join(', ')
        messages.push({
          role: 'system',
          content: `Note: Some tools are temporarily unavailable: ${inactiveNames}. Use the available tools.`,
        })
      }
    }
    ```

3.  **DELETE this entire `if` block.** This "soft" constraint is being replaced by the "hard" constraint in `llm.ts`.

--- 

After applying these changes, the agent will be more efficient and reliable. Verify that the application builds and runs correctly after making the changes.
