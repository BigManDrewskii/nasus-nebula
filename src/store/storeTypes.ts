/**
 * Shared store type definitions.
 *
 * Defines the combined AppState and the AppStateCreator helper type used by
 * every slice. Keeping this in a separate file breaks the potential circular
 * dependency that would arise if slices imported AppState directly from
 * store/index.ts while store/index.ts also imports from the slices.
 */

import type { StateCreator } from 'zustand'
import type { TaskSlice } from './taskSlice'
import type { UISlice } from './uiSlice'
import type { AgentSlice } from './agentSlice'
import type { SettingsSlice } from './settingsSlice'
import type { GatewaySlice } from '../agent/gateway'
import type { ToastSlice } from './toastSlice'
import type { AppSlice } from './appSlice'

export type AppState = TaskSlice & UISlice & AgentSlice & SettingsSlice & GatewaySlice & ToastSlice & AppSlice

/**
 * Typed StateCreator for slices composed into the root AppState store.
 * Each slice creator should use this type so that `set` and `get` carry
 * the full AppState and no `as any` casts are required at the root.
 *
 * Only the immer mutator is listed here — the persist wrapper does not
 * change the set/get signatures observable inside slice creators.
 */
export type AppStateCreator<T> = StateCreator<
  AppState,
  [['zustand/immer', never]],
  [],
  T
>
