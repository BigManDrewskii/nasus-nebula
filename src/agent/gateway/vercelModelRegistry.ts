/**
 * Vercel Model Registry — Dynamic model discovery from Vercel AI Gateway.
 *
 * Vercel provides a public /v1/models endpoint that returns all available models.
 * This module fetches and parses that data for runtime model discovery.
 */

/**
 * A model available on Vercel AI Gateway.
 */
export interface VercelModel {
  /** Unique model identifier (e.g., "anthropic/claude-sonnet-4-20250514") */
  id: string
  /** Human-readable model name */
  name: string
  /** Context window size in tokens (if provided) */
  context_length?: number
  /** Whether the model supports function/tool calling */
  supports_tool_calling?: boolean
}

/**
 * Fetch available models from Vercel AI Gateway.
 *
 * This endpoint is public and requires no authentication.
 * Returns a list of all models available through Vercel's AI Gateway.
 *
 * @throws {Error} If the fetch fails or returns non-JSON
 */
export async function fetchVercelModels(): Promise<VercelModel[]> {
  const url = 'https://ai-gateway.vercel.sh/v1/models'

  try {
    const resp = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
    }

    const json = await resp.json()

    // Vercel returns { data: VercelModel[], object: 'list' }
    if (!json?.data || !Array.isArray(json.data)) {
      console.warn('[Vercel Models] Unexpected response format:', json)
      return []
    }

    return json.data as VercelModel[]
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out after 10 seconds')
    }
    throw err
  }
}

