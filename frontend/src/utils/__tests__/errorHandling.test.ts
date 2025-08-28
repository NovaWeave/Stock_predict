import {
  ErrorClassifier,
  RetryManager,
  ErrorReporter,
  ErrorRecovery,
  GlobalErrorHandler,
  ValidationError,
  validateStockSymbol,
  isNetworkError,
  isRetryableError,
  getErrorMessage,
  ErrorType,
  ErrorSeverity,
  AppError
} from '../errorHandling';

describe('ErrorClassifier', () => {
  describe('classifyError', () => {
    it('classifies generic Error objects', () => {
      const error = new Error('Generic error message');
      const classified = ErrorClassifier.classifyError(error);

      expect(classified.name).toBe('AppError');
      expect(classified.message).toBe('Generic error message');
      expect(classified.type).toBe(ErrorType.UNKNOWN);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(false);
      expect(classified.timestamp).toBeInstanceOf(Date);
    });

    it('classifies network errors', () => {
      const error = new Error('fetch failed due to network issue');
      const classified = ErrorClassifier.classifyError(error);

      expect(classified.type).toBe(ErrorType.NETWORK);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('Connection issue');
    });

    it('classifies timeout errors', () => {
      const error = new Error('Request timeout occurred');
      const classified = ErrorClassifier.classifyError(error);

      expect(classified.type).toBe(ErrorType.TIMEOUT);
      expect(classified.severity).toBe(ErrorSeverity.LOW);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('Request timed out');
    });

    it('classifies HTTP 400 errors', () => {
      const error = { status: 400, message: 'Bad Request' };
      const classified = ErrorClassifier.classifyError(error);

      expect(classified.type).toBe(ErrorType.CLIENT);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.statusCode).toBe(400);
      expect(classified.retryable).toBe(false);
      expect(classified.userMessage).toContain('Invalid request');
    });

    it('classifies HTTP 401 errors', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const classified = ErrorClassifier.classifyError(error);

      expect(classified.type).toBe(ErrorType.CLIENT);
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.statusCode).toBe(401);
      expect(classified.retryable).toBe(false);
      expect(classified.userMessage).toContain('Authentication required');
    });

    it('classifies HTTP 429 errors as retryable', () => {
      const error = { status: 429, message: 'Too Many Requests' };
      const classified = ErrorClassifier.classifyError(error);

      expect(classified.type).toBe(ErrorType.CLIENT);
      expect(classified.statusCode).toBe(429);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('Too many requests');
    });

    it('classifies HTTP 500 errors', () => {
      const error = { status: 500, message: 'Internal Server Error' };
      const classified = ErrorClassifier.classifyError(error);

      expect(classified.type).toBe(ErrorType.SERVER);
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.statusCode).toBe(500);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('Server error');
    });

    it('handles non-error objects', () => {
      const notAnError = 'string error';
      const classified = ErrorClassifier.classifyError(notAnError);

      expect(classified.type).toBe(ErrorType.UNKNOWN);
      expect(classified.message).toBe('An unknown error occurred');
    });

    it('handles null/undefined errors', () => {
      const classified = ErrorClassifier.classifyError(null);

      expect(classified.type).toBe(ErrorType.UNKNOWN);
      expect(classified.message).toBe('An unknown error occurred');
    });
  });
});

describe('RetryManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('withRetry', () => {
    it('succeeds on first attempt', async () => {
      const operation = jest.fn().mockResolvedValueOnce('success');

      const result = await RetryManager.withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries failed operations', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success');

      const retryPromise = RetryManager.withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 100
      });

      // Fast forward through retries
      setTimeout(() => {
        jest.advanceTimersByTime(100);
      }, 0);
      
      setTimeout(() => {
        jest.advanceTimersByTime(200);
      }, 50);

      const result = await retryPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('throws error after max attempts', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new Error('Always fails'));

      const retryPromise = RetryManager.withRetry(operation, {
        maxAttempts: 2,
        baseDelay: 100
      });

      // Fast forward through retry
      setTimeout(() => {
        jest.advanceTimersByTime(100);
      }, 0);

      await expect(retryPromise).rejects.toThrow('Always fails');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('respects shouldRetry predicate', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new Error('Non-retryable error'));

      const shouldRetry = jest.fn().mockReturnValue(false);

      await expect(
        RetryManager.withRetry(operation, { shouldRetry })
      ).rejects.toThrow('Non-retryable error');

      expect(operation).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalled();
    });

    it('calls onRetry callback', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Retry me'))
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();

      const retryPromise = RetryManager.withRetry(operation, {
        maxAttempts: 2,
        baseDelay: 100,
        onRetry
      });

      setTimeout(() => {
        jest.advanceTimersByTime(100);
      }, 0);

      await retryPromise;

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('implements exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any;

      const retryPromise = RetryManager.withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 100,
        backoffMultiplier: 2
      });

      setTimeout(() => {
        jest.advanceTimersByTime(500);
      }, 0);

      await retryPromise;

      expect(delays).toEqual([100, 200]); // Exponential backoff
      
      global.setTimeout = originalSetTimeout;
    });

    it('respects maxDelay', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any;

      const retryPromise = RetryManager.withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 1000,
        backoffMultiplier: 10,
        maxDelay: 1500
      });

      setTimeout(() => {
        jest.advanceTimersByTime(3000);
      }, 0);

      await retryPromise;

      expect(delays[1]).toBe(1500); // Should be capped at maxDelay
      
      global.setTimeout = originalSetTimeout;
    });
  });
});

