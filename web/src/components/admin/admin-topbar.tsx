import Link from "next/link";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";

type AdminTopbarProps = {
  pageTitle: string;
  breadcrumb?: readonly {
    label: string;
    href: string;
  }[];
};

export function AdminTopbar({ pageTitle, breadcrumb }: AdminTopbarProps) {
  return (
    <header className="border-b border-border/70 bg-background/95 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          {breadcrumb && breadcrumb.length > 0 ? (
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
              {breadcrumb.map((item, index) => (
                <span key={item.href} className="flex items-center gap-2">
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  {index === breadcrumb.length - 1 ? (
                    <span aria-current="page">{item.label}</span>
                  ) : (
                    <Link href={item.href} className="transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
          <p className="text-xs font-medium tracking-[0.18em] text-primary">ADMIN WORKSPACE</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Shared shell for governance workflows, publishing controls, and access operations.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4 text-primary" />
            <span>Quick jump across admin surfaces</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Protected routes active</span>
          </div>

          <Link
            href="/assets"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open library
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
