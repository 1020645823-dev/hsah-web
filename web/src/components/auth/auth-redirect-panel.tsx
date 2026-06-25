"use client";

export function AuthRedirectPanel({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="space-y-3 text-center">
          <p className="text-xs font-medium tracking-[0.18em] text-primary">
            AUTHENTICATION
          </p>
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Redirecting to sign in
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
