import { tauriInvoke } from '../../tauri'

/**
 * Workspace Manager — filesystem-based persistence for task workspaces.
 * Uses Tauri commands in desktop mode, browser fs API in web mode.
 *
 * Desktop mode: Uses Rust backend for true filesystem access
 * Browser mode: Falls back to Tauri's fs API with app data directory
 */

/**
 * Check if running in Tauri desktop environment.
 */
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

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
  private basePath: string | null = null
  private readonly WORKSPACE_PREFIX = 'task-'
  private initialized = false

  /**
   * Ensure workspace files are loaded into memory cache.
   */
  async ensureLoaded(taskId: string): Promise<void> {
    if (this.contentCache.has(taskId)) return
    const files = await this.listFiles(taskId)
    const map = new Map<string, string>()
    for (const file of files) {
      try {
        const content = await this.readFile(taskId, file.path)
        map.set(file.path, content)
      } catch {}
    }
    this.contentCache.set(taskId, map)
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
    if (this.initialized) return

    if (basePath) {
      this.basePath = basePath
    } else if (isTauri) {
      // In Tauri desktop mode, use the backend workspace commands
      try {
        const config = await tauriInvoke<any>('get_config')
        this.basePath = config.workspace_path
      } catch (e) {
        console.warn('Could not get workspace path from backend:', e)
        // Fallback to default Tauri path
        try {
          const { appLocalDataDir, join } = await import('@tauri-apps/api/path')
          const appLocalData = await appLocalDataDir()
          this.basePath = await join(appLocalData, 'workspaces')
        } catch {
          this.basePath = '/tmp/nasus/workspaces'
        }
      }
    } else {
      // Browser mode/Fallback: use app data directory if available
      try {
        const { appLocalDataDir, join } = await import('@tauri-apps/api/path')
        const appLocalData = await appLocalDataDir()
        this.basePath = await join(appLocalData, 'nasus', 'workspaces')
      } catch {
        // Pure browser environment without Tauri FS
        this.basePath = '/tmp/nasus/workspaces'
      }
    }

    // Ensure base directory exists
    if (this.basePath && !isTauri) {
      try {
        const { mkdir } = await import('@tauri-apps/plugin-fs')
        await mkdir(this.basePath, { recursive: true })
      } catch (e) {
        console.warn('Could not create workspace directory:', e)
      }
    }

    this.initialized = true
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

    // Create workspace directory if it doesn't exist (browser mode)
    if (!isTauri && this.basePath) {
      try {
        const { mkdir } = await import('@tauri-apps/plugin-fs')
        await mkdir(workspacePath, { recursive: true })
      } catch {}
    }

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

    if (isTauri) {
      return await tauriInvoke<string>('workspace_read', { taskId, path: filePath })
    }

    // Browser mode: use fs API
    const workspace = await this.getWorkspace(taskId)
    const fullPath = await this.getFullPath(workspace, filePath)

    try {
      const { readTextFile } = await import('@tauri-apps/plugin-fs')
      return await readTextFile(fullPath)
    } catch (e) {
      throw new Error(`Failed to read file ${filePath}: ${e}`)
    }
  }

  /**
   * Write a file to a workspace.
   */
  async writeFile(taskId: string, filePath: string, content: string): Promise<void> {
    if (!this.initialized) await this.init()

    if (isTauri) {
      await tauriInvoke('workspace_write', { taskId, path: filePath, content })
    } else {
      // Browser mode: use fs API
      const workspace = await this.getWorkspace(taskId)
      const fullPath = await this.getFullPath(workspace, filePath)

      const { mkdir, writeTextFile } = await import('@tauri-apps/plugin-fs')

      // Ensure parent directory exists
      const lastSlash = fullPath.lastIndexOf('/')
      if (lastSlash !== -1) {
        const parentPath = fullPath.substring(0, lastSlash)
        if (parentPath) {
          try {
            await mkdir(parentPath, { recursive: true })
          } catch {}
        }
      }

      await writeTextFile(fullPath, content)
    }

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

    this.emitWorkspaceEvent(taskId)
  }

  /**
   * Check if a file exists in the workspace.
   */
  async fileExists(taskId: string, filePath: string): Promise<boolean> {
    if (!this.initialized) await this.init()

    if (isTauri) {
      try {
        await tauriInvoke<string>('workspace_read', { taskId, path: filePath })
        return true
      } catch {
        return false
      }
    }

    const workspace = await this.getWorkspace(taskId)
    const fullPath = await this.getFullPath(workspace, filePath)
    try {
      const { exists } = await import('@tauri-apps/plugin-fs')
      return await exists(fullPath)
    } catch {
      return false
    }
  }

  /**
   * List all files in a workspace.
   */
  async listFiles(taskId: string): Promise<WorkspaceFile[]> {
    if (!this.initialized) await this.init()

    if (isTauri) {
      const rustFiles = await tauriInvoke<RustWorkspaceFile[]>('workspace_list', { taskId })
      return (rustFiles || []).map((f) => ({
        path: f.path,
        filename: f.filename,
        size: f.size,
        modifiedAt: new Date(f.modified_at * 1000),
      }))
    }

    // Browser mode: use fs API
    const workspace = await this.getWorkspace(taskId)

    try {
      const { readDir } = await import('@tauri-apps/plugin-fs')
      const entries = await readDir(workspace.path, { recursive: true })

      const files: WorkspaceFile[] = []
      for (const entry of entries) {
        if (!entry.children) {
          const relativePath = entry.path.replace(workspace.path + '/', '')
          files.push({
            path: relativePath,
            filename: entry.name,
            size: entry.metadata?.size ?? 0,
            modifiedAt: new Date(entry.metadata?.modifiedAt ?? Date.now()),
          })
        }
      }

      return files
    } catch (e) {
      return []
    }
  }

  /**
   * Delete a file from a workspace.
   */
  async deleteFile(taskId: string, filePath: string): Promise<void> {
    if (!this.initialized) await this.init()

    if (isTauri) {
      await tauriInvoke('workspace_delete', { taskId, path: filePath })
    } else {
      const workspace = await this.getWorkspace(taskId)
      const fullPath = await this.getFullPath(workspace, filePath)
      const { remove } = await import('@tauri-apps/plugin-fs')
      await remove(fullPath)
    }

    const workspace = await this.getWorkspace(taskId)
    workspace.files.delete(filePath)
    workspace.version++
    
    // Update content cache
    this.getWorkspaceSync(taskId).delete(filePath)

    this.emitWorkspaceEvent(taskId)
  }

  /**
   * Copy all files from one workspace to another.
   */
  async copyWorkspace(sourceTaskId: string, destTaskId: string): Promise<void> {
    const source = await this.getWorkspace(sourceTaskId)
    const dest = await this.getWorkspace(destTaskId)

    // Copy each file
    for (const [filePath, _] of source.files) {
      const content = await this.readFile(sourceTaskId, filePath)
      await this.writeFile(destTaskId, filePath, content)
    }

    dest.version = 1
    this.emitWorkspaceEvent(destTaskId)
  }

  /**
   * Delete an entire workspace.
   */
  async deleteWorkspace(taskId: string): Promise<void> {
    if (!this.initialized) await this.init()

    if (isTauri) {
      await tauriInvoke('workspace_delete_all', { taskId })
    } else {
      const workspacePath = await this.getWorkspacePath(taskId)
      try {
        const { remove } = await import('@tauri-apps/plugin-fs')
        await remove(workspacePath, { recursive: true })
      } catch {}
    }

    this.workspaces.delete(taskId)
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
   * Get the workspace version for React subscriptions.
   */
  getVersion(taskId: string): number {
    return this.workspaces.get(taskId)?.version ?? 0
  }

  /**
   * Clear workspace from memory (keeps files on disk).
   */
  unload(taskId: string): void {
    this.workspaces.delete(taskId)
  }

  /**
   * Clear all workspaces from memory.
   */
  unloadAll(): void {
    this.workspaces.clear()
  }

  /**
   * Get the disk usage of a workspace.
   */
  async getDiskUsage(taskId: string): Promise<{ totalBytes: number; fileCount: number }> {
    const files = await this.listFiles(taskId)
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
    return { totalBytes, fileCount: files.length }
  }

  // ── Private methods ────────────────────────────────────────────────────────────

  private async getWorkspacePath(taskId: string): Promise<string> {
    if (isTauri) {
      return `task-${taskId}`
    }
    if (!this.basePath) {
      throw new Error('WorkspaceManager not initialized. Call init() first.')
    }
    const { join } = await import('@tauri-apps/api/path')
    return await join(this.basePath, `${this.WORKSPACE_PREFIX}${taskId}`)
  }

  private async getFullPath(workspace: Workspace, filePath: string): Promise<string> {
    if (isTauri) {
      return filePath
    }
    const { join } = await import('@tauri-apps/api/path')
    const normalized = filePath
      .replace(/^\/workspace\/?/, '')
      .replace(/^\.\//, '')
      || 'output.txt'
    return await join(workspace.path, normalized)
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

// ── Legacy compatibility layer (bridges old API to new WorkspaceManager) ───

/**
 * Legacy: Get workspace files as a Map (for backward compatibility).
 */
export async function getWorkspace(taskId: string): Promise<Map<string, string>> {
  const files = await workspaceManager.listFiles(taskId)
  const map = new Map<string, string>()

  for (const file of files) {
    try {
      const content = await workspaceManager.readFile(taskId, file.path)
      map.set(file.path, content)
    } catch {
      // Skip files that can't be read
    }
  }

  return map
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
  await workspaceManager.copyWorkspace(sourceTaskId, destTaskId)
}
