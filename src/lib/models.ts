/**
 * Canonical model list shared by UserInputArea, Sidebar footer, and SettingsPanel.
 * This is the curated fallback list used when no live OpenRouter models have been fetched.
 */

export interface ModelEntry {
  value: string
  label: string
  group: string
}

export const STATIC_MODELS: ModelEntry[] = [
  // Anthropic
  { value: 'anthropic/claude-3.7-sonnet',           label: 'Claude 3.7 Sonnet',            group: 'Anthropic' },
  { value: 'anthropic/claude-3.7-sonnet:thinking',  label: 'Claude 3.7 Sonnet (Thinking)', group: 'Anthropic' },
  { value: 'anthropic/claude-3.5-sonnet',           label: 'Claude 3.5 Sonnet',            group: 'Anthropic' },
  { value: 'anthropic/claude-3.5-haiku',            label: 'Claude 3.5 Haiku',             group: 'Anthropic' },
  { value: 'anthropic/claude-3-haiku',              label: 'Claude 3 Haiku',               group: 'Anthropic' },
  // OpenAI
  { value: 'openai/gpt-4.1',                        label: 'GPT-4.1',                      group: 'OpenAI' },
  { value: 'openai/gpt-4.1-mini',                   label: 'GPT-4.1 Mini',                 group: 'OpenAI' },
  { value: 'openai/gpt-4.1-nano',                   label: 'GPT-4.1 Nano',                 group: 'OpenAI' },
  { value: 'openai/gpt-4o',                         label: 'GPT-4o',                       group: 'OpenAI' },
  { value: 'openai/gpt-4o-mini',                    label: 'GPT-4o Mini',                  group: 'OpenAI' },
  { value: 'openai/o3',                             label: 'o3',                           group: 'OpenAI' },
  { value: 'openai/o3-mini',                        label: 'o3-mini',                      group: 'OpenAI' },
  { value: 'openai/o4-mini',                        label: 'o4-mini',                      group: 'OpenAI' },
  // Google
  { value: 'google/gemini-2.5-pro-preview',         label: 'Gemini 2.5 Pro',               group: 'Google' },
  { value: 'google/gemini-2.0-flash-001',           label: 'Gemini 2.0 Flash',             group: 'Google' },
  { value: 'google/gemini-2.0-flash-thinking-exp',  label: 'Gemini 2.0 Flash Thinking',    group: 'Google' },
  { value: 'google/gemini-flash-1.5',               label: 'Gemini 1.5 Flash',             group: 'Google' },
  // Meta
  { value: 'meta-llama/llama-3.3-70b-instruct',     label: 'Llama 3.3 70B',               group: 'Meta' },
  { value: 'meta-llama/llama-3.1-405b-instruct',    label: 'Llama 3.1 405B',              group: 'Meta' },
  // DeepSeek
  { value: 'deepseek/deepseek-r1',                  label: 'DeepSeek R1',                  group: 'DeepSeek' },
  { value: 'deepseek/deepseek-r1-zero',             label: 'DeepSeek R1 Zero',             group: 'DeepSeek' },
  { value: 'deepseek/deepseek-chat',                label: 'DeepSeek V3',                  group: 'DeepSeek' },
  // Mistral
  { value: 'mistralai/mistral-large',               label: 'Mistral Large',                group: 'Mistral' },
  { value: 'mistralai/codestral-2501',              label: 'Codestral 2501',               group: 'Mistral' },
  // xAI
  { value: 'x-ai/grok-3',                          label: 'Grok 3',                       group: 'xAI' },
  { value: 'x-ai/grok-3-mini',                     label: 'Grok 3 Mini',                  group: 'xAI' },
  { value: 'x-ai/grok-2-1212',                     label: 'Grok 2',                       group: 'xAI' },
  // Qwen
  { value: 'qwen/qwen-2.5-72b-instruct',           label: 'Qwen 2.5 72B',                 group: 'Qwen' },
  { value: 'qwen/qwq-32b',                          label: 'QwQ 32B',                      group: 'Qwen' },
]

/** Per-family accent color metadata */
export const FAMILY_META: Record<string, { label: string; color: string }> = {
  anthropic:    { label: 'Anthropic',  color: '#d4a574' },
  openai:       { label: 'OpenAI',     color: '#74b9a0' },
  google:       { label: 'Google',     color: '#7ab4f5' },
  'meta-llama': { label: 'Meta',       color: '#6b9ef5' },
  deepseek:     { label: 'DeepSeek',   color: '#7c9ff7' },
  mistralai:    { label: 'Mistral',    color: '#b08ee0' },
  'x-ai':       { label: 'xAI',        color: '#a0b8a0' },
  qwen:         { label: 'Qwen',       color: '#f5a97f' },
  cohere:       { label: 'Cohere',     color: '#e0a0b0' },
  ollama:       { label: 'Ollama',     color: '#a0b080' },
}

export function familyMeta(modelId: string): { label: string; color: string } {
  const prefix = modelId.split('/')[0] ?? ''
  return FAMILY_META[prefix] ?? { label: prefix || 'Model', color: 'var(--tx-muted)' }
}

export function familyLabel(modelId: string): string {
  return familyMeta(modelId).label
}

export function shortModelLabel(id: string): string {
  const slash = id.indexOf('/')
  return slash >= 0 ? id.slice(slash + 1) : id
}
