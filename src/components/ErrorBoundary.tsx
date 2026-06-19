import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6 text-red-600 dark:text-red-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 tracking-tight">Something went wrong</h1>
          <p className="text-sm text-zinc-500 max-w-[320px] mb-8 leading-relaxed">
            We encountered an unexpected error while loading this page. Our team has been notified.
          </p>
          <Button 
            onClick={this.handleReload} 
            className="rounded-xl h-11 px-8 gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-8 text-left bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl max-w-full overflow-x-auto w-full max-w-2xl">
              <pre className="text-xs text-red-600 dark:text-red-400 font-mono">
                {this.state.error.toString()}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
