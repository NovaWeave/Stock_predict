'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Cache implementation for API responses
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const apiCache = new ApiCache();

// Request deduplication - prevent duplicate requests for same data
class RequestDeduplicator {
  private activeRequests = new Map<string, Promise<any>>();
  
  async request<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already in progress, return the existing promise
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key)!;
    }
    
    // Create new request
    const request = requestFn().finally(() => {
      // Clean up after request completes
      this.activeRequests.delete(key);
    });
    
    this.activeRequests.set(key, request);
    return request;
  }
  
  clear(): void {
    this.activeRequests.clear();
  }
}

const requestDeduplicator = new RequestDeduplicator();

interface UseApiOptions {
  cacheKey?: string;
  cacheTtl?: number; // Cache time-to-live in milliseconds
  enabled?: boolean; // Whether to auto-fetch on mount
  retryAttempts?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isFromCache: boolean;
}

export function useOptimizedApi<T = any>(
  url: string | null,
  options: UseApiOptions = {}
) {
  const {
    cacheKey = url || '',
    cacheTtl = 300000, // 5 minutes
    enabled = true,
    retryAttempts = 2,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    isFromCache: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Optimized fetch function with caching and retry logic
  const fetchData = useCallback(async (
    fetchUrl: string,
    attempt: number = 0
  ): Promise<T> => {
    // Check cache first
    if (cacheKey) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        setState(prev => ({
          ...prev,
          data: cachedData,
          loading: false,
          error: null,
          isFromCache: true
        }));
        onSuccess?.(cachedData);
        return cachedData;
      }
    }

    // Create abort controller for request cancellation
    abortControllerRef.current = new AbortController();

    try {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        isFromCache: false
      }));

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const fullUrl = fetchUrl.startsWith('http') ? fetchUrl : `${API_BASE}${fetchUrl}`;

      // Use request deduplication
      const response = await requestDeduplicator.request(
        cacheKey,
        () => fetch(fullUrl, {
          signal: abortControllerRef.current?.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: T = await response.json();

      // Cache successful response
      if (cacheKey) {
        apiCache.set(cacheKey, data, cacheTtl);
      }

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        error: null,
        isFromCache: false
      }));

      onSuccess?.(data);
      return data;

    } catch (error: any) {
      // Don't handle aborted requests as errors
      if (error.name === 'AbortError') {
        return Promise.reject(error);
      }

      // Retry logic
      if (attempt < retryAttempts) {
        console.warn(`Request failed (attempt ${attempt + 1}/${retryAttempts + 1}):`, error.message);
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(fetchUrl, attempt + 1);
        }, retryDelay * Math.pow(2, attempt)); // Exponential backoff
        
        return Promise.reject(error);
      }

      // Final error state
      const finalError = error instanceof Error ? error : new Error(String(error));
      setState(prev => ({
        ...prev,
        loading: false,
        error: finalError,
        isFromCache: false
      }));

      onError?.(finalError);
      throw finalError;
    }
  }, [cacheKey, cacheTtl, retryAttempts, retryDelay, onSuccess, onError]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    if (!url) return null;
    
    // Clear cache for this key before refetching
    if (cacheKey) {
      apiCache.set(cacheKey, null, 0); // Expire immediately
    }
    
    return fetchData(url);
  }, [url, fetchData, cacheKey]);

  // Cancel ongoing requests
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setState(prev => ({
      ...prev,
      loading: false
    }));
  }, []);

  // Auto-fetch on mount and URL change
  useEffect(() => {
    if (url && enabled) {
      fetchData(url).catch(() => {
        // Error already handled in fetchData
      });
    }

    // Cleanup on unmount or URL change
    return () => {
      cancel();
    };
  }, [url, enabled, fetchData, cancel]);

  return {
    ...state,
    refetch,
    cancel,
    // Cache utilities
    clearCache: () => apiCache.clear(),
    getCacheSize: () => apiCache.size()
  };
}

// Specialized hook for stock analysis with optimizations
export function useStockAnalysis(symbol: string | null) {
  const cacheKey = symbol ? `analysis_${symbol.toLowerCase()}` : null;
  
  return useOptimizedApi(
    symbol ? `/api/analyze/${symbol.toUpperCase()}` : null,
    {
      cacheKey,
      cacheTtl: 300000, // 5 minutes cache
      enabled: !!symbol,
      retryAttempts: 3,
      retryDelay: 2000,
    }
  );
}

// Hook for real-time data with shorter cache
export function useStockData(symbol: string | null, days: number = 30) {
  const cacheKey = symbol ? `stock_data_${symbol.toLowerCase()}_${days}` : null;
  
  return useOptimizedApi(
    symbol ? `/api/stock/${symbol.toUpperCase()}?days=${days}` : null,
    {
      cacheKey,
      cacheTtl: 60000, // 1 minute cache for more real-time data
      enabled: !!symbol,
      retryAttempts: 2,
    }
  );
}

// Hook for social media data
export function useSocialData(symbol: string | null, platform: 'reddit' | 'x' = 'reddit', limit: number = 50) {
  const cacheKey = symbol ? `social_${platform}_${symbol.toLowerCase()}_${limit}` : null;
  
  return useOptimizedApi(
    symbol ? `/api/${platform}/${symbol.toUpperCase()}?limit=${limit}` : null,
    {
      cacheKey,
      cacheTtl: 180000, // 3 minutes cache for social data
      enabled: !!symbol,
      retryAttempts: 2,
    }
  );
}

// Batch API requests hook - for loading multiple endpoints efficiently
export function useBatchApi<T extends Record<string, any>>(
  requests: Record<string, string | null>,
  options: Omit<UseApiOptions, 'cacheKey'> = {}
) {
  const [states, setStates] = useState<Record<string, ApiState<any>>>({});
  
  const keys = Object.keys(requests);
  const enabledRequests = keys.filter(key => requests[key] !== null);
  
  // Initialize states
  useEffect(() => {
    const initialStates = keys.reduce((acc, key) => {
      acc[key] = {
        data: null,
        loading: false,
        error: null,
        isFromCache: false
      };
      return acc;
    }, {} as Record<string, ApiState<any>>);
    
    setStates(initialStates);
  }, [keys.join(',')]);

  // Individual API hooks for each request
  const apiHooks = enabledRequests.map(key => ({
    key,
    hook: useOptimizedApi(requests[key], {
      ...options,
      cacheKey: `batch_${key}_${requests[key]}`,
    })
  }));

  // Update combined state when individual hooks change
  useEffect(() => {
    const newStates = { ...states };
    
    apiHooks.forEach(({ key, hook }) => {
      newStates[key] = {
        data: hook.data,
        loading: hook.loading,
        error: hook.error,
        isFromCache: hook.isFromCache
      };
    });
    
    setStates(newStates);
  }, [apiHooks.map(h => [h.hook.data, h.hook.loading, h.hook.error].join(',')).join('|')]);

  const isLoading = Object.values(states).some(state => state.loading);
  const hasErrors = Object.values(states).some(state => state.error);
  const allData = Object.fromEntries(
    Object.entries(states).map(([key, state]) => [key, state.data])
  ) as T;

  return {
    data: allData,
    states,
    loading: isLoading,
    hasErrors,
    refetchAll: () => {
      apiHooks.forEach(({ hook }) => hook.refetch());
    }
  };
}