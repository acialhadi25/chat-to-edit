/**
 * Error Logging and Monitoring Utilities
 * 
 * Provides comprehensive error logging, monitoring, and reporting capabilities.
 * 
 * Requirements: Technical Requirements 4 - Security Requirements
 * - Error handling and logging
 * - Audit logging for sensitive operations
 */

import { UniverError, ErrorCode, toUniverError } from './errors';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface ErrorLogEntry {
  id?: string;
  timestamp: Date;
  level: LogLevel;
  code: ErrorCode;
  message: string;
  details?: any;
  stack?: string;
  userId?: string;
  workbookId?: string;
  context?: Record<string, any>;
  recoverable: boolean;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByCode: Record<ErrorCode, number>;
  errorsByLevel: Record<LogLevel, number>;
  recentErrors: ErrorLogEntry[];
}

// ============================================================================
// Error Logger Class
// ============================================================================

export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private listeners: Set<(entry: ErrorLogEntry) => void> = new Set();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error
   */
  async logError(
    error: unknown,
    context?: {
      userId?: string;
      workbookId?: string;
      operation?: string;
      additionalContext?: Record<string, any>;
    }
  ): Promise<void> {
    const univerError = toUniverError(error);
    const level = this.getLogLevel(univerError);

    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      level,
      code: univerError.code,
      message: univerError.message,
      details: univerError.details,
      stack: univerError.stack,
      userId: context?.userId,
      workbookId: context?.workbookId,
      context: {
        operation: context?.operation,
        ...context?.additionalContext,
      },
      recoverable: univerError.recoverable,
    };

    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notify listeners
    this.notifyListeners(entry);

    // Log to console
    this.logToConsole(entry);

    // Log to database for persistent storage (async, don't wait)
    this.logToDatabase(entry).catch((err) => {
      console.error('Failed to log error to database:', err);
    });
  }

  /**
   * Log a warning
   */
  async logWarning(
    message: string,
    context?: {
      userId?: string;
      workbookId?: string;
      operation?: string;
      details?: any;
    }
  ): Promise<void> {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      level: LogLevel.WARN,
      code: ErrorCode.INITIALIZATION_ERROR, // Generic code for warnings
      message,
      details: context?.details,
      userId: context?.userId,
      workbookId: context?.workbookId,
      context: {
        operation: context?.operation,
      },
      recoverable: true,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.notifyListeners(entry);
    this.logToConsole(entry);
  }

  /**
   * Log an info message
   */
  async logInfo(
    message: string,
    context?: {
      userId?: string;
      workbookId?: string;
      operation?: string;
      details?: any;
    }
  ): Promise<void> {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      level: LogLevel.INFO,
      code: ErrorCode.INITIALIZATION_ERROR, // Generic code for info
      message,
      details: context?.details,
      userId: context?.userId,
      workbookId: context?.workbookId,
      context: {
        operation: context?.operation,
      },
      recoverable: true,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.notifyListeners(entry);
    
    // Only log info to console in development
    if (import.meta.env.DEV) {
      this.logToConsole(entry);
    }
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    const errorsByCode: Record<ErrorCode, number> = {} as any;
    const errorsByLevel: Record<LogLevel, number> = {} as any;

    for (const log of this.logs) {
      errorsByCode[log.code] = (errorsByCode[log.code] || 0) + 1;
      errorsByLevel[log.level] = (errorsByLevel[log.level] || 0) + 1;
    }

    return {
      totalErrors: this.logs.length,
      errorsByCode,
      errorsByLevel,
      recentErrors: this.logs.slice(-10), // Last 10 errors
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count = 10): ErrorLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get errors by code
   */
  getErrorsByCode(code: ErrorCode): ErrorLogEntry[] {
    return this.logs.filter((log) => log.code === code);
  }

  /**
   * Get errors by workbook
   */
  getErrorsByWorkbook(workbookId: string): ErrorLogEntry[] {
    return this.logs.filter((log) => log.workbookId === workbookId);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener: (entry: ErrorLogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private getLogLevel(error: UniverError): LogLevel {
    // Fatal errors
    if (!error.recoverable) {
      return LogLevel.FATAL;
    }

    // Error level based on error code
    const code = error.code;
    if (
      code === ErrorCode.DATABASE_ERROR ||
      code === ErrorCode.MEMORY_ERROR ||
      code === ErrorCode.INITIALIZATION_ERROR
    ) {
      return LogLevel.ERROR;
    }

    if (
      code === ErrorCode.NETWORK_ERROR ||
      code === ErrorCode.API_RATE_LIMIT ||
      code === ErrorCode.MCP_CONNECTION_ERROR
    ) {
      return LogLevel.WARN;
    }

    return LogLevel.ERROR;
  }

  private logToConsole(entry: ErrorLogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}] [${entry.code}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.FATAL:
      case LogLevel.ERROR:
        console.error(message, {
          details: entry.details,
          context: entry.context,
          stack: entry.stack,
        });
        break;
      case LogLevel.WARN:
        console.warn(message, {
          details: entry.details,
          context: entry.context,
        });
        break;
      case LogLevel.INFO:
        console.info(message, {
          details: entry.details,
          context: entry.context,
        });
        break;
      case LogLevel.DEBUG:
        console.debug(message, {
          details: entry.details,
          context: entry.context,
        });
        break;
    }
  }

  private async logToDatabase(entry: ErrorLogEntry): Promise<void> {
    try {
      // Only log errors and fatal to database to avoid clutter
      if (entry.level !== LogLevel.ERROR && entry.level !== LogLevel.FATAL) {
        return;
      }

      const { error } = await (supabase as any)
        .from('error_logs')
        .insert({
          timestamp: entry.timestamp.toISOString(),
          level: entry.level,
          code: entry.code,
          message: entry.message,
          details: entry.details,
          stack: entry.stack,
          user_id: entry.userId,
          workbook_id: entry.workbookId,
          context: entry.context,
          recoverable: entry.recoverable,
        });

      if (error) {
        console.error('Failed to log to database:', error);
      }
    } catch (err) {
      // Don't throw - logging failure shouldn't break the app
      console.error('Error logging to database:', err);
    }
  }

  private notifyListeners(entry: ErrorLogEntry): void {
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (err) {
        console.error('Error in error logger listener:', err);
      }
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

const logger = ErrorLogger.getInstance();

export const logError = (
  error: unknown,
  context?: Parameters<typeof logger.logError>[1]
) => logger.logError(error, context);

export const logWarning = (
  message: string,
  context?: Parameters<typeof logger.logWarning>[1]
) => logger.logWarning(message, context);

export const logInfo = (
  message: string,
  context?: Parameters<typeof logger.logInfo>[1]
) => logger.logInfo(message, context);

export const getErrorStats = () => logger.getStats();

export const getRecentErrors = (count?: number) => logger.getRecentErrors(count);

export const subscribeToErrors = (listener: (entry: ErrorLogEntry) => void) =>
  logger.subscribe(listener);
