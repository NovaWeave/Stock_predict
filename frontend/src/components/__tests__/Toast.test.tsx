import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast, useErrorToast, useSuccessToast, useLoadingToast } from '../Toast';
import { AppError, ErrorType, ErrorSeverity } from '../../utils/errorHandling';

// Test component that uses toast hooks
const ToastTestComponent = () => {
  const { showToast, showSuccess, showError, showWarning, showInfo, showLoading, clearAll } = useToast();
  const { showNetworkError, showValidationError, showApiError } = useErrorToast();
  const { showDataLoaded, showActionComplete } = useSuccessToast();
  const { showAsyncOperation } = useLoadingToast();

  const handleShowSuccess = () => showSuccess('Success message');
  const handleShowError = () => showError('Error message');
  const handleShowWarning = () => showWarning('Warning message');
  const handleShowInfo = () => showInfo('Info message');
  const handleShowLoading = () => showLoading('Loading message');
  const handleShowNetworkError = () => showNetworkError();
  const handleShowValidationError = () => showValidationError('Field', 'Validation failed');
  
  const handleShowApiError = () => {
    const apiError: AppError = {
      name: 'AppError',
      message: 'API Error',
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      userMessage: 'API request failed',
      timestamp: new Date()
    };
    showApiError(apiError);
  };

  const handleAsyncOperation = async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve('Async result'), 100);
    });
    
    await showAsyncOperation(promise, {
      loadingMessage: 'Processing...',
      successMessage: 'Async completed!'
    });
  };

  const handleAsyncOperationWithError = async () => {
    const promise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Async error')), 100);
    });
    
    try {
      await showAsyncOperation(promise, {
        loadingMessage: 'Processing...',
        errorMessage: 'Async failed!'
      });
    } catch (error) {
      // Expected error
    }
  };

  return (
    <div>
      <button onClick={handleShowSuccess}>Show Success</button>
      <button onClick={handleShowError}>Show Error</button>
      <button onClick={handleShowWarning}>Show Warning</button>
      <button onClick={handleShowInfo}>Show Info</button>
      <button onClick={handleShowLoading}>Show Loading</button>
      <button onClick={handleShowNetworkError}>Show Network Error</button>
      <button onClick={handleShowValidationError}>Show Validation Error</button>
      <button onClick={handleShowApiError}>Show API Error</button>
      <button onClick={handleAsyncOperation}>Show Async Operation</button>
      <button onClick={handleAsyncOperationWithError}>Show Async Error</button>
      <button onClick={() => showDataLoaded('Stock Data')}>Show Data Loaded</button>
      <button onClick={() => showActionComplete('Analysis')}>Show Action Complete</button>
      <button onClick={clearAll}>Clear All</button>
    </div>
  );
};

// Helper to render component with ToastProvider
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      {component}
    </ToastProvider>
  );
};