describe('ErrorReporter', () => {
  beforeEach(() => {
    ErrorReporter.clearErrors();
    jest.spyOn(console, 'group').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'groupEnd').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('reportError', () => {
    it('stores errors in history', () => {
      const error: AppError = {
        name: 'TestError',
        message: 'Test error',
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        timestamp: new Date()
      };

      ErrorReporter.reportError(error);

      const history = ErrorReporter.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject(error);
    });

    it('enriches errors with context', () => {
      const error: AppError = {
        name: 'TestError',
        message: 'Test error',
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        timestamp: new Date()
      };

      const context = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user123'
      };

      ErrorReporter.reportError(error, context);

      const history = ErrorReporter.getErrorHistory();
      expect(history[0].metadata).toMatchObject(context);
      expect(history[0].metadata?.userAgent).toBe(navigator.userAgent);
      expect(history[0].metadata?.url).toBe(window.location.href);
    });

    it('limits error history size', () => {
      for (let i = 0; i < 150; i++) {
        const error: AppError = {
          name: 'TestError',
          message: `Error ${i}`,
          type: ErrorType.API,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          timestamp: new Date()
        };
        ErrorReporter.reportError(error);
      }

      const history = ErrorReporter.getErrorHistory();
      expect(history).toHaveLength(100); // Should be capped at maxErrors
    });

    it('logs errors in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error: AppError = {
        name: 'TestError',
        message: 'Test error',
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        timestamp: new Date()
      };

      ErrorReporter.reportError(error);

      expect(console.group).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect(console.groupEnd).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getErrorStats', () => {
    it('provides correct statistics', () => {
      const errors: AppError[] = [
        {
          name: 'Error1',
          message: 'Network error',
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.HIGH,
          retryable: true,
          timestamp: new Date()
        },
        {
          name: 'Error2',
          message: 'API error',
          type: ErrorType.API,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          timestamp: new Date()
        },
        {
          name: 'Error3',
          message: 'Another network error',
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.LOW,
          retryable: true,
          timestamp: new Date()
        }
      ];

      errors.forEach(error => ErrorReporter.reportError(error));

      const stats = ErrorReporter.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byType[ErrorType.NETWORK]).toBe(2);
      expect(stats.byType[ErrorType.API]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(1);
    });
  });

  describe('clearErrors', () => {
    it('clears error history', () => {
      const error: AppError = {
        name: 'TestError',
        message: 'Test error',
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        timestamp: new Date()
      };

      ErrorReporter.reportError(error);
      expect(ErrorReporter.getErrorHistory()).toHaveLength(1);

      ErrorReporter.clearErrors();
      expect(ErrorReporter.getErrorHistory()).toHaveLength(0);
    });
  });
});

describe('ErrorRecovery', () => {
  describe('getRecoveryAction', () => {
    it('provides retry action for network errors', () => {
      const error: AppError = {
        name: 'NetworkError',
        message: 'Network failed',
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        retryable: true,
        timestamp: new Date()
      };

      const action = ErrorRecovery.getRecoveryAction(error);

      expect(action).not.toBeNull();
      expect(action?.action).toBe('retry');
      expect(action?.label).toBe('Retry Connection');
      expect(typeof action?.handler).toBe('function');
    });

    it('provides login action for auth errors', () => {
      const error: AppError = {
        name: 'AuthError',
        message: 'Unauthorized',
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        retryable: false,
        timestamp: new Date()
      };

      const action = ErrorRecovery.getRecoveryAction(error);

      expect(action).not.toBeNull();
      expect(action?.action).toBe('login');
      expect(action?.label).toBe('Sign In');
    });

    it('provides wait action for rate limit errors', () => {
      const error: AppError = {
        name: 'RateLimitError',
        message: 'Too many requests',
        type: ErrorType.RATE_LIMIT,
        severity: ErrorSeverity.MEDIUM,
        retryable: true,
        timestamp: new Date()
      };

      const action = ErrorRecovery.getRecoveryAction(error);

      expect(action).not.toBeNull();
      expect(action?.action).toBe('wait');
      expect(action?.label).toBe('Wait and Retry');
    });

    it('provides default action for unknown errors', () => {
      const error: AppError = {
        name: 'UnknownError',
        message: 'Unknown error',
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        timestamp: new Date()
      };

      const action = ErrorRecovery.getRecoveryAction(error);

      expect(action).not.toBeNull();
      expect(action?.action).toBe('refresh');
      expect(action?.label).toBe('Refresh Page');
    });
  });
});

