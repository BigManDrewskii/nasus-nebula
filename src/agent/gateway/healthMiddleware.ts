import { type LanguageModel } from 'ai';

/**
 * Wrap a Vercel AI SDK LanguageModel with health tracking.
 *
 * Note: The current AI SDK doesn't expose doGenerate/doStream methods directly.
 * Health tracking is now handled at a higher level in the gateway service.
 */
export function withHealthTracking(model: LanguageModel, _gatewayId: string): LanguageModel {
  // For now, just return the model as-is.
  // Health tracking is handled via the GatewayService's recordSuccess/recordFailure methods
  // called from the LLM layer (streamCompletion, etc.)
  return model;
}
