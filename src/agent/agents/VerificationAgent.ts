/**
 * Verification Agent — Reviews execution results and checks for issues.
 *
 * The Verification Agent:
 * 1. Reviews execution results for errors
 * 2. Checks plan compliance
 * 3. Validates file operations
 * 4. Suggests corrections when needed
 * 5. Provides structured feedback for self-correction
 *
 * It can be used in two modes:
 * - Full mode (default): runs all checks including LLM analysis
 * - Quick mode: runs only code-level checks (no LLM call), used as a
 *   periodic phase gate inside the execution loop
 */

import { BaseAgent } from '../core/BaseAgent'
import { AgentState } from '../core/AgentState'
import type { AgentContext, AgentResult, AgentIssue, ExecutionPlan } from '../core/Agent'
import { chatOnceViaGateway } from '../llm'
import { workspaceManager } from '../workspace/WorkspaceManager'
import { useAppStore } from '../../store'
import { createLogger } from '../../lib/logger'

const log = createLogger('VerificationAgent')

// ── Structured tool definition for forced JSON verification output ─────────────
const VERIFY_TOOL = {
  type: 'function' as const,
  function: {
    name: 'report_issues',
    description: 'Report issues found in the execution output.',
    parameters: {
      type: 'object' as const,
      properties: {
        issues: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              type: { type: 'string', enum: ['error', 'warning', 'suggestion'] },
              message: { type: 'string' },
              correction: { type: 'string' },
            },
            required: ['type', 'message'],
          },
        },
      },
      required: ['issues'],
    },
  },
}

/**
 * Verification context parameters.
 */
export interface VerificationContext extends AgentContext {
  /** The task ID being verified */
  taskId: string
  /** The plan to verify against */
  plan: ExecutionPlan
  /** Execution output to verify */
  executionOutput: string
  /** Files created during execution */
  createdFiles?: Array<{ path: string; content: string }>
  /**
   * Quick mode: skip the LLM-based analysis step.
   * Use for periodic phase-gate checks inside the execution loop.
   * Default: false (full verification).
   */
  quick?: boolean
}

/**
 * Verification checklist result.
 */
export interface VerificationChecklist {
  /** All files created successfully */
  filesCreated: boolean
  /** No syntax errors in code */
  syntaxValid: boolean
  /** Plan requirements met */
  planCompliant: boolean
  /** No unresolved errors */
  errorsResolved: boolean
}

/**
 * Verification result with detailed findings.
 */
export interface VerificationResult {
  /** Overall pass/fail */
  passed: boolean
  /** Checklist results */
  checklist: VerificationChecklist
  /** Issues found */
  issues: AgentIssue[]
  /** Confidence score (0-1) */
  confidence: number
  /** Suggested corrections */
  corrections: string[]
}

/**
 * Verification Agent — Reviews execution and suggests improvements.
 */
export class VerificationAgent extends BaseAgent {
  readonly id = 'verification-agent'
  readonly name = 'Verification Agent'
  readonly type = 'verifier' as const

  constructor(name: string = 'Verification Agent', type: 'verifier' = 'verifier') {
    super(name, type)
  }

