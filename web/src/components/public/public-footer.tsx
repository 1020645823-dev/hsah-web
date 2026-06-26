import Link from "next/link";

import { publicNavLinks } from "@/lib/public-content";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-8">
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] text-primary">ABOUT THE HUB</p>
          <p className="max-w-xl text-sm leading-6 text-foreground/70">
            Discover scenario-led content, reference architecture thinking, and implementation-ready delivery assets
            from one branded platform.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] text-primary">SECTIONS</p>
          <div className="flex flex-col gap-1 text-sm text-foreground/70 md:gap-2">
            {publicNavLinks.map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center transition-colors hover:text-foreground md:min-h-0">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] text-primary">START HERE</p>
          <div className="flex flex-col gap-1 text-sm text-foreground/70 md:gap-2">
            <Link href="/assets" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground md:min-h-0">
              Asset Library
            </Link>
            <Link href="/auth/login" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground md:min-h-0">
              Sign in
            </Link>
            <Link href="/about" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground md:min-h-0">
              About the platform
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
