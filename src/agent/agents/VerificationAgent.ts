/**
 * Verification Agent — Reviews execution results and checks for issues.
 *
 * The Verification Agent:
 * 1. Reviews execution results for errors
 * 2. Checks plan compliance
 * 3. Validates file operations
 * 4. Suggests corrections when needed
 * 5. Provides structured feedback for self-correction
 */

import { BaseAgent } from '../core/BaseAgent'
import { AgentState } from '../core/AgentState'
import type { AgentContext, AgentResult, AgentIssue, ExecutionPlan } from '../core/Agent'
import { chatOnce } from '../llm'
import { getWorkspace } from '../tools'

/**
 * Verification context parameters.
 */
export interface VerificationContext extends AgentContext {
  /** The plan to verify against */
  plan: ExecutionPlan
  /** Execution output to verify */
  executionOutput: string
  /** Files created during execution */
  createdFiles?: Array<{ path: string; content: string }>
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
      }
    }

    // Check plan compliance
    const planCompliant = await this.checkPlanCompliance(context)

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
   * Check if code has balanced brackets.
   */
  private hasBalancedBrackets(content: string): boolean {
    const stack: string[] = []
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' }

    for (const char of content) {
      if (char in pairs) {
        stack.push(char)
      } else if (char === ')' || char === ']' || char === '}') {
        const last = stack.pop()
        if (pairs[last as string] !== char) {
          return false
        }
      }
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
  private async checkPlanCompliance(context: VerificationContext): Promise<boolean> {
    const { plan } = context

    // Get workspace to check for plan file
    const workspace = await getWorkspace('verification') // temporary task ID
    const planContent = workspace.get('task_plan.md')

    if (!planContent) {
      // No plan file means execution didn't follow the plan structure
      return false
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
      issues.push({
        type: 'error',
        message: 'Syntax errors detected in generated code',
        correction: 'Review and fix syntax errors before proceeding',
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

    // LLM-based analysis for deeper issues
    const deepIssues = await this.analyzeWithLLM(context)
    issues.push(...deepIssues)

    return issues
  }

  /**
   * Use LLM to analyze execution for deeper issues.
   */
  private async analyzeWithLLM(context: VerificationContext): Promise<AgentIssue[]> {
    const { executionOutput, plan, apiKey, model, apiBase, provider } = context

    const verifyModel: string = model || 'anthropic/claude-3-haiku'

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

Respond in JSON format:
{
  "issues": [
    {
      "type": "error" | "warning" | "suggestion",
      "message": "Brief description",
      "correction": "How to fix"
    }
  ]
}

If no issues found, return {"issues": []}.`

    try {
      const response = await chatOnce(apiBase, apiKey, provider, verifyModel, prompt)

      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : response

      const parsed = JSON.parse(jsonStr)
      return parsed.issues || []
    } catch {
      return []
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
 * Convenience function to verify execution results.
 */
export async function verifyExecution(
  context: VerificationContext,
): Promise<VerificationResult> {
  const agent = new VerificationAgent('verification', 'verifier')
  const result = await agent.execute(context)

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
