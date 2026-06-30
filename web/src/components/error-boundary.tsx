"use client";

import React, { type ReactNode } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import Link from "next/link";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

function DefaultFallback({ error }: { error: Error | null }) {
  const t = useTranslations("ErrorBoundary");

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-lg bg-muted text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-7" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("somethingWentWrong")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("unexpectedError")}
            </p>
          </div>
          {process.env.NODE_ENV === "development" && error ? (
            <div className="mt-2 w-full rounded-lg border border-border bg-muted/60 p-4 text-left">
              <div className="text-xs font-medium text-muted-foreground">{t("errorDetails")}</div>
              <pre className="mt-2 overflow-auto text-xs text-red-600 dark:text-red-400">
                {error.message}
              </pre>
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="size-4" />
              {t("reloadPage")}
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Home className="size-4" />
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

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

      return <DefaultFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