describe('GlobalErrorHandler', () => {
  let originalAddEventListener: typeof window.addEventListener;
  let originalRemoveEventListener: typeof window.removeEventListener;

  beforeEach(() => {
    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  afterEach(() => {
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    GlobalErrorHandler.cleanup();
  });

  describe('initialize', () => {
    it('sets up global error listeners', () => {
      GlobalErrorHandler.initialize();

      expect(window.addEventListener).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    });

    it('does not initialize twice', () => {
      GlobalErrorHandler.initialize();
      GlobalErrorHandler.initialize();

      // Should only be called once per event type
      expect(window.addEventListener).toHaveBeenCalledTimes(2);
    });
  });
});

describe('ValidationError', () => {
  it('creates validation error with field', () => {
    const error = new ValidationError('Invalid input', 'email');

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid input');
    expect(error.field).toBe('email');
  });

  it('creates validation error without field', () => {
    const error = new ValidationError('Invalid input');

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid input');
    expect(error.field).toBeUndefined();
  });
});

describe('validateStockSymbol', () => {
  it('validates correct stock symbols', () => {
    expect(() => validateStockSymbol('AAPL')).not.toThrow();
    expect(() => validateStockSymbol('TSLA')).not.toThrow();
    expect(() => validateStockSymbol('BRK.A')).not.toThrow();
    expect(() => validateStockSymbol('BRK-B')).not.toThrow();
  });

  it('throws for invalid symbols', () => {
    expect(() => validateStockSymbol('')).toThrow(ValidationError);
    expect(() => validateStockSymbol('   ')).toThrow(ValidationError);
    expect(() => validateStockSymbol('VERY_LONG_SYMBOL')).toThrow(ValidationError);
    expect(() => validateStockSymbol('INVALID@SYMBOL')).toThrow(ValidationError);
  });

  it('throws for non-string input', () => {
    expect(() => validateStockSymbol(null as any)).toThrow(ValidationError);
    expect(() => validateStockSymbol(undefined as any)).toThrow(ValidationError);
    expect(() => validateStockSymbol(123 as any)).toThrow(ValidationError);
  });
});

describe('Utility functions', () => {
  describe('isNetworkError', () => {
    it('identifies network errors correctly', () => {
      const networkError: AppError = {
        name: 'NetworkError',
        message: 'fetch failed',
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        retryable: true,
        timestamp: new Date()
      };

      expect(isNetworkError(networkError)).toBe(true);

      const apiError: AppError = {
        name: 'APIError',
        message: 'API failed',
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        timestamp: new Date()
      };

      expect(isNetworkError(apiError)).toBe(false);
    });

    it('checks navigator.onLine', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const anyError = {};
      expect(isNetworkError(anyError)).toBe(true);

      Object.defineProperty(navigator, 'onLine', {
        value: true,
      });

      expect(isNetworkError(anyError)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('identifies retryable errors', () => {
      const retryableError: AppError = {
        name: 'RetryableError',
        message: 'Retry me',
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        retryable: true,
        timestamp: new Date()
      };

      expect(isRetryableError(retryableError)).toBe(true);

      const nonRetryableError: AppError = {
        name: 'NonRetryableError',
        message: 'Do not retry',
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        timestamp: new Date()
      };

      expect(isRetryableError(nonRetryableError)).toBe(false);
    });

    it('considers network and timeout errors retryable', () => {
      const networkError: AppError = {
        name: 'NetworkError',
        message: 'Network failed',
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        retryable: false, // Even if marked as false
        timestamp: new Date()
      };

      expect(isRetryableError(networkError)).toBe(true);

      const timeoutError: AppError = {
        name: 'TimeoutError',
        message: 'Request timed out',
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.LOW,
        retryable: false, // Even if marked as false
        timestamp: new Date()
      };

      expect(isRetryableError(timeoutError)).toBe(true);
    });
  });

  describe('getErrorMessage', () => {
    it('extracts message from AppError', () => {
      const error: AppError = {
        name: 'TestError',
        message: 'Original message',
        userMessage: 'User-friendly message',
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        timestamp: new Date()
      };

      expect(getErrorMessage(error)).toBe('User-friendly message');
    });

    it('falls back to message if no userMessage', () => {
      const error: AppError = {
        name: 'TestError',
        message: 'Original message',
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        timestamp: new Date()
      };

      expect(getErrorMessage(error)).toBe('Original message');
    });

    it('handles regular Error objects', () => {
      const error = new Error('Regular error message');
      expect(getErrorMessage(error)).toBe('Regular error message');
    });

    it('handles string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('handles unknown error types', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
      expect(getErrorMessage({})).toBe('An unknown error occurred');
    });
  });
});