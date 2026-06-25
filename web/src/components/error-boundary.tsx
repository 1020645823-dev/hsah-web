import React, { type ReactNode } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import Link from "next/link";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/95%)] p-8 shadow-[var(--shadow-card)]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] text-amber-400">
                <AlertTriangle className="size-7" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Something went wrong
                </h2>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  An unexpected error occurred. Please try reloading the page or return home.
                </p>
              </div>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mt-2 w-full rounded-lg border border-[rgb(212_218_245_/10%)] bg-[rgb(10_12_18_/60%)] p-4 text-left">
                  <div className="text-xs font-medium text-[var(--color-text-tertiary)]">Error details</div>
                  <pre className="mt-2 overflow-auto text-xs text-red-400">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[rgb(255_255_255_/8%)]"
                >
                  <RotateCcw className="size-4" />
                  Reload page
                </button>
                <Link
                  href="/"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-electric-purple)] px-5 text-sm font-medium text-white transition-transform duration-150 hover:-translate-y-px"
                >
                  <Home className="size-4" />
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
