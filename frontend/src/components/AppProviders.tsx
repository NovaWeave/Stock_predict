/**
 * Application Providers
 * 
 * Root-level providers that wrap the entire application with error handling,
 * toast notifications, and other global context providers.
 */

'use client';

import React from 'react';
import { ToastProvider } from './Toast';
import { EnhancedErrorBoundary } from './EnhancedErrorBoundary';
import { GlobalErrorHandler } from '@/utils/errorHandling';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Initialize global error handling
  React.useEffect(() => {
    GlobalErrorHandler.initialize();
    
    return () => {
      GlobalErrorHandler.cleanup();
    };
  }, []);

  return (
    <EnhancedErrorBoundary
      level="page"
      context={{
        component: 'App',
        feature: 'root'
      }}
      enableRecovery={true}
      enableReporting={true}
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </EnhancedErrorBoundary>
  );
}