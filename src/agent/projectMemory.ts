import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { cheapestModel, chatOnceViaGateway } from './llm'
import { workspaceManager } from './workspace/WorkspaceManager'
import { memoryStore } from './memory'

/**
 * Project Memory — manages persistent project-level context across tasks.
 */

export async function readProjectMemory(): Promise<string> {
  const workspacePath = useAppStore.getState().workspacePath

  // No workspace path — read project facts from the vector memory store
  if (!workspacePath) {
    try {
      const results = await memoryStore.search('project fact framework convention api', 20)
      const facts = results
        .filter(r => r.metadata.contentType === 'project_fact')
        .map(r => `- ${r.content}`)
        .join('\n')
      return facts ? `# Project Memory\n\n${facts}\n` : ''
    } catch {
      return ''
    }
  }

  const memoryPath = '.nasus/project_memory.md'
  try {
    const content = await tauriInvoke<string>('read_file', {
      taskId: '__system__',
      path: memoryPath,
      workspacePath
    })
    return content || ''
  } catch {
    return ''
  }
}

export async function updateProjectMemory(taskId: string): Promise<void> {
  const workspacePath = useAppStore.getState().workspacePath

  // Read this task's findings
  const workspace = workspaceManager.getWorkspaceSync(taskId)
  const findings = workspace?.get('findings.md') ?? ''
  const plan = workspace?.get('task_plan.md') ?? ''

  if (!findings && !plan) return

  // Read existing memory for deduplication (workspace path only — vector store deduplicates naturally)
  let existing = ''
  if (workspacePath) {
    try {
      const content = await tauriInvoke<string>('read_file', {
        taskId: '__system__',
        path: '.nasus/project_memory.md',
        workspacePath
      })
      existing = content || ''
    } catch { /* file doesn't exist yet */ }
  }

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
  const { openRouterModels } = store
  const conn = store.resolveConnection()
  let cheapModel: string
  if (conn.provider === 'deepseek') {
    cheapModel = 'deepseek-chat'
  } else if (conn.provider === 'ollama') {
    cheapModel = conn.model || store.model
  } else {
    cheapModel = openRouterModels.length > 0
      ? cheapestModel(openRouterModels)
      : 'anthropic/claude-3-haiku'
  }

  const newFacts = await chatOnceViaGateway(extractPrompt, 500, cheapModel)
  if (!newFacts || newFacts.trim() === 'NONE' || !newFacts.includes('- ')) return

  // No workspace path — persist new facts to the vector memory store
  if (!workspacePath) {
    const lines = newFacts.split('\n').filter(l => l.trim().startsWith('- '))
    for (const line of lines) {
      const fact = line.replace(/^-\s*/, '').trim()
      if (fact) {
        await memoryStore.store(fact, { contentType: 'project_fact', taskId, timestamp: Date.now() })
      }
    }
    return
  }

  const updated = existing
    ? `${existing.trimEnd()}\n${newFacts.trim()}\n`
    : `# Project Memory\n\nFacts discovered about this project:\n\n${newFacts.trim()}\n`

  await tauriInvoke('write_file', {
    taskId: '__system__',
    path: '.nasus/project_memory.md',
    content: updated,
    workspacePath
  })
}
