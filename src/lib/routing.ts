/**
 * Routing logic for determining if a request is paid or free.
 */

export interface RouterConfig {
  mode: string
  budget: string
}

/**
 * Returns true if the current configuration results in a paid route.
 * 
 * - Ollama is always free.
 * - OpenRouter is free if:
 *   - Auto mode is on and budget is set to 'free'
 *   - Manual mode is on and the selected model has a ':free' suffix
 */
export function isPaidRoute(provider: string, routerConfig?: RouterConfig): boolean {
  if (provider === 'ollama') return false
  if (provider !== 'openrouter') return true
  if (!routerConfig) return true

  const { mode, budget } = routerConfig
  
  if (mode === 'auto') {
    return budget !== 'free'
  }
  
  // Manual mode: mode contains the model ID
  return !mode.endsWith(':free')
}

/**
 * Returns a human-readable label for the current route.
 */
export function getRouteLabel(provider: string, routerConfig?: RouterConfig): string {
  if (provider === 'ollama') return 'FREE LOCAL'
  
  const paid = isPaidRoute(provider, routerConfig)
  if (provider === 'openrouter') {
    return paid ? 'PAID CLOUD' : 'FREE CLOUD'
  }
  
  return paid ? 'PAID' : 'FREE'
}
