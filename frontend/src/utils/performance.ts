/**
 * Performance Monitoring and Optimization Utilities
 * 
 * Provides tools for measuring and optimizing React component performance
 * including render tracking, memory usage, and bundle size optimization.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage: number;
  componentName: string;
}

// Global performance store
class PerformanceStore {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: ((metrics: PerformanceMetrics[]) => void)[] = [];

  addMetric(name: string, renderTime: number) {
    const existing = this.metrics.get(name);
    
    if (existing) {
      const newRenderCount = existing.renderCount + 1;
      const newAverageRenderTime = 
        (existing.averageRenderTime * existing.renderCount + renderTime) / newRenderCount;
      
      this.metrics.set(name, {
        ...existing,
        renderCount: newRenderCount,
        lastRenderTime: renderTime,
        averageRenderTime: newAverageRenderTime,
        memoryUsage: this.getMemoryUsage()
      });
    } else {
      this.metrics.set(name, {
        renderCount: 1,
        lastRenderTime: renderTime,
        averageRenderTime: renderTime,
        memoryUsage: this.getMemoryUsage(),
        componentName: name
      });
    }

    this.notifyObservers();
  }

  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }

  subscribe(callback: (metrics: PerformanceMetrics[]) => void) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers() {
    const metrics = this.getMetrics();
    this.observers.forEach(callback => callback(metrics));
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  clear() {
    this.metrics.clear();
    this.notifyObservers();
  }
}

export const performanceStore = new PerformanceStore();

// Hook to measure component render performance
export function useRenderPerformance(componentName: string, enabled: boolean = true) {
  const renderStartRef = useRef<number>();
  const renderCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartRef.current = performance.now();
    renderCountRef.current += 1;
  });

  useEffect(() => {
    if (!enabled || !renderStartRef.current) return;

    const renderTime = performance.now() - renderStartRef.current;
    performanceStore.addMetric(componentName, renderTime);
  });

  return {
    renderCount: renderCountRef.current,
    getMetrics: () => performanceStore.getMetric(componentName)
  };
}

// Hook to detect slow renders
export function useSlowRenderDetection(
  componentName: string,
  threshold: number = 16, // 60fps threshold
  onSlowRender?: (renderTime: number) => void
) {
  const renderStartRef = useRef<number>();

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    if (!renderStartRef.current) return;

    const renderTime = performance.now() - renderStartRef.current;
    
    if (renderTime > threshold) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      onSlowRender?.(renderTime);
    }
  });
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  const ref = useCallback((el: Element | null) => {
    setElement(el);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element, options]);

  return [ref, isIntersecting];
}

// Bundle size analyzer (for development)
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  const sizes = {
    totalScripts: 0,
    totalStylesheets: 0,
    resources: [] as { url: string; size: number; type: string }[]
  };

  // Use Performance API to get resource sizes
  if ('getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach(resource => {
      const size = resource.transferSize || resource.encodedBodySize || 0;
      sizes.resources.push({
        url: resource.name,
        size,
        type: resource.initiatorType
      });

      if (resource.initiatorType === 'script') {
        sizes.totalScripts += size;
      } else if (resource.initiatorType === 'link') {
        sizes.totalStylesheets += size;
      }
    });
  }

  return sizes;
}

// Memory leak detection
export function useMemoryLeakDetection(componentName: string) {
  const mountTimeRef = useRef<number>();
  const initialMemoryRef = useRef<number>();

  useEffect(() => {
    mountTimeRef.current = Date.now();
    if ('memory' in performance) {
      initialMemoryRef.current = (performance as any).memory.usedJSHeapSize;
    }

    return () => {
      if (!mountTimeRef.current || !initialMemoryRef.current) return;

      const mountDuration = Date.now() - mountTimeRef.current;
      
      if ('memory' in performance) {
        const finalMemory = (performance as any).memory.usedJSHeapSize;
        const memoryDiff = finalMemory - initialMemoryRef.current;
        
        // If component was mounted for more than 10 seconds and memory increased by more than 10MB
        if (mountDuration > 10000 && memoryDiff > 10 * 1024 * 1024) {
          console.warn(`Potential memory leak detected in ${componentName}:`, {
            mountDuration: mountDuration / 1000 + 's',
            memoryIncrease: (memoryDiff / (1024 * 1024)).toFixed(2) + 'MB'
          });
        }
      }
    };
  }, [componentName]);
}

// Performance debugging component
export function PerformanceDebugger({ enabled = false }: { enabled?: boolean }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    return performanceStore.subscribe(setMetrics);
  }, [enabled]);

  if (!enabled || typeof window === 'undefined') return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-2 rounded-lg text-xs"
        style={{ fontFamily: 'monospace' }}
      >
        {isVisible ? '📊 Hide' : '📊 Perf'}
      </button>

      {/* Performance panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-black/90 text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto text-xs"
             style={{ fontFamily: 'monospace' }}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Performance Metrics</h3>
            <button
              onClick={() => performanceStore.clear()}
              className="bg-red-600 px-2 py-1 rounded text-xs"
            >
              Clear
            </button>
          </div>
          
          {metrics.length === 0 ? (
            <p className="text-gray-400">No metrics yet...</p>
          ) : (
            <div className="space-y-2">
              {metrics.map(metric => (
                <div key={metric.componentName} className="border-b border-gray-600 pb-2">
                  <div className="font-semibold text-blue-300">{metric.componentName}</div>
                  <div>Renders: {metric.renderCount}</div>
                  <div>Last: {metric.lastRenderTime.toFixed(2)}ms</div>
                  <div>Avg: {metric.averageRenderTime.toFixed(2)}ms</div>
                  <div>Memory: {metric.memoryUsage.toFixed(1)}MB</div>
                </div>
              ))}
              
              {/* Overall stats */}
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="font-semibold text-green-300">Overall</div>
                <div>Total Components: {metrics.length}</div>
                <div>Total Renders: {metrics.reduce((sum, m) => sum + m.renderCount, 0)}</div>
                <div>Avg Render Time: {(metrics.reduce((sum, m) => sum + m.averageRenderTime, 0) / metrics.length).toFixed(2)}ms</div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Web Vitals measurement
export function measureWebVitals() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log('LCP:', entry.startTime);
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP observation not supported');
  }

  // First Input Delay (FID) and Cumulative Layout Shift (CLS)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('FID:', (entry as any).processingStart - entry.startTime);
    }
  });

  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('FID observation not supported');
  }
}

// Bundle analyzer for production builds
export function logBundleStats() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return;

  setTimeout(() => {
    const bundleStats = analyzeBundleSize();
    if (bundleStats) {
      console.group('📦 Bundle Analysis');
      console.log('Total Scripts:', (bundleStats.totalScripts / 1024).toFixed(2) + 'KB');
      console.log('Total Stylesheets:', (bundleStats.totalStylesheets / 1024).toFixed(2) + 'KB');
      console.log('Top 5 Largest Resources:');
      
      bundleStats.resources
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)
        .forEach((resource, i) => {
          console.log(`${i + 1}. ${resource.url.split('/').pop()} - ${(resource.size / 1024).toFixed(2)}KB`);
        });
      
      console.groupEnd();
    }
  }, 2000);
}