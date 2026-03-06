/**
 * Permission System — Manages tool execution permissions and risk assessment.
 */

import { useAppStore } from '../../store'

export type PermissionLevel = 'allow' | 'ask' | 'deny'

export interface ToolPermission {
  tool: string
  level: PermissionLevel
}

export interface PermissionState {
  defaultLevel: PermissionLevel
  toolLevels: Record<string, PermissionLevel>
  autoApproveSafe: boolean
}

/**
 * Dangerous command patterns that always require approval.
 */
const DANGEROUS_PATTERNS = [
  /\brm\b/,
  /\bmv\b/,
  /\bdd\b/,
  /\bmkfs\b/,
  /\bformat\b/,
  /\bchmod\b/,
  /\bchown\b/,
  /\bcurl\b.*\|\s*bash/,
  /\bwget\b.*\|\s*bash/,
  />\s*\/dev\/sd/,
  /shutdown/,
  /reboot/,
  /kill -9/,
  /pkill/,
]

/**
 * Safe bash commands that are usually okay to auto-approve.
 */
const SAFE_COMMANDS = [
  /^ls(\s+|$)/,
  /^pwd(\s+|$)/,
  /^echo(\s+|$)/,
  /^cat(\s+|$)/,
  /^grep(\s+|$)/,
  /^find(\s+|$)/,
  /^npm\s+(install|test|run\s+\w+)(\s+|$)/,
  /^bun\s+(install|test|run\s+\w+)(\s+|$)/,
  /^git\s+(status|diff|log|branch)(\s+|$)/,
]

export class PermissionSystem {
  private state: PermissionState = {
    defaultLevel: 'ask',
    toolLevels: {
      'read_file': 'allow',
      'list_files': 'allow',
      'search_files': 'allow',
      'search_web': 'allow',
      'http_fetch': 'ask',
      'write_file': 'ask',
      'patch_file': 'ask',
      'edit_file': 'ask',
      'bash': 'ask',
      'bash_execute': 'ask',
      'python_execute': 'ask',
      'browser_navigate': 'allow',
    },
    autoApproveSafe: true,
  }

  constructor() {
    // Potentially load from persistent storage
  }

  /**
   * Check if a tool call requires user approval.
   */
  async checkPermission(
    tool: string,
    args: Record<string, any>,
    taskId: string,
    signal?: AbortSignal,
  ): Promise<{ approved: boolean; reason?: string }> {
    const level = this.state.toolLevels[tool] || this.state.defaultLevel

    if (level === 'allow') {
      // Even if allowed, check for dangerous patterns in bash
      if (tool === 'bash' || tool === 'bash_execute') {
        const command = args.command || args.script || ''
        if (this.isDangerous(command)) {
          return this.requestApproval(tool, args, taskId, 'Dangerous command detected', signal)
        }
        if (this.state.autoApproveSafe && this.isSafe(command)) {
          return { approved: true }
        }
        return this.requestApproval(tool, args, taskId, 'Bash execution requires confirmation', signal)
      }
      return { approved: true }
    }

    if (level === 'deny') {
      return { approved: false, reason: `Permission denied for tool: ${tool}` }
    }

    // Default to 'ask'
    return this.requestApproval(tool, args, taskId, undefined, signal)
  }

  /**
   * Check if a command is dangerous.
   */
  private isDangerous(command: string): boolean {
    return DANGEROUS_PATTERNS.some(pattern => pattern.test(command))
  }

  /**
   * Check if a command is safe.
   */
  private isSafe(command: string): boolean {
    return SAFE_COMMANDS.some(pattern => pattern.test(command))
  }

  /**
   * Request user approval for a tool call via the UI.
   *
   * Resolves automatically after APPROVAL_TIMEOUT_MS (default 60s) by
   * denying dangerous commands and allowing safe ones, so the agent never
   * hangs indefinitely. Wired to AbortSignal so task cancellation unblocks it.
   */
  private static readonly APPROVAL_TIMEOUT_MS = 60_000

  private async requestApproval(
    tool: string,
    args: Record<string, any>,
    taskId: string,
    reason?: string,
    signal?: AbortSignal,
  ): Promise<{ approved: boolean }> {
    return new Promise((resolve) => {
      // Dispatch event for UI to show approval modal
      const event = new CustomEvent(`nasus:tool-approval-request-${taskId}`, {
        detail: { tool, args, reason }
      })
      window.dispatchEvent(event)

      // Listen for approval/rejection
      const handleApprove = (e: any) => {
        if (e.detail?.tool === tool) {
          cleanup()
          resolve({ approved: true })
        }
      }

      const handleReject = (e: any) => {
        if (e.detail?.tool === tool) {
          cleanup()
          resolve({ approved: false })
        }
      }

      const handleAbort = () => {
        cleanup()
        resolve({ approved: false })
      }

      // Auto-deny after timeout — never hang the agent loop
      const timeoutId = setTimeout(() => {
        cleanup()
        // Auto-deny dangerous commands; auto-approve safe ones on timeout
        const command = args.command || args.script || ''
        resolve({ approved: this.isSafe(command) && !this.isDangerous(command) })
      }, PermissionSystem.APPROVAL_TIMEOUT_MS)

      const cleanup = () => {
        clearTimeout(timeoutId)
        window.removeEventListener(`nasus:tool-approved-${taskId}`, handleApprove)
        window.removeEventListener(`nasus:tool-rejected-${taskId}`, handleReject)
        signal?.removeEventListener('abort', handleAbort)
      }

      window.addEventListener(`nasus:tool-approved-${taskId}`, handleApprove)
      window.addEventListener(`nasus:tool-rejected-${taskId}`, handleReject)
      signal?.addEventListener('abort', handleAbort)

      // If already aborted, resolve immediately
      if (signal?.aborted) {
        cleanup()
        resolve({ approved: false })
        return
      }

      // Update store to show the approval UI
      useAppStore.getState().setPendingToolApproval({ tool, args, reason, taskId })
    })
  }
}

export const permissionSystem = new PermissionSystem()
