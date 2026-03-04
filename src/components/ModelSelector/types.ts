/**
 * ModelSelector Types — Shared types for the model selector components.
 */

export type ModelTier = 'reasoning' | 'coding' | 'general' | 'fast'

export interface DisplayModel {
  id: string              // Gateway-specific model ID
  name: string            // Human-readable canonical name
  provider: string        // Which provider this is on
  tier: ModelTier
  contextWindow: number   // In tokens
  isFree: boolean         // Free on current provider?
  inputCost: number       // Per 1M tokens (0 = free)
  outputCost: number      // Per 1M tokens (0 = free)
  isAvailable: boolean    // Currently reachable?
}

export type ModelSelectorPosition = 'above' | 'below'

export interface ModelSelectorProps {
  anchor: React.RefObject<HTMLElement | null>
  position?: ModelSelectorPosition
  onSelect: (modelId: string) => void
  onClose: () => void
}
