/**
 * App Store — composes domain slices into a single Zustand store.
 *
 * Slices:
 *   taskSlice     — tasks, messages, raw LLM history, chat actions
 *   uiSlice       — settings modal, config accordion
 *   agentSlice    — planning, tool approval
 *   settingsSlice — provider/model config, sandbox, sidecar, rate limiting
 *   gatewaySlice  — multi-gateway routing (defined in agent/gateway)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createTaskSlice, type TaskSlice, partializeTaskSlice } from './taskSlice'
import { createUISlice, type UISlice } from './uiSlice'
import { createAgentSlice, type AgentSlice } from './agentSlice'
import { createSettingsSlice, type SettingsSlice } from './settingsSlice'
import { createGatewaySlice, type GatewaySlice } from '../agent/gateway'
import { updateGlobalRateLimiterConfig } from '../agent/gateway/rateLimiter'
import { getPersistedTaskHistory } from '../tauri'
import { logger } from '../lib/logger'

// Re-export types that the rest of the app references from store
export type {
  ToolCallingSupport,
  CostTier,
  ModelProvider,
  ModelCapabilities,
  ModelInfo,
  RouterModelOverrides,
  RouterConfig,
  TaskRouterState,
  TaskTokenUsage,
} from './settingsSlice'

type AppState = TaskSlice & UISlice & AgentSlice & SettingsSlice & GatewaySlice

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createTaskSlice(...a),
      ...createUISlice(...a),
      ...createAgentSlice(...a),
      ...createSettingsSlice(...a),
      ...createGatewaySlice(...a),
    }),
    {
      name: 'nasus-store-v2',
      partialize: (state): Partial<AppState> => ({
        // Task slice
        ...partializeTaskSlice(state),
        // Settings slice
        apiKey: '',                          // never persist — load from OS keyring
        model: state.model,
        workspacePath: state.workspacePath,
        recentWorkspacePaths: state.recentWorkspacePaths,
        apiBase: state.apiBase,
        provider: state.provider,
        exaKey: '',                          // never persist — load from OS keyring
        maxIterations: state.maxIterations,
        onboardingComplete: state.onboardingComplete,
        enableVerification: state.enableVerification,
        ollamaModels: state.ollamaModels,
        rateLimitEnabled: state.rateLimitEnabled,
        maxRequestsPerMinute: state.maxRequestsPerMinute,
        routerConfig: state.routerConfig,
        extensionConnected: state.extensionConnected,
        extensionVersion: state.extensionVersion,
        sidecarPromptShown: state.sidecarPromptShown,
        // Gateway slice — strip API keys before writing to localStorage
        gateways: state.gateways.map(g => ({ ...g, apiKey: '' })),
        openRouterModels: state.openRouterModels,
        modelsLastFetched: state.modelsLastFetched,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return

        // Re-initialise rate limiter with stored settings
        updateGlobalRateLimiterConfig({
          enabled: state.rateLimitEnabled ?? true,
          maxRequests: state.maxRequestsPerMinute ?? 60,
        })

        // Clear any streaming:true flags left by a previous crashed session
        const fixedMessages: Record<string, import('../types').Message[]> = {}
        for (const [tid, msgs] of Object.entries(state.messages)) {
          fixedMessages[tid] = msgs.map((m) =>
            m.streaming ? { ...m, streaming: false } : m,
          )
        }
        useAppStore.setState({ messages: fixedMessages })

        // Trigger history load for active task from DB for full context
        if (state.activeTaskId) {
          getPersistedTaskHistory(state.activeTaskId).then(history => {
            if (history && history.length > 0) {
              useAppStore.setState(s => ({
                rawHistory: { ...s.rawHistory, [state.activeTaskId!]: history }
              }))
            }
          }).catch(err => {
            logger.warn('store', `Failed to load history for active task ${state.activeTaskId}`, err)
          })
        }

        // Seed workspaceVersions for tasks that have persisted workspace data
        import('../agent/workspace/WorkspaceManager').then(({ workspaceManager }) => {
          const tasks = state.tasks ?? []
          for (const task of tasks) {
            workspaceManager.getWorkspace(task.id).catch(err => {
              logger.warn('store', `Failed to load workspace for task ${task.id}`, err)
            })
          }
        }).catch(err => {
          logger.warn('store', 'Failed to load WorkspaceManager module', err)
        })
      },
    },
  ),
)