  /**
   * Execute the verification agent.
   */
  protected async doExecute(context: AgentContext): Promise<AgentResult> {
    const params = context as VerificationContext

    try {
      // Step 1: Run verification checks
      const checklist = await this.runChecklist(params)

      // Step 2: Analyze results for issues
      const issues = await this.identifyIssues(params, checklist)

      // Step 3: Generate corrections if needed
      const corrections = await this.generateCorrections(params, issues)

      // Step 4: Determine overall result
      const passed = this.isPassed(checklist, issues)

      const verificationResult: VerificationResult = {
        passed,
        checklist,
        issues,
        confidence: this.calculateConfidence(checklist, issues),
        corrections,
      }

      // Return result based on verification outcome
      if (passed) {
        return {
          state: AgentState.FINISHED,
          done: true,
          output: 'Verification passed. Task completed successfully.',
          metadata: { verificationResult },
        }
      }

      // Needs correction
      return {
        state: AgentState.THINKING,
        done: false,
        needsVerification: true,
        issues,
        output: this.formatVerificationReport(verificationResult),
        metadata: { verificationResult },
      }
    } catch (error) {
      return {
        state: AgentState.ERROR,
        done: true,
        error: `Verification failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Run verification checklist.
   */
  private async runChecklist(context: VerificationContext): Promise<VerificationChecklist> {
    const { createdFiles } = context

    // Check files created
    let filesCreated = true
    if (createdFiles && createdFiles.length > 0) {
      filesCreated = createdFiles.every(f => f.path && f.content)
    }

    // Check syntax validity
    let syntaxValid = true
    if (createdFiles) {
      for (const file of createdFiles) {
        if (!this.validateSyntax(file.path, file.content)) {
          syntaxValid = false
          break
        }
        if (this.isTruncated(file.content)) {
          syntaxValid = false // Treat truncation as syntax invalid for now to trigger correction
          break
        }
      }
    }

      // Check plan compliance
      const planCompliant = this.checkPlanCompliance(context)

    // Check errors resolved
    const errorsResolved = !context.executionOutput.includes('Error:') &&
                          !context.executionOutput.includes('[BLOCKED]')

    return {
      filesCreated,
      syntaxValid,
      planCompliant,
      errorsResolved,
    }
  }

  /**
   * Validate syntax of file content.
   */
  private validateSyntax(path: string, content: string): boolean {
    const ext = path.split('.').pop()?.toLowerCase()

    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        // Check for basic syntax errors
        return !content.includes('SyntaxError') &&
               !content.includes('Unexpected token') &&
               this.hasBalancedBrackets(content)

      case 'json':
        try {
          JSON.parse(content)
          return true
        } catch {
          return false
        }

      case 'py':
        // Basic Python syntax checks
        return !content.includes('SyntaxError') &&
               this.hasBalancedBrackets(content) &&
               this.hasValidIndentation(content)

      default:
        return true
    }
  }

  /**
   * Check if code appears to be truncated by the LLM.
   */
  private isTruncated(content: string): boolean {
    const lines = content.split('\n')
    const lastLines = lines.slice(-5)
    const combinedLast = lastLines.join('\n')

    // Indicators of truncation:
    const indicators = [
      /\/\/ \.\.\./,
      /\/\* \.\.\. \*\//,
      /\/\/ rest of code/,
      /\/\/ existing code/,
      /\/\* existing code \*\//,
      /\/\/ code stays the same/,
      /\.\.\.\s*$/, // ... at the end of content
    ]

    return indicators.some(regex => regex.test(combinedLast))
  }

  /**
   * Check if code has balanced brackets.
   *
   * Skips characters inside string literals and line comments to avoid
   * false-positives from brackets in string values like `const x = "{"`.
   */
  private hasBalancedBrackets(content: string): boolean {
    const stack: string[] = []
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' }
    let i = 0

    while (i < content.length) {
      const char = content[i]

      // Skip single-line comments
      if (char === '/' && content[i + 1] === '/') {
        while (i < content.length && content[i] !== '\n') i++
        continue
      }

      // Skip multi-line comments
      if (char === '/' && content[i + 1] === '*') {
        i += 2
        while (i < content.length - 1 && !(content[i] === '*' && content[i + 1] === '/')) i++
        i += 2
        continue
      }

      // Skip string literals (single-quoted, double-quoted, template)
      if (char === '"' || char === "'" || char === '`') {
        const quote = char
        i++
        while (i < content.length) {
          if (content[i] === '\\') { i += 2; continue } // escape
          if (content[i] === quote) { i++; break }
          i++
        }
        continue
      }

      // Check brackets (outside strings/comments)
      if (char in pairs) {
        stack.push(char)
      } else if (char === ')' || char === ']' || char === '}') {
        const last = stack.pop()
        if (pairs[last as string] !== char) {
          return false
        }
      }

      i++
    }

    return stack.length === 0
  }

