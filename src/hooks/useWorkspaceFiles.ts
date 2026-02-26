import { useEffect, useState } from 'react'
import { getWorkspace, getWorkspaceVersion } from '../agent/tools'
import { workspaceManager } from '../agent/workspace/WorkspaceManager'

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
  const [version, setVersion] = useState(() =>
    taskId != null ? getWorkspaceVersion(taskId) : 0,
  )

  useEffect(() => {
    if (!taskId) {
      setVersion(0)
      return
    }

    const id = taskId
    setVersion(getWorkspaceVersion(id))

    // Ensure files are loaded from disk if this is the first time we see this task
    workspaceManager.ensureLoaded(id).then(() => {
      setVersion((v) => v + 1)
    })

    function onWorkspace(e: Event) {
      const { taskId: tid } = (e as CustomEvent).detail
      if (tid === id) {
        setVersion((v) => v + 1)
      }
    }

    window.addEventListener('nasus:workspace', onWorkspace)
    return () => window.removeEventListener('nasus:workspace', onWorkspace)
  }, [taskId])

  if (!taskId) return []

  const ws = getWorkspace(taskId)
  
  return Array.from(ws.entries()).map(([name, content]) => ({
    name,
    content,
    ext: name.includes('.') ? name.split('.').pop()!.toLowerCase() : '',
  }))
}
