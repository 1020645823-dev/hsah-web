"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/product/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/error-alert";
import { adminRequest, getStoredAdminToken } from "@/lib/admin";
import { parseApiError, type ApiErrorInfo } from "@/lib/api-errors";

import type { SimulationResult } from "@/types/simulation";

export default function AdminSimulatorPage() {
  const t = useTranslations("Admin");
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    adminRequest<SimulationResult>("/api/v1/admin/simulator", token, { method: "GET" })
      .then((data) => {
        if (canceled) return;
        if (!data.ok) {
          setError(parseApiError(data.data, data.status));
          setResult(null);
        } else {
          setError(null);
          setResult(data.data ?? null);
        }
      })
      .catch(() => {
        if (canceled) return;
        setError(parseApiError(null, undefined));
        setResult(null);
      });
    return () => {
      canceled = true;
    };
  }, [token]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("simulator.eyebrow")}
        title={t("simulator.title")}
        summary={t("simulator.summary")}
      />

      {error && (
        <ErrorAlert
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("simulator.totalSimulations")}</p>
              <CardTitle className="text-3xl font-semibold text-foreground">
                {result?.total ?? 0}
              </CardTitle>
            </div>
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <Search className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("simulator.totalSimulationsDescription")}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t("simulator.simulationResults")}</h2>

        {result?.results && result.results.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.results.map((sim) => (
              <Card key={sim.id} className="border-border/70 bg-card/90">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base text-foreground">{sim.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{sim.id}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {t("simulator.status")}: {sim.status}
                  </p>
                  <p>
                    {t("simulator.created")}: {new Date(sim.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/70 bg-card/90 px-6 py-10 text-center text-sm text-muted-foreground">
            {t("simulator.empty")}
          </div>
        )}
      </section>
    </div>
  );
}
