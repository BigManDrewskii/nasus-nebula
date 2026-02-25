import { useEffect, useState } from 'react'
import { getWorkspace, getWorkspaceVersion } from '../agent/tools'

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
    if (!taskId) { setVersion(0); return }
    const id = taskId
    // Sync version immediately on taskId change so we always show current data
    setVersion(getWorkspaceVersion(id))

    function onWorkspace(e: Event) {
      const { taskId: tid } = (e as CustomEvent).detail
      if (tid === id) setVersion(getWorkspaceVersion(id))
    }
    window.addEventListener('nasus:workspace', onWorkspace)
    return () => window.removeEventListener('nasus:workspace', onWorkspace)
  }, [taskId])

  if (!taskId) return []

  const ws = getWorkspace(taskId)
  // version is used only to trigger re-render; actual data comes from ws
  void version

  return Array.from(ws.entries()).map(([name, content]) => ({
    name,
    content,
    ext: name.includes('.') ? name.split('.').pop()!.toLowerCase() : '',
  }))
}
