/**
 * PhaseGate — per-phase verification and tool-masking helpers.
 *
 * Extracted from ExecutionAgent so these pure-ish functions can be
 * tested in isolation and reused from ReactLoop without coupling the
 * entire agent class.
 */

import { verifyPhaseGate } from '../agents/VerificationAgent'
import { workspaceManager } from '../workspace/WorkspaceManager'
import type { ExecutionPlan } from '../core/Agent'

/** Tools that are always available regardless of the active phase. */
const ALWAYS_AVAILABLE = [
  'think',
  'complete',
  'update_plan',
  'save_memory',
  'save_preference',
]

/**
 * Run a quick (no-LLM) verification gate after `update_plan` signals
 * phase completion.  Returns only error-level issues found in current
 * workspace files so the loop can inject a correction nudge.
 */
export async function runPhaseGate(
  plan: ExecutionPlan,
  taskId: string,
): Promise<Array<{ type: string; message: string; correction?: string }>> {
  const workspace = workspaceManager.getWorkspaceSync(taskId)
  if (!workspace) return []

  const createdFiles: Array<{ path: string; content: string }> = []
  for (const [path, content] of workspace.entries()) {
    if (!path.startsWith('.') && path !== 'task_plan.md' && path !== 'findings.md') {
      createdFiles.push({ path, content })
    }
  }
  if (createdFiles.length === 0) return []

  try {
    const result = await verifyPhaseGate({
      task: { id: taskId, title: plan.title, status: 'in_progress', createdAt: new Date() },
      userInput: plan.title,
      messages: [],
      tools: [],
      taskId,
      plan,
      executionOutput: '',
      createdFiles,
      // IMPORTANT: quick:true is required — this call must never trigger an LLM.
      quick: true,
    })
    return result.issues.filter(i => i.type === 'error')
  } catch {
    return []
  }
}

/**
 * Map a plan phase to a list of active tool names for phase-aware masking.
 * Returns an empty array when all tools should remain available (no masking).
 *
 * Priority order:
 * 1. If the phase steps have explicit tool lists, use their union (data-driven).
 * 2. Fall back to keyword matching on the phase title (legacy).
 */
export function getActiveToolsForPhase(
  phaseTitle: string,
  phaseStepTools?: string[][],
): string[] {
  // Data-driven: use tools declared in the plan steps
  if (phaseStepTools && phaseStepTools.length > 0) {
    const declared = phaseStepTools.flat().filter(Boolean)
    if (declared.length > 0) {
      return [...new Set([...ALWAYS_AVAILABLE, ...declared])]
    }
  }

  // Keyword fallback
  const lowerTitle = phaseTitle.toLowerCase()

  if (
    lowerTitle.includes('research') ||
    lowerTitle.includes('gather') ||
    lowerTitle.includes('search')
  ) {
    return [
      ...ALWAYS_AVAILABLE,
      'search_web',
      'http_fetch',
      'browser_navigate',
      'browser_extract',
      'browser_extract_links',
      'browser_screenshot',
      'browser_analyze_screenshot',
      'browser_aria_snapshot',
      'browser_scroll',
      'browser_wait_for',
      'read_file',
      'write_file',
    ]
  }
  if (
    lowerTitle.includes('plan') ||
    lowerTitle.includes('structure') ||
    lowerTitle.includes('design')
  ) {
    return [...ALWAYS_AVAILABLE, 'write_file', 'edit_file', 'read_file', 'list_files']
  }
  if (
    lowerTitle.includes('implement') ||
    lowerTitle.includes('write') ||
    lowerTitle.includes('code') ||
    lowerTitle.includes('build') ||
    lowerTitle.includes('create')
  ) {
    return [
      ...ALWAYS_AVAILABLE,
      'read_file',
      'write_file',
      'edit_file',
      'patch_file',
      'list_files',
      'search_files',
      'analyze_code',
      'bash_execute',
      'bash',
      'python_execute',
      'serve_preview',
      'git',
      'http_fetch',
    ]
  }
  if (
    lowerTitle.includes('verify') ||
    lowerTitle.includes('test') ||
    lowerTitle.includes('review') ||
    lowerTitle.includes('check')
  ) {
    return [
      ...ALWAYS_AVAILABLE,
      'read_file',
      'list_files',
      'bash_execute',
      'bash',
      'python_execute',
      'analyze_code',
      'browser_navigate',
      'browser_screenshot',
      'browser_analyze_screenshot',
      'browser_extract',
    ]
  }
  if (
    lowerTitle.includes('browser') ||
    lowerTitle.includes('web') ||
    lowerTitle.includes('scrape') ||
    lowerTitle.includes('navigate')
  ) {
    return [
      ...ALWAYS_AVAILABLE,
      'browser_navigate',
      'browser_click',
      'browser_type',
      'browser_extract',
      'browser_extract_links',
      'browser_screenshot',
      'browser_analyze_screenshot',
      'browser_aria_snapshot',
      'browser_scroll',
      'browser_wait_for',
      'read_file',
      'write_file',
    ]
  }

  // Default: no masking — return empty array so all tools stay active
  return []
}
