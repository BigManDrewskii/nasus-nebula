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
import { immer } from 'zustand/middleware/immer'

import { createTaskSlice, partializeTaskSlice } from './taskSlice'
import { createUISlice } from './uiSlice'
import { createAgentSlice } from './agentSlice'
import { createSettingsSlice } from './settingsSlice'
import { createGatewaySlice } from '../agent/gateway'
import { createToastSlice } from './toastSlice'
import { createAppSlice } from './appSlice'
import { type AppState } from './storeTypes'
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
  TextScale,
} from './settingsSlice'

export const useAppStore = create<AppState>()(
  persist(
    immer<AppState>((set, get, api) => ({
      ...createTaskSlice(set, get, api),
      ...createUISlice(set, get, api),
      ...createAgentSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
      ...createGatewaySlice(set, get, api),
      ...createToastSlice(set, get, api),
      ...createAppSlice(set, get, api),
    })),
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
        routerConfig: state.routerConfig,
        extensionConnected: state.extensionConnected,
        extensionVersion: state.extensionVersion,
          textScale: state.textScale,
          // Gateway slice — strip API keys before writing to localStorage
        gateways: state.gateways.map(g => ({ ...g, apiKey: '' })),
        openRouterModels: state.openRouterModels,
        modelsLastFetched: state.modelsLastFetched,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return

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
          getPersistedTaskHistory(state.activeTaskId).then((history: unknown[] | null) => {
            if (history && history.length > 0) {
              useAppStore.setState(s => ({
                rawHistory: { ...s.rawHistory, [state.activeTaskId!]: history }
              }))
            }
          }).catch((err: unknown) => {
            logger.warn('store', `Failed to load history for active task ${state.activeTaskId}`, err)
          })
        }

        // Seed workspaceVersions for tasks that have persisted workspace data
        import('../agent/workspace/WorkspaceManager').then(({ workspaceManager }) => {
          const tasks = state.tasks ?? []
          let failures = 0
          const total = tasks.length
          const checks = tasks.map((task) =>
            workspaceManager.getWorkspace(task.id).catch((err: unknown) => {
              logger.warn('store', `Failed to load workspace for task ${task.id}`, err)
              failures++
            })
          )
          Promise.allSettled(checks).then(() => {
            if (total > 0 && failures > total / 2) {
              useAppStore.getState().addToast(
                'Workspace files could not be loaded. Check your workspace path in Settings.',
                'amber',
              )
            }
          })
        }).catch((err: unknown) => {
          logger.warn('store', 'Failed to load WorkspaceManager module', err)
        })
      },
    },
  ),
)
