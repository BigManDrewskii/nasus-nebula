import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { cheapestModel, chatOnceViaGateway } from './llm'
import { workspaceManager } from './workspace/WorkspaceManager'
import { memoryStore } from './memory'
import { readM09SemanticFacts } from './memory/sidecarMemoryBridge'

/**
 * Project Memory — manages persistent project-level context across tasks.
 */

export async function readProjectMemory(): Promise<string> {
  const workspacePath = useAppStore.getState().workspacePath

  // Query M09 semantic layer with a short timeout — never blocks even if sidecar is down
  const m09Promise = Promise.race<string[]>([
    readM09SemanticFacts(),
    new Promise<string[]>(resolve => setTimeout(() => resolve([]), 800)),
  ])

  if (!workspacePath) {
    // No workspace path — merge TS vector store facts with M09 semantic facts
    try {
      const [tsResults, m09Facts] = await Promise.all([
        memoryStore.search('project fact framework convention api', 20),
        m09Promise,
      ])
      const tsFacts = tsResults
        .filter(r => r.metadata.contentType === 'project_fact')
        .map(r => `- ${r.content}`)
      // Merge M09 facts, dedup by content string
      const seen = new Set(tsFacts)
      const merged = [...tsFacts]
      for (const f of m09Facts) {
        const line = `- ${f}`
        if (!seen.has(line)) {
          seen.add(line)
          merged.push(line)
        }
      }
      const facts = merged.join('\n')
      return facts ? `# Project Memory\n\n${facts}\n` : ''
    } catch {
      return ''
    }
  }

  const memoryPath = '.nasus/project_memory.md'
  try {
    const [content, m09Facts] = await Promise.all([
      tauriInvoke<string>('read_file', {
        taskId: '__system__',
        path: memoryPath,
        workspacePath
      }).catch(() => ''),
      m09Promise,
    ])
    if (!content && m09Facts.length === 0) return ''
    if (m09Facts.length === 0) return content || ''
    // Append M09 facts not already present in the file
    const m09Section = m09Facts
      .filter(f => !(content ?? '').includes(f))
      .map(f => `- ${f}`)
      .join('\n')
    if (!m09Section) return content || ''
    const base = content ? content.trimEnd() : '# Project Memory\n\nFacts discovered about this project:'
    return `${base}\n\n<!-- M09 semantic layer -->\n${m09Section}\n`
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
