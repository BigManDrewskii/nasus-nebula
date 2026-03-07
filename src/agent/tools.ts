import type { SearchConfig, SearchStatusCallback } from './search'
export type { SearchConfig, SearchStatusCallback }
import { workspaceManager } from './workspace/WorkspaceManager'

/**
 * tools.ts — Thin utility layer.
 *
 * The full tool executor now lives in tools/index.ts (class-based ToolRegistry).
 * This file retains:
 *   - Per-turn file tracker (used by ExecutionAgent and WriteFileTool)
 *   - Re-exports of SearchConfig / SearchStatusCallback for backward compat
 *   - Legacy workspace helpers (getWorkspace, clearWorkspace, copyWorkspace)
 */

export function getWorkspace(taskId: string): Map<string, string> {
  return workspaceManager.getWorkspaceSync(taskId)
}

export function getWorkspaceVersion(taskId: string): number {
  return workspaceManager.getVersion(taskId)
}

export async function clearWorkspace(taskId: string) {
  await workspaceManager.deleteWorkspace(taskId)
}

// ── Per-turn file tracker ─────────────────────────────────────────────────────
// Tracks files written during a single agent turn so the loop can emit output cards.

const turnFileTrackers: Map<string, { path: string; filename: string; content: string; size: number }[]> = new Map()

/** Call at the start of each agent turn to begin tracking write_file calls. */
export function startTurnTracking(taskId: string) {
  turnFileTrackers.set(taskId, [])
}

/** Call at the end of a turn to get all files written and clear the tracker. */
export function flushTurnFiles(taskId: string) {
  const files = turnFileTrackers.get(taskId) ?? []
  turnFileTrackers.delete(taskId)
  return files
}

export function trackTurnFile(taskId: string, path: string, content: string) {
  const tracker = turnFileTrackers.get(taskId)
  if (!tracker) return
  const filename = path.split('/').pop() ?? path
  const idx = tracker.findIndex((f) => f.path === path)
  const entry = { path, filename, content, size: new TextEncoder().encode(content).length }
  if (idx !== -1) tracker[idx] = entry
  else tracker.push(entry)
}

/** Copy all workspace files from one task to another. */
export async function copyWorkspace(sourceTaskId: string, destTaskId: string) {
  const { copyWorkspace: copyWs } = await import('./workspace/WorkspaceManager')
  await copyWs(sourceTaskId, destTaskId)
}
