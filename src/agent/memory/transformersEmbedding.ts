/**
 * Semantic embedding via Transformers.js (WASM, runs fully local).
 *
 * Uses `Xenova/all-MiniLM-L6-v2` — 22 MB quantised q8 model that produces
 * 384-dim embeddings. Matches the vector dimensionality expected by voy-search
 * (already wired up in LocalVectorStore) and by createSimpleEmbedding's
 * default `dimensions = 384`.
 *
 * The pipeline is initialised lazily on first call and cached globally so
 * subsequent calls are just an inference pass (~5–20 ms on Apple Silicon WASM).
 *
 * CSP note: We use a static import so env.backends.onnx.wasm.wasmPaths is set
 * synchronously at module evaluation time — before Transformers.js can fall back
 * to loading ort-wasm-*.mjs from cdn.jsdelivr.net (blocked by Tauri's CSP).
 * The WASM/worker files are copied to public/ort/ by the build setup.
 */

import { pipeline, env } from '@huggingface/transformers'
import { createSimpleEmbedding } from './MemoryStore'

// ─── Configure ORT WASM paths BEFORE any pipeline call ───────────────────────
// Prevents Transformers.js from loading worker scripts from cdn.jsdelivr.net,
// which violates Tauri's script-src 'self' CSP.
env.backends.onnx.wasm.numThreads = 1
// Use an absolute URL so the browser fetches the WASM files directly from
// the static server without going through Vite's transform middleware (which
// rejects /public .mjs files imported from source code).
env.backends.onnx.wasm.wasmPaths = `${location.origin}/ort/`
env.allowRemoteModels = true
env.allowLocalModels = false
// ─────────────────────────────────────────────────────────────────────────────

// Model ID — q8 quantised for balance of speed and quality
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2'

type Pipeline = {
  (inputs: string | string[], options?: Record<string, unknown>): Promise<{ data: Float32Array }[]>
}

let _pipeline: Pipeline | null = null
let _initPromise: Promise<Pipeline> | null = null

/** Status exposed to the settings UI */
export type EmbeddingStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'

let _status: EmbeddingStatus = 'idle'
let _error: string | null = null

export function getEmbeddingStatus(): { status: EmbeddingStatus; error: string | null } {
  return { status: _status, error: _error }
}

/**
 * Lazily initialise the feature-extraction pipeline.
 * Safe to call multiple times — returns the cached promise.
 */
async function getPipeline(): Promise<Pipeline> {
  if (_pipeline) return _pipeline
  if (_initPromise) return _initPromise

  _status = 'loading'
  _initPromise = (async () => {
    try {
      const pipe = await pipeline('feature-extraction', MODEL_ID, {
        dtype: 'q8',
        device: 'wasm',
      }) as unknown as Pipeline

      _pipeline = pipe
      _status = 'ready'
      return pipe
    } catch (err) {
      _status = 'error'
      _error = err instanceof Error ? err.message : String(err)
      throw err
    }
  })()

  return _initPromise
}

/**
 * Produce a 384-dim normalised embedding for `text`.
 *
 * Falls back to `createSimpleEmbedding` if Transformers.js fails (e.g. first
 * cold-start before download completes, or offline mode).
 */
export async function createSemanticEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getPipeline()
    const output = await pipe(text, { pooling: 'mean', normalize: true })
    return Array.from(output[0].data as Float32Array)
  } catch (err) {
    console.warn('[embedding] Transformers.js failed, using simple fallback:', err)
    return createSimpleEmbedding(text)
  }
}

/**
 * Warm-start: kick off model download/load in the background without blocking.
 * Call this once at app startup so the first real search is fast.
 */
export function warmEmbeddingModel(): void {
  getPipeline().catch(() => {
    // Swallow — failure is handled per-call in createSemanticEmbedding
  })
}
