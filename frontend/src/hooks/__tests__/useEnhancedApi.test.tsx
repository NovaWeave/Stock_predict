import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnhancedApi, useEnhancedStockAnalysis, useEnhancedStockData } from '../useEnhancedApi';
import { ToastProvider } from '../../components/Toast';
import { AppError, ErrorType, ErrorSeverity } from '../../utils/errorHandling';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock environment variable
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:5000';

// Wrapper component for hooks that need ToastProvider
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('useEnhancedApi Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    // Clear any existing timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isFromCache).toBe(false);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.lastFetch).toBeNull();
    });

    it('provides all necessary methods', () => {
      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      expect(typeof result.current.execute).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.clearCache).toBe('function');
      expect(typeof result.current.getCacheStats).toBe('function');
    });
  });

  describe('Successful API calls', () => {
    it('executes successful API call', async () => {
      const mockData = { success: true, data: 'test data' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      await act(async () => {
        const response = await result.current.execute('/api/test');
        expect(response).toEqual(mockData);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastFetch).toBeInstanceOf(Date);
    });

    it('constructs full URL correctly', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('handles absolute URLs correctly', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      await act(async () => {
        await result.current.execute('https://external-api.com/data');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://external-api.com/data',
        expect.any(Object)
      );
    });
  });

  describe('Error handling', () => {
    it('handles HTTP errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Resource not found',
      });

      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      await act(async () => {
        try {
          await result.current.execute('/api/test');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
      expect(result.current.data).toBeNull();
    });

    it('handles network errors correctly', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      await act(async () => {
        try {
          await result.current.execute('/api/test');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });

    it('handles aborted requests correctly', async () => {
      mockFetch.mockRejectedValueOnce(new Error('AbortError'));

      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      await act(async () => {
        const promise = result.current.execute('/api/test');
        result.current.cancel();
        
        try {
          await promise;
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Caching functionality', () => {
    it('caches successful responses', async () => {
      const mockData = { success: true, data: 'cached data' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useEnhancedApi({ enableCache: true }), {
        wrapper: Wrapper
      });

      // First call
      await act(async () => {
        await result.current.execute('/api/test', {}, 'test-cache-key');
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call with same cache key should use cache
      await act(async () => {
        await result.current.execute('/api/test', {}, 'test-cache-key');
      });

      expect(mockFetch).toHaveBeenCalledTimes(1); // Should not call fetch again
      expect(result.current.isFromCache).toBe(true);
    });

    it('bypasses cache when disabled', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useEnhancedApi({ enableCache: false }), {
        wrapper: Wrapper
      });

      // First call
      await act(async () => {
        await result.current.execute('/api/test');
      });

      // Second call should make another fetch
      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('refreshes bypasses cache', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useEnhancedApi({ enableCache: true }), {
        wrapper: Wrapper
      });

      // Initial call
      await act(async () => {
        await result.current.execute('/api/test', {}, 'test-key');
      });

      // Refresh should bypass cache
      await act(async () => {
        await result.current.refresh('/api/test', {}, 'test-key');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry mechanism', () => {
    it('retries failed requests when enabled', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() => 
        useEnhancedApi({ 
          enableRetry: true, 
          maxRetries: 3,
          retryDelay: 100 
        }), {
        wrapper: Wrapper
      });

      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.current.data).toEqual({ success: true });
    });

    it('does not retry when disabled', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => 
        useEnhancedApi({ enableRetry: false }), {
        wrapper: Wrapper
      });

      await act(async () => {
        try {
          await result.current.execute('/api/test');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('updates retry count during retries', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() => 
        useEnhancedApi({ 
          enableRetry: true, 
          maxRetries: 3,
          retryDelay: 10 
        }), {
        wrapper: Wrapper
      });

      let retryCountDuringRetry = 0;

      await act(async () => {
        const promise = result.current.execute('/api/test');
        
        // Check retry count after first failure
        setTimeout(() => {
          retryCountDuringRetry = result.current.retryCount;
        }, 50);
        
        await promise;
      });

      expect(retryCountDuringRetry).toBeGreaterThan(0);
      expect(result.current.retryCount).toBe(0); // Reset after success
    });
  });

  describe('Loading states', () => {
    it('sets loading state during API call', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true }),
        }), 100))
      );

      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      await act(async () => {
        const promise = result.current.execute('/api/test');
        
        // Should be loading during request
        expect(result.current.loading).toBe(true);
        
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Reset functionality', () => {
    it('resets state correctly', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      // Make a request first
      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(result.current.data).toEqual(mockData);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.retryCount).toBe(0);
      expect(result.current.lastFetch).toBeNull();
    });
  });

  describe('Cache management', () => {
    it('provides cache statistics', () => {
      const { result } = renderHook(() => useEnhancedApi(), {
        wrapper: Wrapper
      });

      const stats = result.current.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('totalMemory');
      expect(typeof stats.size).toBe('number');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('clears cache correctly', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useEnhancedApi({ enableCache: true }), {
        wrapper: Wrapper
      });

      // Add something to cache
      await act(async () => {
        await result.current.execute('/api/test', {}, 'test-key');
      });

      // Clear cache
      act(() => {
        result.current.clearCache();
      });

      // Next call should fetch again
      await act(async () => {
        await result.current.execute('/api/test', {}, 'test-key');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useEnhancedStockAnalysis Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('analyzes stock correctly', async () => {
    const mockData = { 
      stock_symbol: 'AAPL',
      success: true,
      analysis: 'bullish'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useEnhancedStockAnalysis(), {
      wrapper: Wrapper
    });

    await act(async () => {
      const response = await result.current.analyzeStock('AAPL');
      expect(response).toEqual(mockData);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/analyze/AAPL',
      expect.any(Object)
    );
  });

  it('normalizes stock symbol to uppercase', async () => {
    const mockData = { success: true };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useEnhancedStockAnalysis(), {
      wrapper: Wrapper
    });

    await act(async () => {
      await result.current.analyzeStock('aapl');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/analyze/AAPL',
      expect.any(Object)
    );
  });

  it('throws error for empty symbol', async () => {
    const { result } = renderHook(() => useEnhancedStockAnalysis(), {
      wrapper: Wrapper
    });

    await act(async () => {
      try {
        await result.current.analyzeStock('');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Stock symbol is required');
      }
    });
  });
});

describe('useEnhancedStockData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('gets stock data correctly', async () => {
    const mockData = { 
      symbol: 'AAPL',
      price: 150.25,
      change: 2.50
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useEnhancedStockData(), {
      wrapper: Wrapper
    });

    await act(async () => {
      const response = await result.current.getStockData('AAPL', 30);
      expect(response).toEqual(mockData);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/stock/AAPL?days=30',
      expect.any(Object)
    );
  });

  it('uses default days parameter', async () => {
    const mockData = { success: true };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useEnhancedStockData(), {
      wrapper: Wrapper
    });

    await act(async () => {
      await result.current.getStockData('AAPL');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/stock/AAPL?days=30',
      expect.any(Object)
    );
  });
});

describe('Hook cleanup', () => {
  it('cancels requests on unmount', async () => {
    mockFetch.mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AbortError')), 100)
      )
    );

    const { result, unmount } = renderHook(() => useEnhancedApi(), {
      wrapper: Wrapper
    });

    // Start a request
    act(() => {
      result.current.execute('/api/test');
    });

    // Unmount before request completes
    unmount();

    // Should not throw or cause issues
    expect(() => unmount()).not.toThrow();
  });
});