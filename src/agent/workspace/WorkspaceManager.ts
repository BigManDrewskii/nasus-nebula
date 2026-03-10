import * as path from 'path'
import { tauriInvoke, workspaceReadBinary } from '../../tauri'
import { parseFileBuffer, isSupportedBinaryFormat } from '../FileParser'
import { createLogger } from '../../lib/logger'

const log = createLogger('WorkspaceManager')

/**
 * Workspace Manager — filesystem-based persistence for task workspaces.
 * Uses Tauri commands for filesystem access.
 */

export function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30)
    .replace(/-+$/, '')
}

/**
 * Workspace file metadata (used by listFiles).
 */
export interface WorkspaceFile {
  path: string
  filename: string
  size: number
  modifiedAt: Date
}

/**
 * Rust workspace file structure from backend.
 */
interface RustWorkspaceFile {
  path: string
  filename: string
  size: number
  modified_at: number // Unix timestamp
}

/**
 * Manager for task workspaces using filesystem storage.
 */
export class WorkspaceManager {
  /** In-memory content cache: taskId → (filePath → content) */
  private contentCache: Map<string, Map<string, string>> = new Map()
  /** Per-file edit history for undo support: taskId → (filePath → versions[]) */
  private history: Map<string, Map<string, string[]>> = new Map()
  /** Simple version counter for React subscriptions: taskId → version */
  private versions: Map<string, number> = new Map()
  private basePath: string | null = null
  private taskTitles: Map<string, string> = new Map()
  private initialized = false

  // ── History helpers ──────────────────────────────────────────────────────────

  private getHistory(taskId: string): Map<string, string[]> {
    if (!this.history.has(taskId)) {
      this.history.set(taskId, new Map())
    }
    return this.history.get(taskId)!
  }

  private pushHistory(taskId: string, filePath: string, content: string): void {
    const taskHistory = this.getHistory(taskId)
    if (!taskHistory.has(filePath)) {
      taskHistory.set(filePath, [])
    }
    const versions = taskHistory.get(filePath)!
    versions.push(content)
    // Keep only last 10 versions
    if (versions.length > 10) {
      versions.shift()
    }
  }

  async undoFile(taskId: string, filePath: string): Promise<string | null> {
    const taskHistory = this.getHistory(taskId)
    const versions = taskHistory.get(filePath)
    if (!versions || versions.length === 0) return null

    versions.pop() // Remove current version
    const previous = versions.length > 0 ? versions[versions.length - 1] : ''

    await this.writeFile(taskId, filePath, previous, true) // skipHistoryPush=true
    return previous
  }

  // ── Content cache ────────────────────────────────────────────────────────────

  /**
   * Ensure workspace files are loaded into memory cache.
   */
  async ensureLoaded(taskId: string): Promise<void> {
    if (this.contentCache.has(taskId) && this.contentCache.get(taskId)!.size > 0) return
    const files = await this.listFiles(taskId)
    const map = this.getWorkspaceSync(taskId)
    for (const file of files) {
      try {
        const content = await this.readFile(taskId, file.path)
        map.set(file.path, content)
        this.getHistory(taskId).set(file.path, [content])
      } catch { /* file not yet in workspace, skip */ }
    }
  }

  /**
   * Get the memory-cached workspace contents synchronously.
   */
  getWorkspaceSync(taskId: string): Map<string, string> {
    if (!this.contentCache.has(taskId)) {
      this.contentCache.set(taskId, new Map())
    }
    return this.contentCache.get(taskId)!
  }

  // ── Initialisation ───────────────────────────────────────────────────────────

  async init(basePath?: string): Promise<void> {
    if (basePath) {
      this.basePath = basePath
    } else {
      try {
        const config = await tauriInvoke<{ workspace_path?: string }>('get_config')
        if (config?.workspace_path) {
          this.basePath = config.workspace_path
        }
      } catch (e) {
          log.warn('Could not get workspace path from backend', e instanceof Error ? e : new Error(String(e)))
      }
    }

    if (!this.basePath) {
      this.basePath = '/tmp/nasus-workspace'
    }

    this.initialized = true
  }

  setTaskTitle(taskId: string, title: string): void {
    this.taskTitles.set(taskId, title)
  }

  /**
   * Ensure the workspace for a task is loaded.
   * Replaces the old async getWorkspace() that returned a now-removed Workspace struct.
   * Returns the content Map so callers can await this and immediately query files.
   */
  async getWorkspace(taskId: string): Promise<Map<string, string>> {
    await this.ensureLoaded(taskId)
    return this.getWorkspaceSync(taskId)
  }

  // ── File I/O ─────────────────────────────────────────────────────────────────

  async readFile(taskId: string, filePath: string): Promise<string> {
    if (!this.initialized) await this.init()

    const workspacePath = await this.getWorkspacePath(taskId)
    const result = await tauriInvoke<string>('workspace_read', { taskId, path: filePath, workspacePath })
    return result ?? ''
  }

