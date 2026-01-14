/**
 * Error Boundary Components
 * Catches and handles React errors gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronRight } from 'lucide-react';

// ============================================
// Error Boundary Types
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
  level?: 'page' | 'section' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================
// Main Error Boundary Class
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary Caught:', error);
      console.error('Component Stack:', errorInfo.componentStack);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state when resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || [];
      const currentKeys = this.props.resetKeys;

      const hasKeyChanged = currentKeys.some((key, index) => key !== prevKeys[index]);

      if (hasKeyChanged) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, level = 'page' } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Use level-appropriate default fallback
      switch (level) {
        case 'component':
          return <ComponentErrorFallback error={error} onReset={this.reset} />;
        case 'section':
          return <SectionErrorFallback error={error} onReset={this.reset} />;
        case 'page':
        default:
          return <PageErrorFallback error={error} onReset={this.reset} />;
      }
    }

    return children;
  }
}

// ============================================
// Error Fallback Components
// ============================================

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

/**
 * Full page error fallback
 */
function PageErrorFallback({ error, onReset }: ErrorFallbackProps): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <div className="max-w-md w-full">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Something went wrong
          </h1>

          {/* Error Description */}
          <p className="text-neutral-400 mb-6">
            We encountered an unexpected error. Please try refreshing the page or go back to home.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mb-6 p-4 bg-neutral-950 rounded-lg text-left overflow-auto max-h-40">
              <p className="text-red-400 text-sm font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <a
              href="/overview"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section-level error fallback
 */
function SectionErrorFallback({ error, onReset }: ErrorFallbackProps): React.ReactElement {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1">
            Failed to load this section
          </h3>
          <p className="text-neutral-400 text-sm mb-4">
            There was an error loading this content. Please try again.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <p className="text-red-400 text-xs font-mono mb-4 break-all">
              {error.message}
            </p>
          )}

          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Component-level error fallback (minimal)
 */
function ComponentErrorFallback({ onReset }: ErrorFallbackProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
      <span className="text-red-400 text-sm">Error loading content</span>
      <button
        onClick={onReset}
        className="ml-auto text-red-400 hover:text-red-300 text-sm underline"
      >
        Retry
      </button>
    </div>
  );
}

// ============================================
// Higher-Order Component
// ============================================

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundary;
}

// ============================================
// Route Error Boundary
// ============================================

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

export function RouteErrorBoundary({ children }: RouteErrorBoundaryProps): React.ReactElement {
  return (
    <ErrorBoundary
      level="page"
      onError={(error, errorInfo) => {
        // Log to analytics/monitoring service
        if (process.env.NODE_ENV === 'production') {
          // TODO: Send to error tracking service
          console.error('Route Error:', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================
// Feature Error Boundary
// ============================================

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
}

export function FeatureErrorBoundary({
  children,
  featureName,
}: FeatureErrorBoundaryProps): React.ReactElement {
  return (
    <ErrorBoundary
      level="section"
      onError={(error) => {
        if (process.env.NODE_ENV === 'production') {
          console.error(`Feature Error [${featureName}]:`, error.message);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
