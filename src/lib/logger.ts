/**
 * Structured logging utility for Nasus.
 *
 * Replaces console.log/error/warn throughout the codebase with a consistent,
 * level-filtered logging system that maintains a history of entries for debugging.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  category: string
  message: string
  timestamp: Date
  data?: Record<string, unknown>
  error?: string
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  private minLevel: LogLevel = this.getLogLevel()
  private entries: LogEntry[] = []
  private readonly MAX_ENTRIES = 100

  private getLogLevel(): LogLevel {
    // In development, log everything. In production, only info and above.
    if (typeof import.meta.env !== 'undefined' && import.meta.env.DEV) {
      return 'debug'
    }
    return 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel]
  }

  private formatMessage(level: LogLevel, category: string, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12) // HH:MM:SS.mmm
    return `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`
  }

  private addEntry(entry: LogEntry): void {
    this.entries.push(entry)
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries.shift()
    }
  }

  debug(category: string, message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', category, message)
      console.debug(formatted, data ?? '')
      this.addEntry({ level: 'debug', category, message, timestamp: new Date(), data })
    }
  }

  info(category: string, message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', category, message)
      console.info(formatted, data ?? '')
      this.addEntry({ level: 'info', category, message, timestamp: new Date(), data })
    }
  }

  warn(category: string, message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', category, message)
      console.warn(formatted, error ?? '', data ?? '')
      this.addEntry({
        level: 'warn',
        category,
        message,
        timestamp: new Date(),
        data,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  error(category: string, message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', category, message)
      console.error(formatted, error ?? '', data ?? '')
      this.addEntry({
        level: 'error',
        category,
        message,
        timestamp: new Date(),
        data,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /** Get all log entries currently in memory (circular buffer of last MAX_ENTRIES) */
  getEntries(): LogEntry[] {
    return [...this.entries]
  }

  /** Clear all log entries from memory */
  clear(): void {
    this.entries = []
  }

  /** Set the minimum log level dynamically */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }
}

/** Singleton logger instance */
export const logger = new Logger()

/** Convenience exports for category-specific logging */
export function createLogger(category: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => logger.debug(category, message, data),
    info: (message: string, data?: Record<string, unknown>) => logger.info(category, message, data),
    warn: (message: string, error?: Error | unknown, data?: Record<string, unknown>) =>
      logger.warn(category, message, error, data),
    error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) =>
      logger.error(category, message, error, data),
  }
}
