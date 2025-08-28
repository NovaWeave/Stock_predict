/**
 * Error Handling Utilities
 * 
 * Comprehensive error handling system with classification, retry mechanisms,
 * and recovery strategies for the Stock Sentiment Analyzer application.
 */

import { ErrorInfo } from 'react';

// Error types and classifications
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  AUTHENTICATION = 'auth',
  PERMISSION = 'permission',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  CLIENT = 'client',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error interface
export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  statusCode?: number;
  retryable: boolean;
  userMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Error classification based on different types of errors
export class ErrorClassifier {
  static classifyError(error: Error | unknown): AppError {
    const baseError: AppError = {
      name: 'AppError',
      message: 'An unknown error occurred',
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      timestamp: new Date()
    };

    if (error instanceof Error) {
      baseError.message = error.message;
      baseError.stack = error.stack;
      
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          ...baseError,
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.MEDIUM,
          retryable: true,
          userMessage: 'Connection issue. Please check your internet connection and try again.'
        };
      }
      
      // Timeout errors
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        return {
          ...baseError,
          type: ErrorType.TIMEOUT,
          severity: ErrorSeverity.LOW,
          retryable: true,
          userMessage: 'Request timed out. Please try again.'
        };
      }
    }

    // HTTP errors
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      
      if (errorObj.status || errorObj.statusCode) {
        const statusCode = errorObj.status || errorObj.statusCode;
        
        if (statusCode >= 400 && statusCode < 500) {
          return {
            ...baseError,
            type: ErrorType.CLIENT,
            severity: statusCode === 401 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
            statusCode,
            retryable: statusCode === 429, // Only retry for rate limiting
            userMessage: ErrorClassifier.getHttpErrorMessage(statusCode)
          };
        }
        
        if (statusCode >= 500) {
          return {
            ...baseError,
            type: ErrorType.SERVER,
            severity: ErrorSeverity.HIGH,
            statusCode,
            retryable: true,
            userMessage: 'Server error. Please try again later.'
          };
        }
      }
    }

    return baseError;
  }

  private static getHttpErrorMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in and try again.';
      case 403:
        return 'You don\'t have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

// Retry mechanism with exponential backoff
export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffMultiplier?: number;
      shouldRetry?: (error: AppError) => boolean;
      onRetry?: (attempt: number, error: AppError) => void;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      shouldRetry = (error) => error.retryable,
      onRetry
    } = options;

    let lastError: AppError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = ErrorClassifier.classifyError(error);

        // Don't retry on last attempt or if error is not retryable
        if (attempt === maxAttempts || !shouldRetry(lastError)) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt - 1),
          maxDelay
        );

        onRetry?.(attempt, lastError);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Error recovery strategies
export class ErrorRecovery {
  static getRecoveryAction(error: AppError): {
    action: string;
    label: string;
    handler: () => void;
  } | null {
    switch (error.type) {
      case ErrorType.NETWORK:
        return {
          action: 'retry',
          label: 'Retry Connection',
          handler: () => window.location.reload()
        };

      case ErrorType.TIMEOUT:
        return {
          action: 'retry',
          label: 'Try Again',
          handler: () => window.location.reload()
        };

      case ErrorType.AUTHENTICATION:
        return {
          action: 'login',
          label: 'Sign In',
          handler: () => {
            // Redirect to login or show login modal
            window.location.href = '/login';
          }
        };

      case ErrorType.RATE_LIMIT:
        return {
          action: 'wait',
          label: 'Wait and Retry',
          handler: () => {
            setTimeout(() => window.location.reload(), 5000);
          }
        };

      case ErrorType.SERVER:
        return {
          action: 'retry',
          label: 'Retry Later',
          handler: () => {
            setTimeout(() => window.location.reload(), 2000);
          }
        };

      default:
        return {
          action: 'refresh',
          label: 'Refresh Page',
          handler: () => window.location.reload()
        };
    }
  }
}

// Error reporting and logging
export class ErrorReporter {
  private static errors: AppError[] = [];
  private static maxErrors = 100;

  static reportError(
    error: AppError, 
    context?: {
      component?: string;
      action?: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ) {
    // Add context to error
    const enrichedError = {
      ...error,
      metadata: {
        ...error.metadata,
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    };

    // Store error locally
    this.errors.unshift(enrichedError);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.severity.toUpperCase()} Error: ${error.type}`);
      console.error('Error:', enrichedError);
      console.error('Stack:', error.stack);
      console.error('Context:', context);
      console.groupEnd();
    }

    // In production, you might want to send to an error reporting service
    // Example: sendToErrorService(enrichedError);
  }

  static getErrorHistory(): AppError[] {
    return [...this.errors];
  }

  static clearErrors() {
    this.errors = [];
  }

  static getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>
    };

    // Initialize counters
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // Count errors
    this.errors.forEach(error => {
      stats.byType[error.type]++;
      stats.bySeverity[error.severity]++;
    });

    return stats;
  }
}

// Global error handlers
export class GlobalErrorHandler {
  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized) return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = ErrorClassifier.classifyError(event.reason);
      ErrorReporter.reportError(error, {
        component: 'GlobalErrorHandler',
        action: 'unhandledRejection'
      });

      // Prevent default browser behavior
      event.preventDefault();
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      const error = ErrorClassifier.classifyError(event.error || new Error(event.message));
      ErrorReporter.reportError(error, {
        component: 'GlobalErrorHandler',
        action: 'javascriptError',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    this.isInitialized = true;
  }

  static cleanup() {
    // Remove event listeners if needed
    this.isInitialized = false;
  }
}

// Validation helpers
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateStockSymbol(symbol: string): void {
  if (!symbol || typeof symbol !== 'string') {
    throw new ValidationError('Stock symbol is required', 'symbol');
  }
  
  const trimmed = symbol.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Stock symbol cannot be empty', 'symbol');
  }
  
  if (trimmed.length > 10) {
    throw new ValidationError('Stock symbol must be 10 characters or less', 'symbol');
  }
  
  if (!/^[A-Za-z0-9.-]+$/.test(trimmed)) {
    throw new ValidationError('Stock symbol contains invalid characters', 'symbol');
  }
}

// Utility functions
export function isNetworkError(error: any): boolean {
  return error?.type === ErrorType.NETWORK || 
         error?.message?.includes('fetch') ||
         error?.message?.includes('network') ||
         !navigator.onLine;
}

export function isRetryableError(error: AppError): boolean {
  return error.retryable || 
         error.type === ErrorType.NETWORK ||
         error.type === ErrorType.TIMEOUT ||
         (error.type === ErrorType.SERVER && error.statusCode !== 500);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage || error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}