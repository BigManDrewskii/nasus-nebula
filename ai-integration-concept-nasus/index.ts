/**
 * Gateway Module — Multi-provider LLM routing for Nasus.
 *
 * File structure:
 *   src/agent/gateway/
 *   ├── index.ts            ← You are here (public API)
 *   ├── gatewayTypes.ts     ← Types, defaults, helpers
 *   ├── gatewayService.ts   ← Runtime: health tracking, failover, circuit breakers
 *   ├── modelRegistry.ts    ← Model catalog: IDs per gateway, free tier, capabilities
 *   └── gatewayStore.ts     ← Zustand slice for React integration
 *
 * Quick start:
 *   // In your store, add the gateway slice
 *   import { createGatewaySlice } from './agent/gateway'
 *
 *   // On app startup
 *   useAppStore.getState().initGatewayService()
 *   useAppStore.getState().loadGatewayConfig()
 *
 *   // Making LLM calls with failover
 *   const service = useAppStore.getState().getGatewayService()
 *   const { result } = await service.callWithFailover(async (apiBase, apiKey, headers) => {
 *     return streamCompletion(apiBase, apiKey, model, messages, tools, { headers })
 *   })
 *
 *   // Or resolve connection params for the legacy callLLM pattern
 *   const { apiBase, apiKey, model, provider } = useAppStore.getState().resolveConnection()
 */

// Types
export type {
  GatewayType,
  GatewayConfig,
  RoutingMode,
  RoutingConfig,
  GatewayModel,
  GatewayStatus,
  GatewayHealth,
  GatewayCallResult,
  GatewayEvent,
  GatewayEventCallback,
} from './gatewayTypes'

// Constants & helpers
export {
  DEFAULT_GATEWAYS,
  getActiveGateways,
  requiresApiKey,
  resolveModelId,
} from './gatewayTypes'

// Service
export { GatewayService } from './gatewayService'

// Model registry
export {
  MODEL_REGISTRY,
  getModelsForGateway,
  getFreeModels,
  findModelById,
  findModelByName,
  selectModel,
  translateModelId,
} from './modelRegistry'

// Store slice
export { createGatewaySlice } from './gatewayStore'
export type { GatewaySlice } from './gatewayStore'

// UI
export { GatewaySettings } from './GatewaySettings'
