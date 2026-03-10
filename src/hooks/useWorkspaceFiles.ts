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
  listFiles(taskId: string): Promise<{ path: string }[]>
  readFile(taskId: string, path: string): Promise<string | null>
}

/**
 * Reactively returns the workspace file list for a given task.
 * Subscribes to 'nasus:workspace' custom events so it re-renders
 * whenever the agent writes a file.
 */
export function useWorkspaceFiles(taskId: string | null): WorkspaceFile[] {
  const [files, setFiles] = useState<WorkspaceFile[]>([])
  // Cache the manager reference so we don't re-import on every event
  const managerRef = useRef<IWorkspaceManager | null>(null)

  useEffect(() => {
    if (!taskId) {
      setFiles([])
      return
    }

    const id = taskId
    let isMounted = true

    // Resolve the manager once and cache it
    const getManager = async () => {
      if (!managerRef.current) {
        const module = await import('../agent/workspace/WorkspaceManager')
        managerRef.current = module.workspaceManager
      }
      return managerRef.current
    }

    const updateFiles = async () => {
      try {
        const manager = await getManager()

        if (!manager) {
            log.warn('WorkspaceManager not found in module')
          return
        }

        const rawFiles = await manager.listFiles(id)
        if (!isMounted) return

        const results = await Promise.allSettled(
          rawFiles.map(async (f) => {
            try {
              const content = await manager.readFile(id, f.path)
              return {
                name: f.path,
                content: content || '',
                ext: f.path.includes('.') ? f.path.split('.').pop()!.toLowerCase() : '',
              }
            } catch (err) {
                log.warn(`Failed to read file ${f.path}`, err instanceof Error ? err : new Error(String(err)))
              throw err
            }
          })
        )

        if (!isMounted) return

        const mapped = results
          .filter((r): r is PromiseFulfilledResult<WorkspaceFile> => r.status === 'fulfilled')
          .map((r) => r.value)

        setFiles(mapped)
      } catch (err) {
          log.error('Failed to update workspace files', err instanceof Error ? err : new Error(String(err)))
      }
    }

    // Initial load
    updateFiles()

    function onWorkspace(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail && detail.taskId === id) {
        updateFiles()
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
