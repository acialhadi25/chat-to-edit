import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full mx-4 space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg"></div>
                  <div className="relative bg-red-50 dark:bg-red-950 rounded-full p-4 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>

              {/* Error Content */}
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold text-foreground">
                  Oops! Something went wrong
                </h1>
                <p className="text-sm text-muted-foreground">
                  We're sorry for the inconvenience. An unexpected error has occurred.
                </p>
              </div>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-mono text-red-600 dark:text-red-400 font-semibold">
                    Error: {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs text-red-600 dark:text-red-400">
                      <summary className="cursor-pointer font-semibold mb-2">
                        Stack trace
                      </summary>
                      <pre className="overflow-auto max-h-40 font-mono bg-black/5 dark:bg-black/30 p-2 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={this.handleReset}
                  className="w-full gap-2"
                  size="lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-center text-muted-foreground">
                If the problem persists, please try clearing your browser cache or contact support.
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
