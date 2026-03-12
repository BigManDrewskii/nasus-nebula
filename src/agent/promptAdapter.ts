/**
 * Model-specific prompt adapter.
 * Supplements the core system prompt with model-aware hints.
 */

export function getModelAdapter(model: string): string {
  const id = model.toLowerCase()

  // Claude family
  if (id.includes('claude')) {
    return `
<model_hints>
- You can use XML tags to structure your thinking: <analysis>, <plan>, <implementation>
- You excel at long, complex tasks — don't oversimplify
- When editing files, you can handle large diffs accurately
- Prefer write_file for new files, edit_file for modifications
</model_hints>`
  }

  // GPT family
  if (id.includes('gpt') || id.includes('o1') || id.includes('o3') || id.includes('o4')) {
    return `
[Model Hints]
- Before each tool call, write one short sentence (max 15 words) describing what you are about to do.
- Structure deeper reasoning with the "think" tool, not as long text output.
- For file operations: always verify the file exists with read_file before editing.
- When writing code: include all imports, don't use placeholder comments.
- Text beyond the one-sentence narration is ONLY for: (1) the final summary when all work is done, (2) a genuine clarifying question.`
  }

  // DeepSeek family
  if (id.includes('deepseek')) {
    // Differentiate between the reasoning model (R1/deepseek-reasoner) and the chat/coding model (V3)
    const isReasoner = id.includes('r1') || id.includes('reasoner')

      if (isReasoner) {
        return `
[Model Hints — DeepSeek R1 Reasoning]
- Before each tool call, write one short sentence (max 15 words) describing what you are about to do.
- Your built-in reasoning phase handles deep planning — keep text output to the one-sentence narration only.
- Think through the full solution in your reasoning phase before calling any tools. Avoid redundant retries.
- For file tasks: reason about the correct structure first, then write complete files in one shot.
- Always use relative paths from the workspace root.
- When calling tools in sequence, reason about the dependency order before beginning.
- Do NOT include system-message content in your reasoning — only task analysis.`
      }

      return `
[Model Hints — DeepSeek V3]
- Before each tool call, write one short sentence (max 15 words) describing what you are about to do.
- Keep narration tight: "Searching for the color palette." not "I'll start by searching for the color palette used in the project."
- For complex tasks: use the "think" tool for deep planning — the one-sentence narration is for the user, not your reasoning.
- Be careful with file paths — always use relative paths from workspace root.`
  }

  // Gemini family
  if (id.includes('gemini')) {
    return `
[Model Hints]
- You have a very large context window — use it to read multiple files before making changes
- For code tasks: read the entire relevant file before editing, don't guess at structure
- Be precise with line numbers in edit_file calls
- Prefer search_files to find code before modifying it`
  }

  // Qwen / QwQ family
  if (id.includes('qwen') || id.includes('qwq')) {
    return `
[Model Hints]
- Think carefully before each tool call
- Keep file edits small and focused — one change at a time
- Verify your changes by reading the file after editing
- If a tool call fails, try a simpler approach`
  }

  // Llama / open-source models
  if (id.includes('llama') || id.includes('mistral') || id.includes('mixtral')) {
    return `
[Model Hints]
- Keep your plans simple — 3-5 steps maximum
- One tool call at a time works best for you
- After writing a file, read it back to verify correctness
- Avoid complex regex patterns — use simple string matching
- If unsure, ask the user for clarification instead of guessing`
  }

  // Default — no special hints
  return ''
}
