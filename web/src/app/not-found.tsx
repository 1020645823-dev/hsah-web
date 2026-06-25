import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { PublicSiteShell } from "@/components/public-site-shell";

export default function NotFound() {
  return (
    <PublicSiteShell>
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <div className="text-9xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)]">
            404
          </div>
          <div className="mt-4 text-lg font-medium text-[var(--color-text-secondary)]">
            Page not found
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-electric-purple)] px-6 text-sm font-medium text-white transition-transform duration-150 hover:-translate-y-px"
            >
              <Home className="size-4" />
              Back to home
            </Link>
            <Link
              href="/assets"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-6 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[rgb(255_255_255_/8%)]"
            >
              Explore assets
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </PublicSiteShell>
  );
}
