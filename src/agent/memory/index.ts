/**
 * Memory system exports.
 */
export type {
  MemoryStore,
  MemoryItem,
  MemoryResult,
  MemoryMetadata,
  VectorStore,
} from './MemoryStore'

export {
  LocalVectorStore,
  createSimpleEmbedding,
  createEmbedding,
} from './MemoryStore'

export {
  memoryStore,
  initMemoryStore,
  storeTaskCompletion,
} from './SqliteMemoryStore'

export {
  warmEmbeddingModel,
  getEmbeddingStatus,
  createSemanticEmbedding,
} from './transformersEmbedding'
export type { EmbeddingStatus } from './transformersEmbedding'
  
  export {
    loadUserPreferences,
    saveUserPreferences,
    updatePreference,
    buildPreferencesSummary,
    extractPreferencesFromText,
  } from './userPreferences'
  