/**
 * Error tracker for the 3-strike escalation pattern.
 *
 * Strikes are tracked by TOOL NAME (not by error message signature) so that
 * repeated failures of the same tool — even with different errors — accumulate
 * toward the 3-strike cap. After 3 strikes the tool is BLOCKED: subsequent
 * calls are short-circuited before reaching the registry.
 *
 * Also tracks identical calls (same tool + same args) to detect stuck loops
 * where the model calls the same tool with the same arguments repeatedly
 * without an error surfacing.
 */
export class ErrorTracker {
  // Per-tool total failure count (key = tool name)
  private toolTotals: Map<string, number> = new Map()
  // Per-tool collected error messages
  private toolErrors: Map<string, string[]> = new Map()
  // Tools that have been blocked after hitting the cap
  private blocked: Set<string> = new Set()

  // Identical-call detection: key = "toolName|argsJson", value = count
  private callSignatures: Map<string, number> = new Map()
  static readonly IDENTICAL_CALL_CAP = 2

  private static readonly STRIKE_CAP = 3
  // Some tools get a higher cap (e.g. bash can legitimately fail a few times)
  private static TOOL_CAP: Record<string, number> = { bash: 4, bash_execute: 5 }

  record(tool: string, summary: string): number {
    const total = (this.toolTotals.get(tool) ?? 0) + 1
    this.toolTotals.set(tool, total)

    const errs = this.toolErrors.get(tool) ?? []
    errs.push(summary.slice(0, 300))
    this.toolErrors.set(tool, errs)

    const cap = ErrorTracker.TOOL_CAP[tool] ?? ErrorTracker.STRIKE_CAP
    if (total >= cap) {
      this.blocked.add(tool)
      return cap // always return cap so callers treat it as ≥3
    }
    return total
  }

  /**
   * Record a tool call attempt (before execution).
   * Returns true if this exact call (same tool + args) has been seen too many
   * times — indicating the model is stuck in a loop without errors.
   */
  recordCall(tool: string, args: Record<string, unknown>): boolean {
    // Exclude read-heavy tools that legitimately re-read the same file
    const exempted = new Set(['read_file', 'think', 'list_files'])
    if (exempted.has(tool)) return false

    const sig = `${tool}|${JSON.stringify(args)}`
    const count = (this.callSignatures.get(sig) ?? 0) + 1
    this.callSignatures.set(sig, count)
    return count > ErrorTracker.IDENTICAL_CALL_CAP
  }

  isBlocked(tool: string): boolean {
    return this.blocked.has(tool)
  }

  getStrikes(tool: string): number {
    return this.toolTotals.get(tool) ?? 0
  }

  attempts(tool: string): string[] {
    return this.toolErrors.get(tool) ?? []
  }

  reset(tool: string) {
    this.toolTotals.delete(tool)
    this.toolErrors.delete(tool)
    this.blocked.delete(tool)
  }
}
