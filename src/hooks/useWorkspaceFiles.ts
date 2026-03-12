import { useEffect, useState, useRef } from 'react'
import { createLogger } from '../lib/logger'

const log = createLogger('WorkspaceFiles')

export interface WorkspaceFile {
  name: string
  content: string
  ext: string
}

// Minimal interface matching what we use from WorkspaceManager
interface IWorkspaceManager {
  ensureLoaded(taskId: string): Promise<void>
  getWorkspaceSync(taskId: string): Map<string, string>
}

/**
 * Reactively returns the workspace file list for a given task.
 * Subscribes to 'nasus:workspace' custom events so it re-renders
 * whenever the agent writes a file.
 *
 * Reads from WorkspaceManager's in-memory content cache (populated by
 * writeFile) rather than re-invoking Tauri filesystem commands on every
 * update — this makes it work in both Tauri and browser mode.
 */
export function useWorkspaceFiles(taskId: string | null): WorkspaceFile[] {
  const [files, setFiles] = useState<WorkspaceFile[]>([])
  const managerRef = useRef<IWorkspaceManager | null>(null)

  useEffect(() => {
    if (!taskId) {
      setFiles([])
      return
    }

    const id = taskId
    let isMounted = true

    const getManager = async () => {
      if (!managerRef.current) {
        const module = await import('../agent/workspace/WorkspaceManager')
        managerRef.current = module.workspaceManager
      }
      return managerRef.current
    }

    const mapFromCache = (workspace: Map<string, string>): WorkspaceFile[] =>
      Array.from(workspace.entries())
        .filter(([path]) => {
          const basename = path.split('/').pop() ?? path
          return basename !== '.DS_Store' && basename !== 'Thumbs.db' && !basename.startsWith('._')
        })
        .map(([path, content]) => ({
          name: path,
          content,
          ext: path.includes('.') ? path.split('.').pop()!.toLowerCase() : '',
        }))

    // Fast update from in-memory cache — called on every workspace event.
    // writeFile() always updates the cache before emitting the event, so
    // this is always up-to-date without any Tauri round-trip.
    const updateFromCache = async () => {
      try {
        const manager = await getManager()
        if (!isMounted) return
        setFiles(mapFromCache(manager.getWorkspaceSync(id)))
      } catch (err) {
        log.error('Failed to read workspace cache', err instanceof Error ? err : new Error(String(err)))
      }
    }

    // On initial mount: hydrate the cache from disk (Tauri) for persisted files,
    // then read from cache. In browser mode ensureLoaded is a no-op (Tauri returns
    // undefined → listFiles returns []), but that's fine — cache will populate as
    // the agent writes files during the current session.
    const loadInitial = async () => {
      try {
        const manager = await getManager()
        await manager.ensureLoaded(id)
        if (!isMounted) return
        setFiles(mapFromCache(manager.getWorkspaceSync(id)))
      } catch (err) {
        log.error('Failed to load workspace from disk', err instanceof Error ? err : new Error(String(err)))
      }
    }

    loadInitial()

    function onWorkspace(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail && detail.taskId === id) {
        void updateFromCache()
      }
    }

    window.addEventListener('nasus:workspace', onWorkspace)
    return () => {
      isMounted = false
      window.removeEventListener('nasus:workspace', onWorkspace)
    }
  }, [taskId])

  return files
}