  async readFileParsed(taskId: string, filePath: string): Promise<string> {
    const filename = filePath.split('/').pop() ?? filePath
    if (!isSupportedBinaryFormat(filename)) {
      return this.readFile(taskId, filePath)
    }
    if (!this.initialized) await this.init()
    await this.getWorkspacePath(taskId)
    const bytes = await workspaceReadBinary(taskId, filePath)
    if (!bytes) return `[Binary file: ${filename} — could not read]`
    try {
      const parsed = await parseFileBuffer(bytes, filename)
      const header = `[${parsed.format} — ${parsed.words} words]\n\n`
      const warnings = parsed.warnings?.length
        ? `\n\n[Parser warnings: ${parsed.warnings.join('; ')}]`
        : ''
      return header + parsed.text + warnings
    } catch (err) {
      return `[Failed to parse ${filename}: ${err}]`
    }
  }

  async writeFile(taskId: string, filePath: string, content: string, skipHistoryPush = false): Promise<void> {
    if (!this.initialized) await this.init()

    const workspacePath = await this.getWorkspacePath(taskId)

    // Path traversal guard — reject any path that escapes the workspace root
    const _resolvedFull = path.resolve(workspacePath, filePath)
    const _resolvedBase = path.resolve(workspacePath)
    if (_resolvedBase && !_resolvedFull.startsWith(_resolvedBase + path.sep) && _resolvedFull !== _resolvedBase) {
      throw new Error(`Path traversal detected: the path escapes the workspace boundary`)
    }

    await tauriInvoke('workspace_write', { taskId, path: filePath, content, workspacePath })

    // Update content cache
    this.getWorkspaceSync(taskId).set(filePath, content)

    // Increment version counter for React subscriptions
    this.versions.set(taskId, (this.versions.get(taskId) ?? 0) + 1)

    if (!skipHistoryPush) {
      this.pushHistory(taskId, filePath, content)
    }

    this.emitWorkspaceEvent(taskId)
  }

  async listFiles(taskId: string): Promise<WorkspaceFile[]> {
    if (!this.initialized) await this.init()

    const workspacePath = await this.getWorkspacePath(taskId)
    const rustFiles = await tauriInvoke<RustWorkspaceFile[]>('workspace_list', { taskId, workspacePath })
    return (rustFiles || []).map((f) => ({
      path: f.path,
      filename: f.filename,
      size: f.size,
      modifiedAt: new Date(f.modified_at * 1000),
    }))
  }

  async deleteFile(taskId: string, filePath: string): Promise<void> {
    if (!this.initialized) await this.init()

    const workspacePath = await this.getWorkspacePath(taskId)
    await tauriInvoke('workspace_delete', { taskId, path: filePath, workspacePath })

    this.getWorkspaceSync(taskId).delete(filePath)
    this.versions.set(taskId, (this.versions.get(taskId) ?? 0) + 1)

    this.emitWorkspaceEvent(taskId)
  }

  async deleteWorkspace(taskId: string): Promise<void> {
    if (!this.initialized) await this.init()

    const workspacePath = await this.getWorkspacePath(taskId)
    await tauriInvoke('workspace_delete_all', { taskId, workspacePath })

    this.contentCache.delete(taskId)
    this.versions.delete(taskId)
  }

  async refresh(taskId: string): Promise<void> {
    this.contentCache.delete(taskId)
    await this.ensureLoaded(taskId)
    this.versions.set(taskId, (this.versions.get(taskId) ?? 0) + 1)
    this.emitWorkspaceEvent(taskId)
  }

  /**
   * Resolve the base workspace directory (without task subdirectory).
   * All Rust commands (workspace_read, workspace_write, docker_create_container, etc.)
   * append task-{id} themselves — so this must return just the base path.
   */
  public async getWorkspacePath(_taskId: string): Promise<string> {
    if (!this.initialized) await this.init()

    const base = this.basePath?.trim() || '/tmp/nasus-workspace'

    if (base.startsWith('/') || base.includes(':')) {
      return base
    }
    try {
      const { homeDir, join } = await import('@tauri-apps/api/path')
      const home = await homeDir()
      return await join(home, base)
    } catch {
      return base
    }
  }

  /**
   * Get the workspace version for React subscriptions.
   */
  getVersion(taskId: string): number {
    return this.versions.get(taskId) ?? 0
  }

  private emitWorkspaceEvent(taskId: string): void {
    window.dispatchEvent(
      new CustomEvent('nasus:workspace', {
        detail: { taskId, version: this.getVersion(taskId) },
      }),
    )
  }
}

/**
 * Global workspace manager instance.
 */
export const workspaceManager = new WorkspaceManager()
export default workspaceManager

// ── Legacy compatibility layer ──────────────────────────────────────────────

export async function getWorkspace(taskId: string): Promise<Map<string, string>> {
  await workspaceManager.ensureLoaded(taskId)
  return workspaceManager.getWorkspaceSync(taskId)
}

export async function getWorkspaceVersion(taskId: string): Promise<number> {
  return workspaceManager.getVersion(taskId)
}

export async function clearWorkspace(taskId: string): Promise<void> {
  await workspaceManager.deleteWorkspace(taskId)
}

export async function copyWorkspace(sourceTaskId: string, destTaskId: string): Promise<void> {
  const source = await getWorkspace(sourceTaskId)
  for (const [path, content] of source) {
    await workspaceManager.writeFile(destTaskId, path, content)
  }
}
