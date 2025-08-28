/**
 * Custom Hooks for Stock Sentiment Analyzer
 * 
 * Provides reusable hooks for API calls, state management,
 * and common functionality with proper TypeScript support.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ApiResponse,
  AnalysisResponse,
  StockDataResponse,
  TrendPredictionResponse,
  ApiRequestState,
  DEFAULT_API_REQUEST_STATE,
  isSuccessResponse,
  ApiError
} from '@/types';

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * Custom hook for making API requests with proper error handling
 */
export function useApiRequest<T>() {
  const [state, setState] = useState<ApiRequestState>(DEFAULT_API_REQUEST_STATE);
  const [data, setData] = useState<T | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const makeRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<T | null> => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setState({ isLoading: true, hasError: false });

    try {
      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new ApiError(
          `HTTP error! status: ${response.status}`,
          'HTTP_ERROR',
          response.status
        );
      }

      const jsonData: ApiResponse<T> = await response.json();

      if (isSuccessResponse(jsonData)) {
        setData(jsonData.data);
        setState({ isLoading: false, hasError: false });
        return jsonData.data;
      } else {
        throw new ApiError(
          jsonData.error.message,
          jsonData.error.code,
          undefined,
          jsonData.error.details
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, don't update state
        return null;
      }

      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';

      const errorCode = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR';

      setState({
        isLoading: false,
        hasError: true,
        message: errorMessage,
        code: errorCode,
      });

      setData(null);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_API_REQUEST_STATE);
    setData(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    data,
    makeRequest,
    reset,
  };
}

/**
 * Hook for analyzing stocks with caching
 */
export function useStockAnalysis() {
  const apiRequest = useApiRequest<AnalysisResponse['data']>();
  const [cache, setCache] = useState<Map<string, {
    data: AnalysisResponse['data'];
    timestamp: number;
  }>>(new Map());

  const analyzeStock = useCallback(async (symbol: string) => {
    if (!symbol.trim()) {
      return null;
    }

    const normalizedSymbol = symbol.toUpperCase().trim();

    // Check cache first (5 minutes TTL)
    const cacheKey = normalizedSymbol;
    const cached = cache.get(cacheKey);
    const now = Date.now();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Make API request
    const result = await apiRequest.makeRequest(`/api/analyze/${normalizedSymbol}`);

    if (result) {
      // Update cache
      setCache(prev => new Map(prev).set(cacheKey, {
        data: result,
        timestamp: now,
      }));
    }

    return result;
  }, [apiRequest, cache]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    ...apiRequest,
    analyzeStock,
    clearCache,
  };
}

/**
 * Hook for fetching stock data only
 */
export function useStockData() {
  const apiRequest = useApiRequest<StockDataResponse['data']>();

  const fetchStockData = useCallback(async (symbol: string, days: number = 30) => {
    if (!symbol.trim()) {
      return null;
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    return apiRequest.makeRequest(`/api/stock/${normalizedSymbol}?days=${days}`);
  }, [apiRequest]);

  return {
    ...apiRequest,
    fetchStockData,
  };
}

/**
 * Hook for trend prediction
 */
export function useTrendPrediction() {
  const apiRequest = useApiRequest<TrendPredictionResponse['data']>();

  const getTrend = useCallback(async (symbol: string) => {
    if (!symbol.trim()) {
      return null;
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    return apiRequest.makeRequest(`/api/trend/${normalizedSymbol}`);
  }, [apiRequest]);

  return {
    ...apiRequest,
    getTrend,
  };
}

/**
 * Hook for input validation
 */
export function useStockSymbolValidator() {
  const validateSymbol = useCallback((symbol: string): {
    isValid: boolean;
    error?: string;
  } => {
    if (!symbol) {
      return { isValid: false, error: 'Stock symbol is required' };
    }

    const trimmed = symbol.trim();
    
    if (trimmed.length < 1) {
      return { isValid: false, error: 'Stock symbol cannot be empty' };
    }

    if (trimmed.length > 10) {
      return { isValid: false, error: 'Stock symbol must be 10 characters or less' };
    }

    if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
      return { isValid: false, error: 'Stock symbol must contain only letters and numbers' };
    }

    return { isValid: true };
  }, []);

  return { validateSymbol };
}

/**
 * Hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for managing form state
 */
export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const updateField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    setState(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const setError = useCallback(<K extends keyof T>(
    field: K,
    message: string
  ) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    clearErrors();
  }, [initialState, clearErrors]);

  return {
    state,
    errors,
    updateField,
    setError,
    clearErrors,
    reset,
    hasErrors: Object.keys(errors).length > 0,
  };
}

/**
 * Hook for local storage with TypeScript support
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}