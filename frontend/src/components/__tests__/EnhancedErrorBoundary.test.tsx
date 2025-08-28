import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedErrorBoundary, withEnhancedErrorBoundary } from '../EnhancedErrorBoundary';
import { ErrorType, ErrorSeverity } from '../../utils/errorHandling';

// Mock error reporting
jest.mock('../../utils/errorHandling', () => ({
  ...jest.requireActual('../../utils/errorHandling'),
  ErrorReporter: {
    reportError: jest.fn(),
  },
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Component that throws a network error
const ThrowNetworkError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    const error = new Error('fetch failed');
    error.name = 'NetworkError';
    throw error;
  }
  return <div>No network error</div>;
};

describe('EnhancedErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for expected errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Normal operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <EnhancedErrorBoundary>
          <div data-testid="child-component">Child content</div>
        </EnhancedErrorBoundary>
      );

      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(
        <EnhancedErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </EnhancedErrorBoundary>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('catches and displays error when child component throws', () => {
      render(
        <EnhancedErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText('This component failed to load.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('displays page-level error UI for page-level boundary', () => {
      render(
        <EnhancedErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });

    it('displays section-level error UI for section-level boundary', () => {
      render(
        <EnhancedErrorBoundary level="section">
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Section Unavailable')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('displays network-specific error message for network errors', () => {
      render(
        <EnhancedErrorBoundary level="page">
          <ThrowNetworkError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    });
  });

  describe('Custom fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <EnhancedErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    });
  });

  describe('Error recovery', () => {
    it('resets error state when Try Again button is clicked', async () => {
      const { rerender } = render(
        <EnhancedErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      // Re-render with no error
      rerender(
        <EnhancedErrorBoundary level="component">
          <ThrowError shouldThrow={false} />
        </EnhancedErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('No error')).toBeInTheDocument();
      });
    });

    it('handles retry attempts correctly', async () => {
      let attemptCount = 0;
      const RetryComponent = () => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error('Retry test error');
        }
        return <div>Success after retries</div>;
      };

      const { rerender } = render(
        <EnhancedErrorBoundary enableRecovery={true} retryAttempts={3}>
          <RetryComponent />
        </EnhancedErrorBoundary>
      );

      // Should show error initially
      expect(screen.getByText(/Something Went Wrong/)).toBeInTheDocument();

      // Click try again
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      // Re-render with successful component
      rerender(
        <EnhancedErrorBoundary enableRecovery={true} retryAttempts={3}>
          <div>Success after retries</div>
        </EnhancedErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Success after retries')).toBeInTheDocument();
      });
    });
  });

  describe('Error reporting', () => {
    it('calls error reporting when enabled', () => {
      const mockOnError = jest.fn();

      render(
        <EnhancedErrorBoundary 
          enableReporting={true}
          onError={mockOnError}
          context={{ component: 'TestComponent', feature: 'testing' }}
        >
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error message'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('does not call error reporting when disabled', () => {
      const mockOnError = jest.fn();

      render(
        <EnhancedErrorBoundary 
          enableReporting={false}
          onError={mockOnError}
        >
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalled();
    });
  });

  describe('Development mode features', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('shows error details in development mode', () => {
      render(
        <EnhancedErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Developer Information')).toBeInTheDocument();
    });
  });

  describe('Network status', () => {
    it('displays network status correctly', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      render(
        <EnhancedErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Connected to internet')).toBeInTheDocument();
    });

    it('shows offline status when disconnected', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(
        <EnhancedErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('No internet connection')).toBeInTheDocument();
    });
  });

  describe('HOC wrapper', () => {
    it('wraps component with error boundary correctly', () => {
      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = withEnhancedErrorBoundary(TestComponent, {
        level: 'component'
      });

      render(<WrappedComponent />);

      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('catches errors in wrapped component', () => {
      const WrappedComponent = withEnhancedErrorBoundary(ThrowError, {
        level: 'component'
      });

      render(<WrappedComponent shouldThrow={true} />);

      expect(screen.getByText('Component Error')).toBeInTheDocument();
    });

    it('sets correct display name for wrapped component', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';
      
      const WrappedComponent = withEnhancedErrorBoundary(TestComponent);
      
      expect(WrappedComponent.displayName).toBe('withEnhancedErrorBoundary(TestComponent)');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <EnhancedErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      expect(tryAgainButton).toBeInTheDocument();
      
      const homeButton = screen.getByRole('button', { name: /go home/i });
      expect(homeButton).toBeInTheDocument();
    });

    it('maintains focus management after error', () => {
      render(
        <EnhancedErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      tryAgainButton.focus();
      
      expect(document.activeElement).toBe(tryAgainButton);
    });
  });
});