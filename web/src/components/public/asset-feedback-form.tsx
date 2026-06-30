"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback, type FeedbackPayload } from "@/lib/asset-engagement";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

const FEEDBACK_TYPES: { value: FeedbackPayload["feedback_type"]; labelKey: string }[] = [
  { value: "question", labelKey: "feedbackTypeQuestion" },
  { value: "problem", labelKey: "feedbackTypeProblem" },
  { value: "praise", labelKey: "feedbackTypePraise" },
  { value: "other", labelKey: "feedbackTypeOther" },
];

export function AssetFeedbackForm({
  assetId,
  token,
}: {
  assetId: string;
  token?: string | null;
}) {
  const t = useTranslations("AssetDetail");
  const [type, setType] = useState<FeedbackPayload["feedback_type"]>("question");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError(null);
    const res = await submitFeedback(assetId, { feedback_type: type, message: message.trim() }, token);
    setBusy(false);
    if (!res.ok) {
      setError(parseApiError(res.error));
      return;
    }
    setSubmitted(true);
    setMessage("");
  }

  if (submitted) {
    return (
      <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
        {t("feedbackSubmitted")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/70 bg-card/90 p-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("feedbackType")}</label>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              aria-pressed={type === option.value}
              className={ButtonClass(type === option.value)}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor={`feedback-message-${assetId}`} className="text-sm font-medium text-foreground">
          {t("feedbackMessage")}
        </label>
        <Textarea
          id={`feedback-message-${assetId}`}
          className="min-h-[96px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      <Button type="submit" disabled={!message.trim() || busy} className="w-full sm:w-auto">
        {t("feedbackSubmit")}
      </Button>
    </form>
  );
}

function ButtonClass(active: boolean) {
  return [
    "inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium transition-all",
    "active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    active
      ? "border-primary/40 bg-primary/10 text-foreground"
      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
  ].join(" ");
}
