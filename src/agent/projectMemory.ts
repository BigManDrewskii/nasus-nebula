import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { chatOnce, cheapestModel, chatOnceViaGateway } from './llm'
import { getWorkspace } from './tools'

/**
 * Project Memory — manages persistent project-level context across tasks.
 */

export async function readProjectMemory(): Promise<string> {
  const workspacePath = useAppStore.getState().workspacePath
  if (!workspacePath) return ''

  const memoryPath = `${workspacePath}/.nasus/project_memory.md`
  try {
    const content = await tauriInvoke<string>('read_file', {
      taskId: '__system__',
      path: memoryPath
    })
    return content || ''
  } catch {
    return ''
  }
}

export async function updateProjectMemory(taskId: string): Promise<void> {
  const workspacePath = useAppStore.getState().workspacePath
  if (!workspacePath) return

  const memoryPath = `${workspacePath}/.nasus/project_memory.md`

  // Read existing memory
  let existing = ''
  try {
    existing = await tauriInvoke<string>('read_file', {
      taskId: '__system__',
      path: memoryPath
    })
  } catch { /* file doesn't exist yet */ }

  // Read this task's findings
  const workspace = await getWorkspace(taskId)
  const findings = workspace.get('findings.md') ?? ''
  const plan = workspace.get('task_plan.md') ?? ''

  if (!findings && !plan) return

  // Use a cheap model to extract project-level facts
  const extractPrompt = `Given these task findings and plan, extract ONLY project-level facts that would be useful for future tasks on the same codebase. Do NOT include task-specific details.

Examples of good project-level facts:
- "Uses Next.js 14 with App Router"
- "Tailwind CSS v4 with CSS-first config"
- "API base URL is /api/v2/"
- "Database is Supabase PostgreSQL"
- "Auth uses NextAuth with Google provider"

Existing project memory (do NOT duplicate):
${existing}

Task findings:
${findings.slice(0, 3000)}

Task plan:
${plan.slice(0, 1000)}

Return ONLY new bullet points to ADD, or "NONE" if nothing new. Each bullet must start with "- ".`

  const store = useAppStore.getState()
  const resolved = store.resolveConnection()
  const { openRouterModels } = store
  const cheapModel = openRouterModels.length > 0
    ? cheapestModel(openRouterModels)
    : 'anthropic/claude-3-haiku'

  const newFacts = await chatOnceViaGateway(extractPrompt, 500, cheapModel)

  if (newFacts && newFacts.trim() !== 'NONE' && newFacts.includes('- ')) {
    const updated = existing
      ? `${existing.trimEnd()}\n${newFacts.trim()}\n`
      : `# Project Memory\n\nFacts discovered about this project:\n\n${newFacts.trim()}\n`

    await tauriInvoke('write_file', {
      taskId: '__system__',
      path: memoryPath,
      content: updated
    })
  }
}
