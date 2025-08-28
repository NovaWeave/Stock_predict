/**
 * Enhanced Error Boundary Components
 * 
 * Advanced error boundaries with recovery strategies, error reporting,
 * and different fallback UIs for various error scenarios.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Wifi, 
  WifiOff,
  Settings,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { 
  AppError, 
  ErrorClassifier, 
  ErrorReporter, 
  ErrorRecovery,
  ErrorType,
  ErrorSeverity 
} from '../utils/errorHandling';

// Enhanced error boundary props
interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'section' | 'component';
  context?: {
    component: string;
    feature?: string;
    userId?: string;
  };
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
  enableReporting?: boolean;
  retryAttempts?: number;
}

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorInfo?: ErrorInfo;
  retryCount: number;
  isRecovering: boolean;
}

export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  EnhancedErrorBoundaryState
> {
  private retryTimer?: NodeJS.Timeout;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    const classifiedError = ErrorClassifier.classifyError(error);
    
    return {
      hasError: true,
      error: classifiedError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const classifiedError = ErrorClassifier.classifyError(error);
    
    // Store error info in state
    this.setState({ errorInfo });

    // Report error if enabled
    if (this.props.enableReporting !== false) {
      ErrorReporter.reportError(classifiedError, {
        ...this.props.context,
        errorBoundaryLevel: this.props.level || 'component',
        componentStack: errorInfo.componentStack,
        errorBoundary: 'EnhancedErrorBoundary'
      });
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(classifiedError, errorInfo);
    }

    // Auto-retry for certain error types
    if (this.props.enableRecovery !== false && this.shouldAutoRetry(classifiedError)) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  private shouldAutoRetry(error: AppError): boolean {
    const maxRetries = this.props.retryAttempts || 2;
    return (
      this.state.retryCount < maxRetries &&
      (error.type === ErrorType.NETWORK || error.type === ErrorType.TIMEOUT) &&
      error.retryable
    );
  }

  private scheduleRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff
    
    this.setState({ isRecovering: true });
    
    this.retryTimer = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
      isRecovering: false
    }));
  };

  private handleManualRetry = () => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.handleRetry();
  };

  private handleReset = () => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      isRecovering: false
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Show custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Show appropriate error UI based on context and error type
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { error } = this.state;
    const level = this.props.level || 'component';

    if (!error) return null;

    // Different UI based on boundary level
    switch (level) {
      case 'page':
        return <PageLevelError error={error} onRetry={this.handleManualRetry} onReset={this.handleReset} />;
      case 'section':
        return <SectionLevelError error={error} onRetry={this.handleManualRetry} onReset={this.handleReset} />;
      default:
        return <ComponentLevelError error={error} onRetry={this.handleManualRetry} onReset={this.handleReset} />;
    }
  }
}

// Page-level error component
function PageLevelError({ 
  error, 
  onRetry, 
  onReset 
}: { 
  error: AppError;
  onRetry: () => void;
  onReset: () => void;
}) {
  const recovery = ErrorRecovery.getRecoveryAction(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        <div className="glass-effect rounded-3xl p-12 text-center border border-red-500/20">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-6">
            {getErrorTitle(error.type)}
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            {error.userMessage || error.message}
          </p>

          <ErrorDetails error={error} />

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            {recovery && (
              <button
                onClick={recovery.handler}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>{recovery.label}</span>
              </button>
            )}
            
            <button
              onClick={onRetry}
              className="px-8 py-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try Again</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-4 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Go Home</span>
            </button>
          </div>

          <NetworkStatus />
        </div>
      </div>
    </div>
  );
}

// Section-level error component
function SectionLevelError({ 
  error, 
  onRetry, 
  onReset 
}: { 
  error: AppError;
  onRetry: () => void;
  onReset: () => void;
}) {
  return (
    <div className="glass-effect rounded-2xl p-8 border border-red-500/20 bg-red-900/10">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            Section Unavailable
          </h3>
          
          <p className="text-slate-300 mb-4">
            {error.userMessage || 'This section encountered an error and cannot be displayed.'}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component-level error component
function ComponentLevelError({ 
  error, 
  onRetry 
}: { 
  error: AppError;
  onRetry: () => void;
}) {
  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-3">
        <Bug className="w-5 h-5 text-red-400" />
        <span className="text-red-300 font-medium">Component Error</span>
      </div>
      
      <p className="text-slate-300 text-sm mb-4">
        {error.userMessage || 'This component failed to load.'}
      </p>
      
      <button
        onClick={onRetry}
        className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

// Error details component
function ErrorDetails({ error }: { error: AppError }) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <details className="mt-6 text-left">
      <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 mb-4">
        Developer Information
      </summary>
      
      <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-400">Type:</div>
            <div className="text-slate-200 font-mono">{error.type}</div>
          </div>
          <div>
            <div className="text-slate-400">Severity:</div>
            <div className="text-slate-200 font-mono">{error.severity}</div>
          </div>
          <div>
            <div className="text-slate-400">Retryable:</div>
            <div className="text-slate-200 font-mono">{error.retryable ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <div className="text-slate-400">Timestamp:</div>
            <div className="text-slate-200 font-mono">{error.timestamp.toLocaleTimeString()}</div>
          </div>
        </div>
        
        {error.stack && (
          <div>
            <div className="text-slate-400 text-xs mb-2">Stack Trace:</div>
            <pre className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded overflow-auto max-h-32">
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

// Network status component
function NetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="mt-8 pt-6 border-t border-slate-700">
      <div className={`flex items-center justify-center space-x-2 text-sm ${
        isOnline ? 'text-green-400' : 'text-red-400'
      }`}>
        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        <span>
          {isOnline ? 'Connected to internet' : 'No internet connection'}
        </span>
      </div>
    </div>
  );
}

// Helper function to get error titles
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.NETWORK:
      return 'Connection Problem';
    case ErrorType.API:
      return 'Service Unavailable';
    case ErrorType.AUTHENTICATION:
      return 'Authentication Required';
    case ErrorType.PERMISSION:
      return 'Access Denied';
    case ErrorType.RATE_LIMIT:
      return 'Too Many Requests';
    case ErrorType.SERVER:
      return 'Server Error';
    case ErrorType.TIMEOUT:
      return 'Request Timeout';
    default:
      return 'Something Went Wrong';
  }
}

// Higher-order component for automatic error boundary wrapping
export function withEnhancedErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<EnhancedErrorBoundaryProps> = {}
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...options}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withEnhancedErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Async error boundary for handling promise rejections
export function AsyncErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}) {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      setError(error);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (error) {
    if (fallback) {
      return <>{fallback(error)}</>;
    }
    
    return (
      <ComponentLevelError 
        error={ErrorClassifier.classifyError(error)}
        onRetry={() => setError(null)}
      />
    );
  }

  return <>{children}</>;
}