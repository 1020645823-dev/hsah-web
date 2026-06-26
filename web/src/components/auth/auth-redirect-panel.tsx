"use client";

import Link from "next/link";
import { ArrowLeftRight, ShieldCheck, Sparkles } from "lucide-react";

export function AuthRedirectPanel({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
                Authentication
              </p>
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Redirecting to sign in
              </h2>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm leading-6 text-foreground/75">
            {message}
          </div>

          <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 text-sm text-foreground/75 sm:grid-cols-2">
            <PanelFact icon={ArrowLeftRight} title="Workspace context" description="Keep the current workspace in focus while the session is restored." />
            <PanelFact icon={Sparkles} title="Library return path" description="You can always return to the public library after authentication." />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-foreground/60">
            <span>Public library remains available for discovery.</span>
            <Link href="/assets" className="font-medium text-foreground transition-colors hover:text-primary">
              Go to public library
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelFact({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p>{description}</p>
      </div>
    </div>
  );
}
