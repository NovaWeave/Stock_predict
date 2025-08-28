/**
 * Enhanced API Hooks
 * 
 * Advanced React hooks that integrate error handling, loading states,
 * toast notifications, and retry mechanisms for a better user experience.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast, useErrorToast, useLoadingToast } from '@/components/Toast';
import { 
  ErrorClassifier, 
  RetryManager, 
  ErrorReporter,
  AppError,
  isRetryableError,
  isNetworkError 
} from '@/utils/errorHandling';

// Enhanced API state interface
interface EnhancedApiState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  isFromCache: boolean;
  retryCount: number;
  lastFetch: Date | null;
}

// Options for enhanced API hooks
interface EnhancedApiOptions {
  enableCache?: boolean;
  cacheTtl?: number;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableToast?: boolean;
  toastOnSuccess?: string;
  toastOnError?: boolean;
  enableErrorReporting?: boolean;
  context?: {
    component?: string;
    feature?: string;
    action?: string;
  };
}

// Cache implementation
class EnhancedApiCache {
  private cache = new Map<string, { 
    data: any; 
    timestamp: number; 
    ttl: number; 
    etag?: string;
  }>();

  get(key: string): { data: any; isExpired: boolean } | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    return { data: item.data, isExpired };
  }

  set(key: string, data: any, ttl: number = 300000, etag?: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      etag
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify([...this.cache.entries()]).length
    };
  }
}

const globalCache = new EnhancedApiCache();

// Main enhanced API hook
export function useEnhancedApi<T = any>(options: EnhancedApiOptions = {}) {
  const {
    enableCache = true,
    cacheTtl = 300000, // 5 minutes
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 1000,
    enableToast = true,
    toastOnSuccess,
    toastOnError = true,
    enableErrorReporting = true,
    context = {}
  } = options;

  const [state, setState] = useState<EnhancedApiState<T>>({
    data: null,
    loading: false,
    error: null,
    isFromCache: false,
    retryCount: 0,
    lastFetch: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const { showSuccess, showError } = useToast();
  const { showApiError, showNetworkError } = useErrorToast();

  // Execute API request with all enhancements
  const execute = useCallback(async (
    url: string, 
    requestOptions: RequestInit = {},
    cacheKey?: string
  ): Promise<T | null> => {
    const effectiveCacheKey = cacheKey || url;

    // Check cache first
    if (enableCache && effectiveCacheKey) {
      const cached = globalCache.get(effectiveCacheKey);
      if (cached && !cached.isExpired) {
        setState(prev => ({
          ...prev,
          data: cached.data,
          loading: false,
          error: null,
          isFromCache: true,
          lastFetch: new Date()
        }));
        return cached.data;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      isFromCache: false
    }));

    const requestWithRetry = async (): Promise<T> => {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

      const response = await fetch(fullUrl, {
        ...requestOptions,
        signal: abortControllerRef.current?.signal,
        headers: {
          'Content-Type': 'application/json',
          ...requestOptions.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data: T = await response.json();
      return data;
    };

    try {
      let result: T;

      if (enableRetry) {
        result = await RetryManager.withRetry(requestWithRetry, {
          maxAttempts: maxRetries,
          baseDelay: retryDelay,
          shouldRetry: (error: AppError) => isRetryableError(error),
          onRetry: (attempt, error) => {
            setState(prev => ({ 
              ...prev, 
              retryCount: attempt,
              error 
            }));
            
            if (enableToast && attempt === 1) {
              showError(`Request failed, retrying... (${attempt}/${maxRetries})`, {
                duration: 2000
              });
            }
          }
        });
      } else {
        result = await requestWithRetry();
      }

      // Cache successful response
      if (enableCache && effectiveCacheKey) {
        globalCache.set(effectiveCacheKey, result, cacheTtl);
      }

      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        retryCount: 0,
        lastFetch: new Date()
      }));

      // Success toast
      if (enableToast && toastOnSuccess) {
        showSuccess(toastOnSuccess);
      }

      return result;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }

      const classifiedError = ErrorClassifier.classifyError(error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: classifiedError,
        data: null,
        lastFetch: new Date()
      }));

      // Error reporting
      if (enableErrorReporting) {
        ErrorReporter.reportError(classifiedError, {
          ...context,
          url,
          requestOptions: JSON.stringify(requestOptions),
          cacheKey: effectiveCacheKey
        });
      }

      // Error toast
      if (enableToast && toastOnError) {
        if (isNetworkError(classifiedError)) {
          showNetworkError();
        } else {
          showApiError(classifiedError);
        }
      }

      throw classifiedError;
    }
  }, [
    enableCache, cacheTtl, enableRetry, maxRetries, retryDelay,
    enableToast, toastOnSuccess, toastOnError, enableErrorReporting,
    context, showSuccess, showError, showApiError, showNetworkError
  ]);

  // Refresh function that bypasses cache
  const refresh = useCallback(async (
    url: string, 
    requestOptions: RequestInit = {},
    cacheKey?: string
  ) => {
    const effectiveCacheKey = cacheKey || url;
    
    // Invalidate cache
    if (enableCache && effectiveCacheKey) {
      globalCache.invalidate(effectiveCacheKey);
    }

    return execute(url, requestOptions, cacheKey);
  }, [execute, enableCache]);

  // Cancel function
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // Reset function
  const reset = useCallback(() => {
    cancel();
    setState({
      data: null,
      loading: false,
      error: null,
      isFromCache: false,
      retryCount: 0,
      lastFetch: null
    });
  }, [cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    ...state,
    execute,
    refresh,
    cancel,
    reset,
    // Cache utilities
    clearCache: () => globalCache.invalidate(),
    getCacheStats: () => globalCache.getStats()
  };
}

// Specialized hook for stock analysis
export function useEnhancedStockAnalysis() {
  const api = useEnhancedApi({
    cacheTtl: 300000, // 5 minutes
    maxRetries: 3,
    toastOnSuccess: 'Analysis completed successfully!',
    context: {
      component: 'StockAnalysis',
      feature: 'analysis'
    }
  });

  const analyzeStock = useCallback(async (symbol: string) => {
    if (!symbol?.trim()) {
      throw new Error('Stock symbol is required');
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    return api.execute(
      `/api/analyze/${normalizedSymbol}`,
      {},
      `analysis_${normalizedSymbol}`
    );
  }, [api]);

  return {
    ...api,
    analyzeStock
  };
}

// Specialized hook for stock data
export function useEnhancedStockData() {
  const api = useEnhancedApi({
    cacheTtl: 60000, // 1 minute for real-time data
    maxRetries: 2,
    context: {
      component: 'StockData',
      feature: 'market-data'
    }
  });

  const getStockData = useCallback(async (symbol: string, days: number = 30) => {
    if (!symbol?.trim()) {
      throw new Error('Stock symbol is required');
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    return api.execute(
      `/api/stock/${normalizedSymbol}?days=${days}`,
      {},
      `stock_data_${normalizedSymbol}_${days}`
    );
  }, [api]);

  return {
    ...api,
    getStockData
  };
}

// Specialized hook for social media data
export function useEnhancedSocialData() {
  const api = useEnhancedApi({
    cacheTtl: 180000, // 3 minutes
    maxRetries: 2,
    context: {
      component: 'SocialData',
      feature: 'social-media'
    }
  });

  const getSocialData = useCallback(async (
    symbol: string, 
    platform: 'reddit' | 'x' = 'reddit', 
    limit: number = 50
  ) => {
    if (!symbol?.trim()) {
      throw new Error('Stock symbol is required');
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    return api.execute(
      `/api/${platform}/${normalizedSymbol}?limit=${limit}`,
      {},
      `social_${platform}_${normalizedSymbol}_${limit}`
    );
  }, [api]);

  return {
    ...api,
    getSocialData
  };
}

// Hook for batch operations
export function useEnhancedBatchApi() {
  const [states, setStates] = useState<Record<string, EnhancedApiState<any>>>({});
  const { showError, showSuccess } = useToast();

  const executeBatch = useCallback(async (
    requests: Array<{
      key: string;
      url: string;
      options?: RequestInit;
      cacheKey?: string;
    }>,
    options: EnhancedApiOptions = {}
  ) => {
    // Initialize states
    const initialStates = requests.reduce((acc, req) => {
      acc[req.key] = {
        data: null,
        loading: true,
        error: null,
        isFromCache: false,
        retryCount: 0,
        lastFetch: null
      };
      return acc;
    }, {} as Record<string, EnhancedApiState<any>>);

    setStates(initialStates);

    // Execute all requests in parallel
    const results = await Promise.allSettled(
      requests.map(async (req) => {
        const api = useEnhancedApi({
          ...options,
          enableToast: false // Disable individual toasts for batch
        });
        
        try {
          const result = await api.execute(req.url, req.options, req.cacheKey);
          return { key: req.key, success: true, data: result };
        } catch (error) {
          return { key: req.key, success: false, error };
        }
      })
    );

    // Update states with results
    const finalStates = { ...initialStates };
    let successCount = 0;
    let errorCount = 0;

    results.forEach((result, index) => {
      const key = requests[index].key;
      
      if (result.status === 'fulfilled') {
        const { success, data, error } = result.value;
        if (success) {
          finalStates[key] = {
            ...finalStates[key],
            data,
            loading: false,
            error: null,
            lastFetch: new Date()
          };
          successCount++;
        } else {
          finalStates[key] = {
            ...finalStates[key],
            loading: false,
            error: ErrorClassifier.classifyError(error),
            lastFetch: new Date()
          };
          errorCount++;
        }
      } else {
        finalStates[key] = {
          ...finalStates[key],
          loading: false,
          error: ErrorClassifier.classifyError(result.reason),
          lastFetch: new Date()
        };
        errorCount++;
      }
    });

    setStates(finalStates);

    // Show batch completion toast
    if (options.enableToast !== false) {
      if (errorCount === 0) {
        showSuccess(`All ${successCount} requests completed successfully`);
      } else if (successCount > 0) {
        showError(`${successCount} succeeded, ${errorCount} failed`);
      } else {
        showError(`All ${errorCount} requests failed`);
      }
    }

    return finalStates;
  }, [showError, showSuccess]);

  return {
    states,
    executeBatch,
    isLoading: Object.values(states).some(state => state.loading),
    hasErrors: Object.values(states).some(state => state.error),
    allData: Object.fromEntries(
      Object.entries(states).map(([key, state]) => [key, state.data])
    )
  };
}