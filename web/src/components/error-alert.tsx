"use client";

import type { ApiErrorInfo } from "@/lib/api-errors";
import { AlertTriangle, WifiOff, Lock, ShieldAlert, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

export type ErrorAlertProps = {
  error: ApiErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
};

const iconMap: Record<string, typeof AlertTriangle> = {
  "alert-triangle": AlertTriangle,
  "wifi-off": WifiOff,
  "lock": Lock,
  "shield-alert": ShieldAlert,
};

const categoryStyles: Record<
  ApiErrorInfo["category"],
  { border: string; bg: string; text: string }
> = {
  network: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  server: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
  auth: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  forbidden: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
  },
  client: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
  unknown: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
};

export function ErrorAlert({ error, onRetry, onDismiss }: ErrorAlertProps) {
  const tCommon = useTranslations("Common");
  const styles = categoryStyles[error.category];
  const Icon = iconMap[error.iconName] || AlertTriangle;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border ${styles.border} ${styles.bg} px-4 py-3`}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.text}`} aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <p className={`text-sm font-medium ${styles.text}`}>{error.userMessage}</p>
        {error.message !== error.userMessage ? (
          <p className="text-xs text-muted-foreground">{error.message}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {error.retryable && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${styles.text} hover:bg-foreground/5 transition-colors`}
            aria-label={tCommon("retry")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {tCommon("retry")}
          </button>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-label={tCommon("dismiss")}
          >
            {tCommon("dismiss")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