describe('Toast System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('renders children correctly', () => {
      renderWithProvider(<div data-testid="child">Child content</div>);
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('provides toast context to children', () => {
      renderWithProvider(<ToastTestComponent />);
      expect(screen.getByRole('button', { name: 'Show Success' })).toBeInTheDocument();
    });
  });

  describe('Basic Toast Types', () => {
    it('displays success toast', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('displays error toast', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Error' }));
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('displays warning toast', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Warning' }));
      
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('displays info toast', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Info' }));
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('displays loading toast', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Loading' }));
      
      expect(screen.getByText('Loading message')).toBeInTheDocument();
    });
  });

  describe('Toast Auto-dismiss', () => {
    it('auto-dismisses toast after duration', async () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
      expect(screen.getByText('Success message')).toBeInTheDocument();
      
      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    });

    it('does not auto-dismiss loading toast', async () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Loading' }));
      expect(screen.getByText('Loading message')).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Loading toast should still be visible
      expect(screen.getByText('Loading message')).toBeInTheDocument();
    });
  });

  describe('Toast Dismissal', () => {
    it('dismisses toast when close button is clicked', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
      expect(screen.getByText('Success message')).toBeInTheDocument();
      
      const closeButton = screen.getByRole('button', { name: '' }); // Close button
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    it('clears all toasts when clearAll is called', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
      fireEvent.click(screen.getByRole('button', { name: 'Show Error' }));
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      
      fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
      
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });
  });

  describe('Error Toast Utilities', () => {
    it('displays network error toast', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Network Error' }));
      
      expect(screen.getByText(/Network connection failed/)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('displays validation error toast', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Validation Error' }));
      
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
      expect(screen.getByText('Field Validation Error')).toBeInTheDocument();
    });

    it('displays API error toast with retry button', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show API Error' }));
      
      expect(screen.getByText('API request failed')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Success Toast Utilities', () => {
    it('displays data loaded toast', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Data Loaded' }));
      
      expect(screen.getByText('Stock Data loaded successfully!')).toBeInTheDocument();
    });

    it('displays action complete toast', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Action Complete' }));
      
      expect(screen.getByText('Analysis completed successfully!')).toBeInTheDocument();
    });
  });

  describe('Loading Toast Utilities', () => {
    it('handles successful async operation', async () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Async Operation' }));
      
      // Should show loading toast
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      
      // Wait for operation to complete
      await act(async () => {
        jest.advanceTimersByTime(100);
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Should show success toast
      await waitFor(() => {
        expect(screen.getByText('Async completed!')).toBeInTheDocument();
      });
    });

    it('handles failed async operation', async () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Async Error' }));
      
      // Should show loading toast
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      
      // Wait for operation to fail
      await act(async () => {
        jest.advanceTimersByTime(100);
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Should show error toast
      await waitFor(() => {
        expect(screen.getByText('Async failed!')).toBeInTheDocument();
      });
    });
  });

  describe('Toast Stacking', () => {
    it('displays multiple toasts simultaneously', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
      fireEvent.click(screen.getByRole('button', { name: 'Show Warning' }));
      fireEvent.click(screen.getByRole('button', { name: 'Show Info' }));
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('maintains correct order of toasts', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
      fireEvent.click(screen.getByRole('button', { name: 'Show Error' }));
      
      const toasts = screen.getAllByRole('alert');
      expect(toasts).toHaveLength(2);
      
      // Newer toast should appear first (at the top)
      expect(toasts[0]).toHaveTextContent('Error message');
      expect(toasts[1]).toHaveTextContent('Success message');
    });
  });

  describe('Toast Actions', () => {
    it('executes action when action button is clicked', () => {
      const mockAction = jest.fn();
      
      const TestComponentWithAction = () => {
        const { showError } = useToast();
        
        const handleShowErrorWithAction = () => {
          showError('Error with action', {
            action: {
              label: 'Retry Action',
              onClick: mockAction
            }
          });
        };
        
        return <button onClick={handleShowErrorWithAction}>Show Error with Action</button>;
      };
      
      renderWithProvider(<TestComponentWithAction />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Error with Action' }));
      
      const actionButton = screen.getByRole('button', { name: 'Retry Action' });
      fireEvent.click(actionButton);
      
      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty toast message', () => {
      const TestComponent = () => {
        const { showSuccess } = useToast();
        return <button onClick={() => showSuccess('')}>Show Empty</button>;
      };
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Empty' }));
      
      // Should still render toast container even with empty message
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles very long toast messages', () => {
      const longMessage = 'A'.repeat(1000);
      
      const TestComponent = () => {
        const { showInfo } = useToast();
        return <button onClick={() => showInfo(longMessage)}>Show Long</button>;
      };
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Long' }));
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles rapid toast creation', () => {
      const TestComponent = () => {
        const { showInfo } = useToast();
        
        const handleRapidToasts = () => {
          for (let i = 0; i < 10; i++) {
            showInfo(`Toast ${i}`);
          }
        };
        
        return <button onClick={handleRapidToasts}>Show Rapid</button>;
      };
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Rapid' }));
      
      // Should handle multiple toasts without errors
      expect(screen.getAllByRole('alert')).toHaveLength(10);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles', () => {
      renderWithProvider(<ToastTestComponent />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('maintains focus after toast dismissal', () => {
      renderWithProvider(<ToastTestComponent />);
      
      const button = screen.getByRole('button', { name: 'Show Success' });
      button.focus();
      fireEvent.click(button);
      
      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);
      
      // Focus should return to triggering element
      expect(button).toHaveFocus();
    });
  });
});