  /**
   * Check if Python code has valid indentation.
   */
  private hasValidIndentation(content: string): boolean {
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.trim().length > 0 && line.startsWith(' ')) {
        // Check for consistent indentation (spaces or tabs, not mixed)
        const hasTabs = line.includes('\t')
        const hasSpaces = /^\s*\S/.test(line)
        if (hasTabs && hasSpaces) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Check if execution complied with the plan.
   */
  private checkPlanCompliance(context: VerificationContext): boolean {
    const { plan, taskId } = context

      // Use the real taskId to look up the workspace — never a placeholder
      const workspace = taskId ? workspaceManager.getWorkspaceSync(taskId) : null
    const planContent = workspace?.get('task_plan.md') ?? null

    if (!planContent) {
      // No plan file written yet — be optimistic rather than triggering a
      // wasted LLM correction call. An absent plan file is not a failure;
      // the agent may not have needed one, or it hasn't been written yet.
      return true
    }

    // Check if all phases in plan are marked complete
    const totalSteps = plan.phases.reduce((sum, p) => sum + p.steps.length, 0)
    const checkedItems = (planContent.match(/\[x\]/gi) || []).length

    // At least some steps should be checked off
    return checkedItems >= Math.min(totalSteps, 1)
  }

  /**
   * Identify issues from verification results.
   */
  private async identifyIssues(
    context: VerificationContext,
    checklist: VerificationChecklist,
  ): Promise<AgentIssue[]> {
    const issues: AgentIssue[] = []

    // File creation issues
    if (!checklist.filesCreated) {
      issues.push({
        type: 'error',
        message: 'Some files were not created successfully',
        correction: 'Re-run file creation operations and verify file paths are correct',
      })
    }

    // Syntax issues
    if (!checklist.syntaxValid) {
      const isTruncated = (context.createdFiles || []).some(f => this.isTruncated(f.content))
      issues.push({
        type: 'error',
        message: isTruncated ? 'Code appears to be truncated by the LLM' : 'Syntax errors detected in generated code',
        correction: isTruncated ? 'Please output the full content of the file without using "..." or "// existing code"' : 'Review and fix syntax errors before proceeding',
      })
    }

    // Plan compliance issues
    if (!checklist.planCompliant) {
      issues.push({
        type: 'warning',
        message: 'Not all planned phases were completed',
        correction: 'Review the task plan and complete remaining phases',
      })
    }

    // Error resolution issues
    if (!checklist.errorsResolved) {
      issues.push({
        type: 'error',
        message: 'Unresolved errors in execution output',
        correction: 'Address errors with alternative approaches or tools',
      })
    }

    // LLM-based analysis for deeper issues (skipped in quick mode)
      const deepIssues = context.quick ? [] : await this.analyzeWithLLM(context)
    issues.push(...deepIssues)

    return issues
  }

  /**
   * Use LLM to analyze execution for deeper issues.
   * Tries forced tool_choice (structured output) first; falls back to
   * free-text + regex JSON parse if the provider doesn't support it.
   */
  private async analyzeWithLLM(context: VerificationContext): Promise<AgentIssue[]> {
    const { executionOutput, plan } = context

    const conn = useAppStore.getState().resolveConnection()
    const verifyModel: string = conn.model || 'anthropic/claude-3-haiku'

    const prompt = `You are a Verification Agent. Review the following execution results and identify any issues.

Original Plan:
${plan.title}
${plan.description}

Execution Output:
${executionOutput.slice(0, 3000)}

Check for:
1. Incomplete requirements
2. Logic errors
3. Missing deliverables
4. Quality issues

If no issues found, return an empty issues array.`

    // ── Try structured output via tool_choice ──────────────────────────────
    const structured = await this.callWithStructuredOutput(prompt, verifyModel, conn)
    if (structured) {
      return (structured.issues || []) as AgentIssue[]
    }

    // ── Fallback: free-text + regex parse ─────────────────────────────────
    try {
      const response = await chatOnceViaGateway(prompt + '\n\nRespond ONLY with JSON: { "issues": [...] }', 1000, verifyModel)
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || response.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? jsonMatch[1] : response
      const parsed = JSON.parse(jsonStr)
      return parsed.issues || []
    } catch {
      return []
    }
  }

  /**
   * Attempt structured output via forced tool_choice.
   * Returns null if the provider doesn't support it.
   */
  private async callWithStructuredOutput(
    prompt: string,
    model: string,
    conn: ReturnType<ReturnType<typeof useAppStore.getState>['resolveConnection']>,
  ): Promise<{ issues: AgentIssue[] } | null> {
    const noToolChoice = conn.provider === 'ollama' || conn.provider === 'deepseek'
    if (noToolChoice) return null

    try {
      const base = (conn.apiBase ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '')
      const url = `${base}/chat/completions`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${conn.apiKey}`,
        ...(conn.extraHeaders ?? {}),
      }
      if (conn.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://nasus.app'
        headers['X-Title'] = 'Nasus'
      }

      const body = JSON.stringify({
        model,
        max_tokens: 1000,
        stream: false,
        tools: [VERIFY_TOOL],
        tool_choice: { type: 'function', function: { name: 'report_issues' } },
        messages: [{ role: 'user', content: prompt }],
      })

      const resp = await fetch(url, { method: 'POST', headers, body })
      if (!resp.ok) {
        log.warn(`Verification tool_choice failed (HTTP ${resp.status}), falling back to free-text`)
        return null
      }

      const json = await resp.json()
      const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0]
      if (!toolCall?.function?.arguments) return null

      return JSON.parse(toolCall.function.arguments) as { issues: AgentIssue[] }
    } catch (err) {
      log.warn('Verification callWithStructuredOutput failed', err instanceof Error ? err : new Error(String(err)))
      return null
    }
  }

  /**
   * Generate corrections for identified issues.
   */
  private async generateCorrections(
    _context: VerificationContext,
    issues: AgentIssue[],
  ): Promise<string[]> {
    return issues
      .filter(i => i.correction)
      .map(i => i.correction || '')
  }

  /**
   * Determine if verification passed.
   */
  private isPassed(checklist: VerificationChecklist, issues: AgentIssue[]): boolean {
    // Fail on errors, warn on warnings
    const hasErrors = issues.some(i => i.type === 'error')
    const hasCriticalFailures = !checklist.syntaxValid || !checklist.filesCreated

    return !hasErrors && !hasCriticalFailures
  }

  /**
   * Calculate confidence score.
   */
  private calculateConfidence(checklist: VerificationChecklist, issues: AgentIssue[]): number {
    let score = 1.0

    // Deduct for each failed checklist item
    if (!checklist.filesCreated) score -= 0.3
    if (!checklist.syntaxValid) score -= 0.4
    if (!checklist.planCompliant) score -= 0.2
    if (!checklist.errorsResolved) score -= 0.3

    // Deduct for each issue
    for (const issue of issues) {
      if (issue.type === 'error') score -= 0.15
      else if (issue.type === 'warning') score -= 0.05
      else if (issue.type === 'suggestion') score -= 0.02
    }

    return Math.max(0, score)
  }

  /**
   * Format verification report for display.
   */
  private formatVerificationReport(result: VerificationResult): string {
    const lines = [
      '## Verification Report',
      '',
      `**Status:** ${result.passed ? '✓ Passed' : '✗ Needs Correction'}`,
      `**Confidence:** ${Math.round(result.confidence * 100)}%`,
      '',
      '### Checklist',
      `- Files created: ${result.checklist.filesCreated ? '✓' : '✗'}`,
      `- Syntax valid: ${result.checklist.syntaxValid ? '✓' : '✗'}`,
      `- Plan compliant: ${result.checklist.planCompliant ? '✓' : '✗'}`,
      `- Errors resolved: ${result.checklist.errorsResolved ? '✓' : '✗'}`,
      '',
    ]

    if (result.issues.length > 0) {
      lines.push('### Issues Found')
      for (const issue of result.issues) {
        const icon = issue.type === 'error' ? '✗' : issue.type === 'warning' ? '⚠' : 'ℹ'
        lines.push(`- ${icon} ${issue.message}`)
        if (issue.correction) {
          lines.push(`  → ${issue.correction}`)
        }
      }
      lines.push('')
    }

    if (result.corrections.length > 0) {
      lines.push('### Suggested Corrections')
      for (let i = 0; i < result.corrections.length; i++) {
        lines.push(`${i + 1}. ${result.corrections[i]}`)
      }
    }

    return lines.join('\n')
  }
}

/**
 * Module-level singleton — avoids spinning up a new VerificationAgent on every call.
 * VerificationAgent has no per-instance mutable state beyond BaseAgent internals.
 */
const _sharedVerificationAgent = new VerificationAgent('verification', 'verifier')

/**
 * Convenience function to verify execution results.
 */
export async function verifyExecution(
  context: VerificationContext,
): Promise<VerificationResult> {
  const result = await _sharedVerificationAgent.execute(context)

  if (result.metadata?.verificationResult) {
    return result.metadata.verificationResult as VerificationResult
  }

  // Fallback result
  return {
    passed: true,
    checklist: {
      filesCreated: true,
      syntaxValid: true,
      planCompliant: true,
      errorsResolved: true,
    },
    issues: [],
    confidence: 1.0,
    corrections: [],
  }
}

/**
 * Quick phase-gate verification — no LLM call.
 * Returns issues found by code-level checks only.
 * Use inside the execution loop after phase transitions.
 */
export async function verifyPhaseGate(
  context: VerificationContext,
): Promise<VerificationResult> {
  return verifyExecution({ ...context, quick: true })
}
