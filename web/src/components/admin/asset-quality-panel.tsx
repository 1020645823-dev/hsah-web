"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchQualityCheck, type QualityCheckResult } from "@/lib/admin-asset-review";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

const BAND_LABEL: Record<string, string> = {
  ready: "bandReady",
  needs_work: "bandNeedsWork",
  blocked: "bandBlocked",
};

const BAND_CLASSES: Record<string, string> = {
  ready: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20",
  needs_work: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20",
  blocked: "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20",
};

export function AssetQualityPanel({ assetId, token }: { assetId: string; token: string }) {
  const t = useTranslations("Admin");
  const [result, setResult] = useState<QualityCheckResult | null>(null);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchQualityCheck(assetId, token)
      .then((res) => {
        if (!res.ok) {
          setError(parseApiError(res.data, res.status));
          setResult(null);
        } else {
          setError(null);
          setResult(res.data);
        }
      })
      .catch(() => {
        setError(parseApiError(null, undefined));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [assetId, token]);

  useEffect(() => {
    let canceled = false;
    fetchQualityCheck(assetId, token)
      .then((res) => {
        if (canceled) return;
        if (!res.ok) {
          setError(parseApiError(res.data, res.status));
          setResult(null);
        } else {
          setError(null);
          setResult(res.data);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [assetId, token]);

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.18em] text-primary">
            {t("quality.label")}
          </p>
          <CardTitle className="text-base text-foreground">{t("quality.title")}</CardTitle>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          aria-label={t("quality.refresh")}
          className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted/40 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error && <p className="text-rose-500">{error.message}</p>}
        {!result && !error && <p className="text-muted-foreground">{t("quality.refresh")}</p>}
        {result && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold text-foreground">{result.score}</span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  BAND_CLASSES[result.band] ?? BAND_CLASSES.needs_work
                }`}
              >
                {t(`quality.${BAND_LABEL[result.band] ?? "bandNeedsWork"}`)}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("quality.missing")}
              </p>
              {result.missing.length === 0 ? (
                <p className="text-foreground/70">{t("quality.noMissing")}</p>
              ) : (
                <ul className="list-inside list-disc space-y-0.5 text-rose-600">
                  {result.missing.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              )}
            </div>
            {result.warnings.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("quality.warnings")}
                </p>
                <ul className="list-inside list-disc space-y-0.5 text-amber-600">
                  {result.warnings.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
