/**
 * Loading States Components
 * 
 * Comprehensive loading indicators and states for the Stock Sentiment Analyzer.
 * Includes various loading patterns, skeleton screens, and progress indicators.
 */

'use client';

import React from 'react';
import { Loader2, TrendingUp, Activity, BarChart3, Zap, Brain } from 'lucide-react';

// Loading spinner sizes
type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

// Loading spinner component
interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  color?: 'primary' | 'secondary' | 'white' | 'gray';
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '',
  color = 'primary'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-500',
    secondary: 'text-purple-500',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`} 
    />
  );
}

// Pulsing dots loader
interface PulsingDotsProps {
  className?: string;
  dotClassName?: string;
}

export function PulsingDots({ className = '', dotClassName = '' }: PulsingDotsProps) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 bg-blue-500 rounded-full animate-pulse ${dotClassName}`}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// Progress bar component
interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'gradient' | 'striped';
}

export function ProgressBar({ 
  progress, 
  className = '',
  showLabel = false,
  label,
  variant = 'default'
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const variantClasses = {
    default: 'bg-blue-500',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-600',
    striped: 'bg-blue-500 bg-striped'
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>{label || 'Loading...'}</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${variantClasses[variant]}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

// Skeleton components for different content types
export function SkeletonText({ 
  lines = 1, 
  className = '',
  width = 'full'
}: { 
  lines?: number; 
  className?: string;
  width?: 'full' | 'half' | 'quarter' | 'three-quarter';
}) {
  const widthClasses = {
    full: 'w-full',
    half: 'w-1/2',
    quarter: 'w-1/4',
    'three-quarter': 'w-3/4'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-700 rounded animate-pulse ${
            i === lines - 1 && lines > 1 ? 'w-3/4' : widthClasses[width]
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-effect rounded-2xl p-6 border border-white/10 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gray-700 rounded-full mr-3" />
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-1/4" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded" />
          <div className="h-4 bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-effect rounded-2xl p-6 border border-white/10 ${className}`}>
      <div className="animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-6" />
        <div className="h-48 bg-gray-700 rounded-lg mb-4" />
        <div className="flex justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 bg-gray-700 rounded w-16" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Full page loading screen
interface FullPageLoadingProps {
  message?: string;
  submessage?: string;
  showProgress?: boolean;
  progress?: number;
}

export function FullPageLoading({
  message = 'Loading...',
  submessage,
  showProgress = false,
  progress = 0
}: FullPageLoadingProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto p-8">
        <div className="mb-8">
          {/* Animated logo/icon */}
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl animate-pulse" />
            <div className="absolute inset-2 bg-slate-900 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-blue-400 animate-bounce" />
            </div>
          </div>

          {/* Loading message */}
          <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
          {submessage && (
            <p className="text-slate-300 text-lg">{submessage}</p>
          )}
        </div>

        {/* Progress indicator */}
        {showProgress ? (
          <ProgressBar 
            progress={progress} 
            showLabel 
            variant="gradient"
            className="mb-6"
          />
        ) : (
          <div className="flex justify-center space-x-2 mb-6">
            <PulsingDots />
          </div>
        )}

        {/* Status text */}
        <p className="text-sm text-slate-400">
          Please wait while we load your data...
        </p>
      </div>
    </div>
  );
}

// Inline loading states
export function InlineLoading({ 
  message = 'Loading...',
  size = 'md',
  className = ''
}: {
  message?: string;
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} />
      <span className="text-slate-300">{message}</span>
    </div>
  );
}

// Button loading state
interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loadingText?: string;
  onClick?: () => void;
}

export function LoadingButton({
  loading,
  children,
  className = '',
  disabled = false,
  loadingText = 'Loading...',
  onClick
}: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative ${className} ${
        loading || disabled ? 'cursor-not-allowed opacity-75' : ''
      }`}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <LoadingSpinner size="sm" color="white" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Analysis loading screen with steps
interface AnalysisLoadingProps {
  currentStep?: number;
  steps?: string[];
  progress?: number;
}

export function AnalysisLoading({ 
  currentStep = 0, 
  steps = [
    'Fetching stock data...',
    'Analyzing social sentiment...',
    'Processing financial metrics...',
    'Generating predictions...',
    'Finalizing results...'
  ],
  progress
}: AnalysisLoadingProps) {
  const currentProgress = progress ?? (currentStep / steps.length) * 100;

  return (
    <div className="glass-effect rounded-3xl border border-white/10 p-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl animate-pulse" />
          <div className="absolute inset-2 bg-slate-900 rounded-xl flex items-center justify-center">
            <Brain className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">
          Analyzing Stock Data
        </h3>
        <p className="text-slate-300">
          Using AI to process financial data and social sentiment
        </p>
      </div>

      {/* Progress bar */}
      <ProgressBar 
        progress={currentProgress}
        variant="gradient"
        showLabel
        className="mb-8"
      />

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center space-x-3 ${
              index === currentStep 
                ? 'text-blue-400' 
                : index < currentStep 
                ? 'text-green-400' 
                : 'text-slate-500'
            }`}
          >
            {index < currentStep ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
            ) : index === currentStep ? (
              <LoadingSpinner size="sm" />
            ) : (
              <div className="w-6 h-6 bg-slate-600 rounded-full" />
            )}
            <span className="font-medium">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Data loading placeholder
export function DataPlaceholder({
  icon: Icon = Activity,
  title = 'No Data Available',
  description = 'Data will appear here once loaded.',
  action,
  className = ''
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}) {
  return (
    <div className={`glass-effect rounded-2xl border border-white/10 p-8 text-center ${className}`}>
      <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6">{description}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}