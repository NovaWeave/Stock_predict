/**
 * Test Utilities
 * 
 * Common utilities and helpers for testing React components,
 * hooks, and utilities with proper setup and teardown.
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ToastProvider } from '@/components/Toast';
import { AppProviders } from '@/components/AppProviders';

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withToast?: boolean;
  withProviders?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { withToast = true, withProviders = false, ...renderOptions } = options;

  let Wrapper: React.ComponentType<{ children: React.ReactNode }>;

  if (withProviders) {
    Wrapper = ({ children }) => <AppProviders>{children}</AppProviders>;
  } else if (withToast) {
    Wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
  } else {
    Wrapper = ({ children }) => <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Common test selectors
export const testSelectors = {
  stockAnalysisContainer: '[data-testid="stock-analysis-container"]',
  sentimentChart: '[data-testid="sentiment-chart"]',
  loadingSpinner: '[data-testid="loading-spinner"]',
  errorMessage: '[data-testid="error-message"]',
  analyzeButton: '[data-testid="analyze-button"]',
  stockInput: '[data-testid="stock-input"]',
};

// Test helper functions
export const testHelpers = {
  /**
   * Wait for loading to complete
   */
  waitForLoadingToComplete: async () => {
    // Implementation depends on your loading patterns
    await new Promise(resolve => setTimeout(resolve, 100));
  },

  /**
   * Simulate API delay
   */
  simulateApiDelay: async (ms: number = 500) => {
    await new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Generate random stock symbol for testing
   */
  generateRandomStockSymbol: (): string => {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
    return symbols[Math.floor(Math.random() * symbols.length)];
  },
};

// Export test utilities
export { testSelectors as selectors, testHelpers as helpers };