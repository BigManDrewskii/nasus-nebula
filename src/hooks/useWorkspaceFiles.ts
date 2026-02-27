import { useEffect, useState } from 'react'

export interface WorkspaceFile {
  name: string
  content: string
  ext: string
}

/**
 * Reactively returns the workspace file list for a given task.
 * Subscribes to 'nasus:workspace' custom events so it re-renders
 * whenever the agent writes a file.
 */
export function useWorkspaceFiles(taskId: string | null): WorkspaceFile[] {
  const [files, setFiles] = useState<WorkspaceFile[]>([])

  useEffect(() => {
    if (!taskId) {
      setFiles([])
      return
    }

    const id = taskId
    let isMounted = true

    const updateFiles = async () => {
      try {
        const module = await import('../agent/workspace/WorkspaceManager')
        const manager = module.workspaceManager
        
        if (!manager) {
          console.warn('[useWorkspaceFiles] WorkspaceManager not found in module')
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
              console.warn(`[useWorkspaceFiles] Failed to read file ${f.path}:`, err)
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
        console.error('[useWorkspaceFiles] Failed to update workspace files:', err)
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
