/** Cost estimation helpers — used in ChatView header */

export const RATES_PER_MILLION: Record<string, number> = {
  // Anthropic
  'anthropic/claude-3.5-sonnet': 9,
  'anthropic/claude-3.7-sonnet': 9,
  'anthropic/claude-3-haiku': 1.25,
  'anthropic/claude-3-haiku-20240307': 1.25,
  'anthropic/claude-sonnet-4': 9,
  'anthropic/claude-opus-4': 30,
  // OpenAI
  'openai/gpt-4o': 7.5,
  'openai/gpt-4o-mini': 0.3,
  'openai/gpt-4.1': 8,
  'openai/gpt-4.1-mini': 0.6,
  'openai/o1': 30,
  'openai/o3': 20,
  'openai/o3-mini': 3.5,
  'openai/o4-mini': 3.5,
  // Google
  'google/gemini-2.0-flash-001': 0.2,
  'google/gemini-2.5-pro-exp-03-25': 7,
  'google/gemini-2.5-pro-preview': 7,
  'google/gemini-2.5-flash-preview': 0.5,
  // Meta
  'meta-llama/llama-3.3-70b-instruct': 0.6,
  'meta-llama/llama-4-maverick': 0.9,
  'meta-llama/llama-4-scout': 0.4,
  // DeepSeek
  'deepseek/deepseek-r1': 2,
  'deepseek/deepseek-v3': 0.5,
}

export function estimateCost(modelId: string, tokens: number): string {
  const rate = RATES_PER_MILLION[modelId] ?? 5
  const cost = (tokens / 1_000_000) * rate
  if (cost < 0.0001) return '<$0.001'
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(3)}`
}
