import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  LoadingSpinner,
  PulsingDots,
  ProgressBar,
  SkeletonText,
  SkeletonCard,
  SkeletonChart,
  FullPageLoading,
  InlineLoading,
  LoadingButton,
  AnalysisLoading,
  DataPlaceholder
} from '../LoadingStates';

describe('LoadingStates Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin', 'w-6', 'h-6', 'text-blue-500');
    });

    it('renders with custom size', () => {
      render(<LoadingSpinner size="lg" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('renders with custom color', () => {
      render(<LoadingSpinner color="white" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('text-white');
    });

    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-class" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('custom-class');
    });
  });

  describe('PulsingDots', () => {
    it('renders three dots', () => {
      render(<PulsingDots data-testid="dots" />);
      
      const container = screen.getByTestId('dots');
      const dots = container.querySelectorAll('div');
      expect(dots).toHaveLength(3);
    });

    it('applies custom className', () => {
      render(<PulsingDots className="custom-dots" data-testid="dots" />);
      
      const container = screen.getByTestId('dots');
      expect(container).toHaveClass('custom-dots');
    });

    it('applies dot className to each dot', () => {
      render(<PulsingDots dotClassName="custom-dot" data-testid="dots" />);
      
      const container = screen.getByTestId('dots');
      const dots = container.querySelectorAll('div');
      
      dots.forEach(dot => {
        expect(dot).toHaveClass('custom-dot');
      });
    });
  });

  describe('ProgressBar', () => {
    it('renders with progress value', () => {
      render(<ProgressBar progress={50} data-testid="progress" />);
      
      const progressBar = screen.getByTestId('progress');
      const progressFill = progressBar.querySelector('div > div');
      
      expect(progressFill).toHaveStyle('width: 50%');
    });

    it('clamps progress value between 0 and 100', () => {
      const { rerender } = render(<ProgressBar progress={150} data-testid="progress" />);
      
      let progressFill = screen.getByTestId('progress').querySelector('div > div');
      expect(progressFill).toHaveStyle('width: 100%');
      
      rerender(<ProgressBar progress={-10} data-testid="progress" />);
      
      progressFill = screen.getByTestId('progress').querySelector('div > div');
      expect(progressFill).toHaveStyle('width: 0%');
    });

    it('shows label when showLabel is true', () => {
      render(<ProgressBar progress={75} showLabel data-testid="progress" />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows custom label', () => {
      render(
        <ProgressBar 
          progress={60} 
          showLabel 
          label="Downloading..." 
          data-testid="progress" 
        />
      );
      
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('renders with gradient variant', () => {
      render(<ProgressBar progress={50} variant="gradient" data-testid="progress" />);
      
      const progressFill = screen.getByTestId('progress').querySelector('div > div');
      expect(progressFill).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-purple-600');
    });
  });

  describe('SkeletonText', () => {
    it('renders single line by default', () => {
      render(<SkeletonText data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      const lines = skeleton.querySelectorAll('div');
      expect(lines).toHaveLength(1);
    });

    it('renders multiple lines', () => {
      render(<SkeletonText lines={3} data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      const lines = skeleton.querySelectorAll('div');
      expect(lines).toHaveLength(3);
    });

    it('applies width classes correctly', () => {
      render(<SkeletonText width="half" data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      const line = skeleton.querySelector('div');
      expect(line).toHaveClass('w-1/2');
    });

    it('makes last line shorter for multiple lines', () => {
      render(<SkeletonText lines={2} data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      const lines = skeleton.querySelectorAll('div');
      
      expect(lines[0]).toHaveClass('w-full');
      expect(lines[1]).toHaveClass('w-3/4');
    });
  });

  describe('SkeletonCard', () => {
    it('renders skeleton card structure', () => {
      render(<SkeletonCard data-testid="skeleton-card" />);
      
      const card = screen.getByTestId('skeleton-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('glass-effect', 'rounded-2xl');
      
      // Check for avatar skeleton
      const avatar = card.querySelector('div div div:first-child');
      expect(avatar).toHaveClass('w-10', 'h-10', 'bg-gray-700', 'rounded-full');
    });

    it('applies custom className', () => {
      render(<SkeletonCard className="custom-card" data-testid="skeleton-card" />);
      
      const card = screen.getByTestId('skeleton-card');
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('SkeletonChart', () => {
    it('renders chart skeleton structure', () => {
      render(<SkeletonChart data-testid="skeleton-chart" />);
      
      const chart = screen.getByTestId('skeleton-chart');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('glass-effect', 'rounded-2xl');
      
      // Check for chart area
      const chartArea = chart.querySelector('div div div:nth-child(2)');
      expect(chartArea).toHaveClass('h-48', 'bg-gray-700');
    });
  });

  describe('FullPageLoading', () => {
    it('renders with default message', () => {
      render(<FullPageLoading />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<FullPageLoading message="Analyzing data..." />);
      
      expect(screen.getByText('Analyzing data...')).toBeInTheDocument();
    });

    it('shows submessage when provided', () => {
      render(
        <FullPageLoading 
          message="Loading" 
          submessage="Please wait while we process your request" 
        />
      );
      
      expect(screen.getByText('Please wait while we process your request')).toBeInTheDocument();
    });

    it('shows progress bar when enabled', () => {
      render(<FullPageLoading showProgress progress={60} />);
      
      const progressBar = screen.getByText('60%').closest('div');
      expect(progressBar).toBeInTheDocument();
    });

    it('has proper fixed positioning', () => {
      render(<FullPageLoading data-testid="full-page-loading" />);
      
      const container = screen.getByTestId('full-page-loading');
      expect(container).toHaveClass('fixed', 'inset-0');
    });
  });

  describe('InlineLoading', () => {
    it('renders with default message', () => {
      render(<InlineLoading />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<InlineLoading message="Processing..." />);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('renders with custom size', () => {
      render(<InlineLoading size="lg" data-testid="inline-loading" />);
      
      const spinner = screen.getByTestId('inline-loading').querySelector('svg');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });
  });

  describe('LoadingButton', () => {
    it('renders children when not loading', () => {
      render(
        <LoadingButton loading={false}>
          Click me
        </LoadingButton>
      );
      
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('shows loading state when loading', () => {
      render(
        <LoadingButton loading={true}>
          Click me
        </LoadingButton>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    });

    it('shows custom loading text', () => {
      render(
        <LoadingButton loading={true} loadingText="Submitting...">
          Submit
        </LoadingButton>
      );
      
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(
        <LoadingButton loading={true}>
          Click me
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('handles click events when not loading', () => {
      const handleClick = jest.fn();
      
      render(
        <LoadingButton loading={false} onClick={handleClick}>
          Click me
        </LoadingButton>
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not handle click events when loading', () => {
      const handleClick = jest.fn();
      
      render(
        <LoadingButton loading={true} onClick={handleClick}>
          Click me
        </LoadingButton>
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('AnalysisLoading', () => {
    const defaultSteps = [
      'Fetching stock data...',
      'Analyzing social sentiment...',
      'Processing financial metrics...',
      'Generating predictions...',
      'Finalizing results...'
    ];

    it('renders with default steps', () => {
      render(<AnalysisLoading />);
      
      defaultSteps.forEach(step => {
        expect(screen.getByText(step)).toBeInTheDocument();
      });
    });

    it('renders with custom steps', () => {
      const customSteps = ['Step 1', 'Step 2', 'Step 3'];
      
      render(<AnalysisLoading steps={customSteps} />);
      
      customSteps.forEach(step => {
        expect(screen.getByText(step)).toBeInTheDocument();
      });
    });

    it('highlights current step', () => {
      render(<AnalysisLoading currentStep={2} />);
      
      const currentStepElement = screen.getByText('Processing financial metrics...');
      const container = currentStepElement.closest('div');
      expect(container).toHaveClass('text-blue-400');
    });

    it('shows completed steps with different styling', () => {
      render(<AnalysisLoading currentStep={2} />);
      
      const completedStep = screen.getByText('Fetching stock data...');
      const container = completedStep.closest('div');
      expect(container).toHaveClass('text-green-400');
    });

    it('calculates progress automatically', () => {
      render(<AnalysisLoading currentStep={2} />);
      
      // Should be 40% (2/5 * 100)
      const progressText = screen.getByText('40%');
      expect(progressText).toBeInTheDocument();
    });

    it('uses provided progress value', () => {
      render(<AnalysisLoading currentStep={2} progress={75} />);
      
      const progressText = screen.getByText('75%');
      expect(progressText).toBeInTheDocument();
    });
  });

  describe('DataPlaceholder', () => {
    it('renders with default props', () => {
      render(<DataPlaceholder />);
      
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
      expect(screen.getByText('Data will appear here once loaded.')).toBeInTheDocument();
    });

    it('renders with custom title and description', () => {
      render(
        <DataPlaceholder 
          title="No Results Found"
          description="Try adjusting your search criteria."
        />
      );
      
      expect(screen.getByText('No Results Found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria.')).toBeInTheDocument();
    });

    it('renders action button when provided', () => {
      const handleAction = jest.fn();
      
      render(
        <DataPlaceholder 
          action={{
            label: 'Retry',
            onClick: handleAction
          }}
        />
      );
      
      const actionButton = screen.getByRole('button', { name: 'Retry' });
      expect(actionButton).toBeInTheDocument();
      
      fireEvent.click(actionButton);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('does not render action button when not provided', () => {
      render(<DataPlaceholder />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<DataPlaceholder className="custom-placeholder" data-testid="placeholder" />);
      
      const placeholder = screen.getByTestId('placeholder');
      expect(placeholder).toHaveClass('custom-placeholder');
    });
  });

  describe('Accessibility', () => {
    it('loading spinners have proper aria attributes', () => {
      render(<LoadingSpinner aria-label="Loading content" />);
      
      const spinner = screen.getByLabelText('Loading content');
      expect(spinner).toBeInTheDocument();
    });

    it('progress bars are accessible', () => {
      render(<ProgressBar progress={50} aria-label="Download progress" />);
      
      const progressBar = screen.getByLabelText('Download progress');
      expect(progressBar).toBeInTheDocument();
    });

    it('buttons maintain accessibility when loading', () => {
      render(
        <LoadingButton loading={true} aria-label="Submit form">
          Submit
        </LoadingButton>
      );
      
      const button = screen.getByLabelText('Submit form');
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe('Animation Performance', () => {
    it('applies will-change optimizations', () => {
      render(<LoadingSpinner data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('skeleton components have proper animation classes', () => {
      render(<SkeletonText data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      const line = skeleton.querySelector('div');
      expect(line).toHaveClass('animate-pulse');
    });
  });
});