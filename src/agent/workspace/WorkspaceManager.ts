import { tauriInvoke, workspaceReadBinary } from '../../tauri'
import { parseFileBuffer, isSupportedBinaryFormat } from '../FileParser'

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
 * Workspace file metadata.
 */
export interface WorkspaceFile {
  path: string
  filename: string
  size: number
  modifiedAt: Date
}

/**
 * Workspace data structure.
 */
export interface Workspace {
  taskId: string
  path: string
  files: Map<string, WorkspaceFile>
  version: number
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
  private workspaces: Map<string, Workspace> = new Map()
  private contentCache: Map<string, Map<string, string>> = new Map()
  private history: Map<string, Map<string, string[]>> = new Map()
  private basePath: string | null = null
  private taskTitles: Map<string, string> = new Map()
  private initialized = false

  /**
   * Get the history for a specific task.
   */
  private getHistory(taskId: string): Map<string, string[]> {
    if (!this.history.has(taskId)) {
      this.history.set(taskId, new Map())
    }
    return this.history.get(taskId)!
  }

  /**
   * Push a new version to the history.
   */
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

  /**
   * Pop the last version from history (Undo).
   */
  async undoFile(taskId: string, filePath: string): Promise<string | null> {
    const taskHistory = this.getHistory(taskId)
    const versions = taskHistory.get(filePath)
    if (!versions || versions.length === 0) return null
    
    // The top of the stack is the CURRENT version, so we need the one before it
    // Wait, if we just wrote a file, the current version is in the cache.
    // Let's say we have [v1, v2]. Current is v2. Undo should restore v1.
    versions.pop() // Remove current
    const previous = versions.length > 0 ? versions[versions.length - 1] : null
    
    if (previous !== null) {
      await this.writeFile(taskId, filePath, previous, true) // Pass true to skip history push
      return previous
    }
    return null
  }

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
        // Initialize history with current content
        this.getHistory(taskId).set(file.path, [content])
      } catch {}
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

  /**
   * Initialize the workspace manager with the base directory.
   */
  async init(basePath?: string): Promise<void> {
    if (basePath) {
      this.basePath = basePath
    } else {
      // Get workspace path from backend config
      try {
        const config = await tauriInvoke<any>('get_config')
        if (config?.workspace_path) {
          this.basePath = config.workspace_path
        }
      } catch (e) {
        console.warn('Could not get workspace path from backend:', e)
      }
    }

    if (!this.basePath) {
      this.basePath = '/tmp/nasus-workspace'
    }

    this.initialized = true
  }

  /**
   * Update task title for descriptive folder naming.
   */
  setTaskTitle(taskId: string, title: string): void {
    this.taskTitles.set(taskId, title)
  }

  /**
   * Get or create a workspace for a task.
   */
  async getWorkspace(taskId: string): Promise<Workspace> {
    if (!this.initialized) await this.init()

    if (this.workspaces.has(taskId)) {
      return this.workspaces.get(taskId)!
    }

    const workspacePath = await this.getWorkspacePath(taskId)

    // Load existing files
    const files = await this.listFiles(taskId)

    const workspace: Workspace = {
      taskId,
      path: workspacePath,
      files: new Map(files.map((f) => [f.path, f])),
      version: 0,
    }

    this.workspaces.set(taskId, workspace)
    return workspace
  }

  /**
   * Read a file from a workspace.
   */
  async readFile(taskId: string, filePath: string): Promise<string> {
    if (!this.initialized) await this.init()

    const workspacePath = await this.getWorkspacePath(taskId)
    const result = await tauriInvoke<string>('workspace_read', { taskId, path: filePath, workspacePath })
    return result ?? ''
  }

  /**
   * Read a file, auto-parsing binary formats (PDF, DOCX, CSV) to plain text.
   * Falls back to readFile for plain-text formats.
   */
  async readFileParsed(taskId: string, filePath: string): Promise<string> {
    const filename = filePath.split('/').pop() ?? filePath
    if (!isSupportedBinaryFormat(filename)) {
      return this.readFile(taskId, filePath)
    }
    if (!this.initialized) await this.init()
    const workspacePath = await this.getWorkspacePath(taskId)
    const bytes = await workspaceReadBinary(taskId, filePath, workspacePath!)
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

  /**
   * Write a file to a workspace.
   */
  async writeFile(taskId: string, filePath: string, content: string, skipHistoryPush = false): Promise<void> {
    if (!this.initialized) await this.init()

    const workspacePath = await this.getWorkspacePath(taskId)
    await tauriInvoke('workspace_write', { taskId, path: filePath, content, workspacePath })

    // Update metadata and version
    const workspace = await this.getWorkspace(taskId)
    const file: WorkspaceFile = {
      path: filePath,
      filename: filePath.split('/').pop() || filePath,
      size: new TextEncoder().encode(content).length,
      modifiedAt: new Date(),
    }
    workspace.files.set(filePath, file)
    workspace.version++

    // Update content cache
    this.getWorkspaceSync(taskId).set(filePath, content)

    // Update history
    if (!skipHistoryPush) {
      this.pushHistory(taskId, filePath, content)
    }

    this.emitWorkspaceEvent(taskId)
  }

  /**
   * List all files in a workspace.
   */
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

  /**
   * Delete a file from a workspace.
   */
  async deleteFile(taskId: string, filePath: string): Promise<void> {
    if (!this.initialized) await this.init()

    const workspacePath = await this.getWorkspacePath(taskId)
    await tauriInvoke('workspace_delete', { taskId, path: filePath, workspacePath })

    const workspace = await this.getWorkspace(taskId)
    workspace.files.delete(filePath)
    workspace.version++

    // Update content cache
    this.getWorkspaceSync(taskId).delete(filePath)

    this.emitWorkspaceEvent(taskId)
  }

  /**
   * Delete an entire workspace.
   */
  async deleteWorkspace(taskId: string): Promise<void> {
    if (!this.initialized) await this.init()

    const workspacePath = await this.getWorkspacePath(taskId)
    await tauriInvoke('workspace_delete_all', { taskId, workspacePath })

    this.workspaces.delete(taskId)
    this.contentCache.delete(taskId)
  }

  /**
   * Force a refresh of the workspace from disk.
   */
  async refresh(taskId: string): Promise<void> {
    this.contentCache.delete(taskId)
    await this.ensureLoaded(taskId)
    const workspace = await this.getWorkspace(taskId)
    workspace.version++
    this.emitWorkspaceEvent(taskId)
  }

  /**
   * Resolve the task workspace directory consistently.
   */
  public async getWorkspacePath(taskId: string): Promise<string> {
    if (!this.initialized) await this.init()

    const base = this.basePath?.trim() || '/tmp/nasus-workspace'
    // Stable folder name that doesn't change when task title is set later
    const folderName = `task-${taskId}`

    // Use absolute paths for the backend commands
    if (base.startsWith('/') || base.includes(':')) {
      return `${base}/${folderName}`
    }
    try {
      const { homeDir, join } = await import('@tauri-apps/api/path')
      const home = await homeDir()
      return await join(home, base, folderName)
    } catch {
      return `${base}/${folderName}`
    }
  }

  /**
   * Get the workspace version for React subscriptions.
   */
  getVersion(taskId: string): number {
    return this.workspaces.get(taskId)?.version ?? 0
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

// ── Legacy compatibility layer (bridges old API to new WorkspaceManager) ───

/**
 * Legacy: Get workspace files as a Map (for backward compatibility).
 */
export async function getWorkspace(taskId: string): Promise<Map<string, string>> {
  await workspaceManager.ensureLoaded(taskId)
  return workspaceManager.getWorkspaceSync(taskId)
}

/**
 * Legacy: Get workspace version.
 */
export async function getWorkspaceVersion(taskId: string): Promise<number> {
  return workspaceManager.getVersion(taskId)
}

/**
 * Legacy: Clear workspace files.
 */
export async function clearWorkspace(taskId: string): Promise<void> {
  await workspaceManager.deleteWorkspace(taskId)
}

/**
 * Legacy: Copy workspace from one task to another.
 */
export async function copyWorkspace(sourceTaskId: string, destTaskId: string): Promise<void> {
  const source = await getWorkspace(sourceTaskId)
  for (const [path, content] of source) {
    await workspaceManager.writeFile(destTaskId, path, content)
  }
}
