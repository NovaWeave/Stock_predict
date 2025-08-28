/**
 * Toast Notification System
 * 
 * Comprehensive notification system with different types, animations,
 * and auto-dismiss functionality for user feedback.
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { AppError } from '../utils/errorHandling';

// Toast types and interfaces
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // in milliseconds, 0 = no auto-dismiss
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Toast state management
interface ToastState {
  toasts: Toast[];
}

type ToastAction = 
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: { id: string } }
  | { type: 'CLEAR_ALL' }
  | { type: 'UPDATE_TOAST'; payload: { id: string; updates: Partial<Toast> } };

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.payload, ...state.toasts]
      };
    
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload.id)
      };
    
    case 'CLEAR_ALL':
      return {
        ...state,
        toasts: []
      };
    
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map(toast =>
          toast.id === action.payload.id
            ? { ...toast, ...action.payload.updates }
            : toast
        )
      };
    
    default:
      return state;
  }
};

// Context for toast management
interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => string;
  hideToast: (id: string) => void;
  clearAll: () => void;
  showSuccess: (message: string, options?: Partial<Toast>) => string;
  showError: (message: string | AppError, options?: Partial<Toast>) => string;
  showWarning: (message: string, options?: Partial<Toast>) => string;
  showInfo: (message: string, options?: Partial<Toast>) => string;
  showLoading: (message: string, options?: Partial<Toast>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const showToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      timestamp: new Date(),
      duration: toast.type === 'loading' ? 0 : 5000, // Default 5 seconds, loading doesn't auto-dismiss
      dismissible: true,
      ...toast
    };

    dispatch({ type: 'ADD_TOAST', payload: newToast });
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: { id } });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ type: 'success', message, ...options });
  }, [showToast]);

  const showError = useCallback((error: string | AppError, options?: Partial<Toast>) => {
    const message = typeof error === 'string' ? error : error.userMessage || error.message;
    const title = typeof error === 'object' ? `${error.type.toUpperCase()} Error` : undefined;
    
    return showToast({ 
      type: 'error', 
      message, 
      title,
      duration: 8000, // Longer duration for errors
      ...options 
    });
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ type: 'warning', message, ...options });
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ type: 'info', message, ...options });
  }, [showToast]);

  const showLoading = useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ type: 'loading', message, duration: 0, ...options });
  }, [showToast]);

  const contextValue: ToastContextType = {
    toasts: state.toasts,
    showToast,
    hideToast,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook for using toast context
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Individual toast component
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, onDismiss]);

  const getToastStyles = () => {
    const baseStyles = "glass-effect border rounded-xl p-4 shadow-lg backdrop-blur-md";
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} border-green-500/50 bg-green-900/20`;
      case 'error':
        return `${baseStyles} border-red-500/50 bg-red-900/20`;
      case 'warning':
        return `${baseStyles} border-yellow-500/50 bg-yellow-900/20`;
      case 'info':
        return `${baseStyles} border-blue-500/50 bg-blue-900/20`;
      case 'loading':
        return `${baseStyles} border-purple-500/50 bg-purple-900/20`;
      default:
        return `${baseStyles} border-gray-500/50 bg-gray-900/20`;
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-400`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-400`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-400`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-400`} />;
      case 'loading':
        return (
          <div className={`${iconClass} relative`}>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent" />
          </div>
        );
      default:
        return <AlertCircle className={`${iconClass} text-gray-400`} />;
    }
  };

  return (
    <div
      className={`${getToastStyles()} transform transition-all duration-300 ease-in-out hover:scale-105 animate-slide-in-right`}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="font-semibold text-white text-sm mb-1">
              {toast.title}
            </div>
          )}
          <div className="text-slate-200 text-sm leading-relaxed">
            {toast.message}
          </div>
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        {toast.dismissible && (
          <button
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Progress bar for timed toasts */}
      {toast.duration && toast.duration > 0 && (
        <div className="mt-3 w-full bg-gray-700 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-progress-bar"
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}

// Toast container component
function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={hideToast} />
        </div>
      ))}
    </div>
  );
}

// Utility hooks for common toast patterns
export function useErrorToast() {
  const { showError } = useToast();
  
  const showNetworkError = useCallback(() => {
    showError('Network connection failed. Please check your internet connection and try again.', {
      title: 'Connection Error',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      }
    });
  }, [showError]);

  const showValidationError = useCallback((field: string, message: string) => {
    showError(message, {
      title: `${field} Validation Error`,
      duration: 6000
    });
  }, [showError]);

  const showApiError = useCallback((error: AppError) => {
    showError(error, {
      action: error.retryable ? {
        label: 'Retry',
        onClick: () => window.location.reload()
      } : undefined
    });
  }, [showError]);

  return {
    showNetworkError,
    showValidationError,
    showApiError
  };
}

export function useSuccessToast() {
  const { showSuccess } = useToast();

  const showDataLoaded = useCallback((itemType: string) => {
    showSuccess(`${itemType} loaded successfully!`, {
      duration: 3000
    });
  }, [showSuccess]);

  const showActionComplete = useCallback((action: string) => {
    showSuccess(`${action} completed successfully!`, {
      duration: 4000
    });
  }, [showSuccess]);

  return {
    showDataLoaded,
    showActionComplete
  };
}

export function useLoadingToast() {
  const { showLoading, hideToast, showSuccess, showError } = useToast();

  const showAsyncOperation = useCallback(async <T,>(
    promise: Promise<T>,
    {
      loadingMessage = 'Processing...',
      successMessage,
      errorMessage = 'Operation failed'
    }: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
    } = {}
  ): Promise<T> => {
    const toastId = showLoading(loadingMessage);

    try {
      const result = await promise;
      hideToast(toastId);
      
      if (successMessage) {
        showSuccess(successMessage);
      }
      
      return result;
    } catch (error) {
      hideToast(toastId);
      showError(error instanceof Error ? error.message : errorMessage);
      throw error;
    }
  }, [showLoading, hideToast, showSuccess, showError]);

  return {
    showAsyncOperation
  };
}

// CSS animations (add to globals.css)
export const toastAnimations = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes progress-bar {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }

  .animate-progress-bar {
    animation: progress-bar linear;
  }
`;