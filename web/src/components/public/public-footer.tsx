import Link from "next/link";

import { publicNavLinks } from "@/lib/public-content";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/70">
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
          <div className="flex flex-col gap-2 text-sm text-foreground/70">
            {publicNavLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] text-primary">START HERE</p>
          <div className="flex flex-col gap-2 text-sm text-foreground/70">
            <Link href="/assets" className="transition-colors hover:text-foreground">
              Asset Library
            </Link>
            <Link href="/auth/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link href="/about" className="transition-colors hover:text-foreground">
              About the platform
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
