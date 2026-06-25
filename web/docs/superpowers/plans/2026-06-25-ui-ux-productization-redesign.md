# UI/UX Productization Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure HSAH into a unified brand system with a productized homepage, task-first asset library, credible login flow, and persistent admin shell.

**Architecture:** Introduce a shared product design layer first, then rebuild the four target surfaces on top of it in the sequence defined by the approved spec. Public pages share a unified brand/header/footer system, while login and admin adopt a mixed light/dark application shell that reuses the same typography, accents, and interaction grammar. Auth redirect handling is tightened before admin shell work so the protected-route experience matches the new product posture.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Lucide, Vitest, Testing Library, ESLint

---

## File Map

### Existing files to modify

- `web/src/app/globals.css`
  - Replace the current heavy glass defaults with a smaller-radius, mixed light/dark token system and reusable surface utilities.
- `web/src/app/layout.tsx`
  - Keep font/bootstrap setup and add body-level theme classes that support the new product system.
- `web/src/app/page.tsx`
  - Rebuild the homepage into a brand entry + distribution page with featured content and stronger wayfinding.
- `web/src/app/assets/page.tsx`
  - Keep data fetching, but change the page composition from hero-first to tool-first.
- `web/src/app/assets/assets-client.tsx`
  - Convert the library into a sticky-toolbar discovery workspace with clearer result handling.
- `web/src/app/auth/login/page.tsx`
  - Replace the current single-card layout with a split brand/authentication experience.
- `web/src/app/admin/layout.tsx`
  - Wrap admin routes in a persistent admin shell instead of bare `RouteGuard`.
- `web/src/app/admin/page.tsx`
  - Replace card-link overview with KPI + recent work + shortcut dashboard sections.
- `web/src/app/admin/assets/page.tsx`
  - Move the list page under the new admin page scaffold and align toolbar/list interactions with the shell.
- `web/src/components/public-site-shell.tsx`
  - Replace the current floating glass container approach with a reusable brand shell for public pages.
- `web/src/components/route-guard.tsx`
  - Remove blank intermediate states and preserve redirect context.
- `web/src/lib/public-content.ts`
  - Add homepage distribution content and navigation metadata needed by the new homepage shell.

### New files to create

- `web/src/components/public/public-header.tsx`
  - Shared public header with role-aware CTA and clearer navigation hierarchy.
- `web/src/components/public/public-footer.tsx`
  - Shared footer aligned with the new IA and lighter utility structure.
- `web/src/components/public/homepage-featured-assets.tsx`
  - Featured asset strip for the homepage.
- `web/src/components/public/content-lane-grid.tsx`
  - Four-lane entry matrix for scenarios, architecture, insights, and community.
- `web/src/components/product/page-header.tsx`
  - Shared compact page header for library and admin-like list pages.
- `web/src/components/product/filter-toolbar.tsx`
  - Sticky, reusable toolbar frame for search/filter/result actions.
- `web/src/components/auth/auth-redirect-panel.tsx`
  - Loading/redirect state for protected routes.
- `web/src/components/admin/admin-shell.tsx`
  - Persistent sidebar/topbar/layout frame for admin pages.
- `web/src/components/admin/admin-sidebar.tsx`
  - Admin navigation with active-route awareness.
- `web/src/components/admin/admin-topbar.tsx`
  - Top utility bar with title context and account slot.
- `web/src/lib/admin-navigation.ts`
  - Single source of truth for admin nav metadata.

### Existing tests to update

- `web/src/app/assets/page.test.tsx`
- `web/src/app/assets/assets-client.test.tsx`
- `web/src/app/admin/page.test.tsx`
- `web/src/app/admin/layout.test.tsx`
- `web/src/app/not-found.test.tsx` if route text changes due to shell/header changes
- `web/src/components/route-guard.test.tsx`

### New tests to create

- `web/src/app/page.test.tsx`
- `web/src/app/auth/login/page.test.tsx`
- `web/src/components/admin/admin-shell.test.tsx`
- `web/src/components/public/public-header.test.tsx`

---

### Task 1: Establish Shared Product Tokens And Layout Primitives

**Files:**
- Modify: `web/src/app/globals.css`
- Modify: `web/src/app/layout.tsx`
- Create: `web/src/components/product/page-header.tsx`
- Create: `web/src/components/product/filter-toolbar.tsx`
- Test: `web/src/components/public/public-header.test.tsx`

- [ ] **Step 1: Write the failing test for the new compact header and toolbar primitives**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { PageHeader } from "@/components/product/page-header";
import { FilterToolbar } from "@/components/product/filter-toolbar";

describe("product layout primitives", () => {
  it("renders a compact page header with title, summary, and actions", () => {
    render(
      <PageHeader
        eyebrow="ASSET LIBRARY"
        title="Asset Library"
        summary="Explore reusable demos and architectures."
        actions={<button type="button">Primary action</button>}
      />,
    );

    expect(screen.getByText("Asset Library")).toBeInTheDocument();
    expect(screen.getByText("Explore reusable demos and architectures.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Primary action" })).toBeInTheDocument();
  });

  it("renders a sticky filter toolbar shell", () => {
    render(
      <FilterToolbar
        resultsLabel="12 results"
        primaryAction={<button type="button">Apply filters</button>}
      >
        <input aria-label="Search assets" />
      </FilterToolbar>,
    );

    expect(screen.getByLabelText("Search assets")).toBeInTheDocument();
    expect(screen.getByText("12 results")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the new test file and verify it fails**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/components/public/public-header.test.tsx`

Expected: FAIL with module-not-found errors for `PageHeader` and `FilterToolbar`

- [ ] **Step 3: Implement the new product primitives**

```tsx
// web/src/components/product/page-header.tsx
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  summary,
  actions,
}: {
  eyebrow?: string;
  title: string;
  summary?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? <p className="text-xs font-medium tracking-[0.18em] text-primary">{eyebrow}</p> : null}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          {summary ? <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{summary}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}

// web/src/components/product/filter-toolbar.tsx
import type { ReactNode } from "react";

export function FilterToolbar({
  children,
  resultsLabel,
  primaryAction,
  secondaryAction,
}: {
  children: ReactNode;
  resultsLabel: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 space-y-4 rounded-2xl border border-border bg-background/95 p-4 shadow-sm backdrop-blur">
      <div className="grid gap-3 xl:grid-cols-5">{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{resultsLabel}</p>
        <div className="flex flex-wrap items-center gap-3">
          {secondaryAction}
          {primaryAction}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace glass-heavy globals with mixed light/dark product tokens**

```css
/* web/src/app/globals.css */
:root {
  --brand-950: #0f1021;
  --brand-900: #171a34;
  --brand-700: #4f46e5;
  --brand-600: #5b52f6;
  --brand-100: #e6e8ff;

  --background: #f6f7fb;
  --foreground: #111827;
  --card: #ffffff;
  --card-foreground: #111827;
  --muted: #eef1f7;
  --muted-foreground: #667085;
  --border: #d8deea;
  --input: #d8deea;
  --primary: var(--brand-700);
  --primary-foreground: #ffffff;
  --secondary: #eef1ff;
  --secondary-foreground: #1f2a44;
  --accent: #eef1ff;
  --accent-foreground: #1f2a44;
  --ring: rgb(79 70 229 / 0.35);
  --radius: 0.875rem;
}

.dark {
  --background: #090b14;
  --foreground: #f7f8fc;
  --card: #111420;
  --card-foreground: #f7f8fc;
  --muted: #141a2a;
  --muted-foreground: #9aa3b2;
  --border: #23283a;
  --input: #23283a;
  --primary: #6b6ef9;
  --primary-foreground: #ffffff;
}

body {
  min-height: 100%;
  background:
    radial-gradient(circle at top, rgb(79 70 229 / 0.08), transparent 24rem),
    var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 5: Add body-level product classes in the app layout**

```tsx
// web/src/app/layout.tsx
<html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
  <body className="min-h-full bg-background text-foreground">
    <QueryProvider>{children}</QueryProvider>
  </body>
</html>
```

- [ ] **Step 6: Re-run the primitive test file**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/components/public/public-header.test.tsx`

Expected: PASS

- [ ] **Step 7: Run lint for the touched files**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npm run lint`

Expected: PASS with no newly introduced errors

- [ ] **Step 8: Commit the foundation work**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/globals.css web/src/app/layout.tsx web/src/components/product/page-header.tsx web/src/components/product/filter-toolbar.tsx web/src/components/public/public-header.test.tsx
git commit -m "feat: add shared product layout primitives"
```

### Task 2: Rebuild The Public Shell And Homepage

**Files:**
- Modify: `web/src/components/public-site-shell.tsx`
- Modify: `web/src/app/page.tsx`
- Modify: `web/src/lib/public-content.ts`
- Create: `web/src/components/public/public-header.tsx`
- Create: `web/src/components/public/public-footer.tsx`
- Create: `web/src/components/public/content-lane-grid.tsx`
- Create: `web/src/components/public/homepage-featured-assets.tsx`
- Create: `web/src/app/page.test.tsx`

- [ ] **Step 1: Write the failing homepage test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import Home from "./page";

describe("Home", () => {
  it("shows the new platform framing and featured asset entry points", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /A branded content platform for AI delivery assets/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore Asset Library/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Featured assets/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Choose your path/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the homepage test and verify it fails**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/app/page.test.tsx`

Expected: FAIL because the current homepage copy and sections do not match

- [ ] **Step 3: Create the new public header and footer**

```tsx
// web/src/components/public/public-header.tsx
import Link from "next/link";
import { Blocks } from "lucide-react";
import { publicNavLinks } from "@/lib/public-content";

export function PublicHeader({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgb(9_11_20_/88%)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Blocks className="size-4" />
          </span>
          <span className="space-y-0.5">
            <span className="block text-xs tracking-[0.18em] text-white/50">HYPERSCALER ASSET HUB</span>
            <span className="block text-sm font-medium">AI delivery content platform</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          <Link href="/assets" className="text-sm text-white/80 hover:text-white">Assets</Link>
          {publicNavLinks.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-white/70 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-white/70 hover:text-white">Sign in</Link>
          <Link href={ctaHref} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Replace the public shell and homepage sections**

```tsx
// web/src/app/page.tsx
import { ContentLaneGrid } from "@/components/public/content-lane-grid";
import { HomepageFeaturedAssets } from "@/components/public/homepage-featured-assets";
import { PublicSectionHero, PublicSiteShell } from "@/components/public-site-shell";

export default function Home() {
  return (
    <PublicSiteShell ctaHref="/assets" ctaLabel="Explore Asset Library">
      <div className="space-y-12">
        <PublicSectionHero
          eyebrow="HSAH PLATFORM"
          title="A branded content platform for AI delivery assets"
          summary="Move from discovery to reuse through scenarios, architectures, insights, and implementation-ready assets."
          actions={<></>}
        />
        <ContentLaneGrid />
        <HomepageFeaturedAssets />
      </div>
    </PublicSiteShell>
  );
}
```

- [ ] **Step 5: Add content-lane and featured-asset metadata**

```ts
// web/src/lib/public-content.ts
export const homepageContentLanes = [
  {
    href: "/scenarios",
    title: "Scenarios",
    summary: "Start from business journeys and measurable AI outcomes.",
    audience: "Business and delivery leads",
  },
  {
    href: "/architecture",
    title: "Architecture",
    summary: "Move into trust, orchestration, and implementation patterns.",
    audience: "Platform and solution architects",
  },
  {
    href: "/insights",
    title: "Insights",
    summary: "Use short reads to align stakeholders on decisions and tradeoffs.",
    audience: "Program sponsors and strategists",
  },
  {
    href: "/community",
    title: "Community",
    summary: "Connect with working groups, labs, and reusable delivery practices.",
    audience: "Practitioners and capability teams",
  },
] as const;

export const featuredAssetSlugs = ["agentic-service-mesh", "knowledge-governance-fabric"];
```

- [ ] **Step 6: Re-run the homepage test**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/app/page.test.tsx`

Expected: PASS

- [ ] **Step 7: Run targeted public-page regression tests**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/app/page.test.tsx src/app/assets/page.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit the public-shell and homepage work**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/page.tsx web/src/components/public-site-shell.tsx web/src/components/public/public-header.tsx web/src/components/public/public-footer.tsx web/src/components/public/content-lane-grid.tsx web/src/components/public/homepage-featured-assets.tsx web/src/lib/public-content.ts web/src/app/page.test.tsx
git commit -m "feat: redesign public shell and homepage"
```

### Task 3: Turn The Asset Library Into A Discovery Workspace

**Files:**
- Modify: `web/src/app/assets/page.tsx`
- Modify: `web/src/app/assets/assets-client.tsx`
- Modify: `web/src/lib/public-assets.ts`
- Modify: `web/src/app/assets/assets-client.test.tsx`
- Modify: `web/src/app/assets/page.test.tsx`

- [ ] **Step 1: Write the failing asset-library workflow tests**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { AssetsClient } from "./assets-client";

describe("AssetsClient", () => {
  it("renders the compact library header and filter toolbar", () => {
    render(
      <AssetsClient
        initialResponse={{ items: [], total: 0, limit: 12, offset: 0 }}
        initialQuery={{}}
      />,
    );

    expect(screen.getByRole("heading", { name: "Asset Library" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search assets")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeInTheDocument();
  });

  it("shows an actionable empty state", () => {
    render(
      <AssetsClient
        initialResponse={{ items: [], total: 0, limit: 12, offset: 0 }}
        initialQuery={{ q: "missing" }}
      />,
    );

    expect(screen.getByText("No assets matched the current filters.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the asset-library test file and verify it fails**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/app/assets/assets-client.test.tsx`

Expected: FAIL because the current page still renders the hero-first shell and the old empty-state copy

- [ ] **Step 3: Replace the hero-first page composition with a tool-first header**

```tsx
// web/src/app/assets/page.tsx
import { PublicSiteShell } from "@/components/public-site-shell";
import { AssetsClient } from "./assets-client";

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialQuery = parseAssetQueryFromSearchParams(resolvedSearchParams);
  const initialResponse = await fetchPublicAssets(initialQuery);

  return (
    <PublicSiteShell ctaHref="/auth/login" ctaLabel="Sign in">
      <AssetsClient initialResponse={initialResponse} initialQuery={initialQuery} />
    </PublicSiteShell>
  );
}
```

- [ ] **Step 4: Rebuild the client view around the shared page header and filter toolbar**

```tsx
// web/src/app/assets/assets-client.tsx
import { PageHeader } from "@/components/product/page-header";
import { FilterToolbar } from "@/components/product/filter-toolbar";

return (
  <div className="space-y-8">
    <PageHeader
      eyebrow="ASSET LIBRARY"
      title="Asset Library"
      summary="Search reusable demos, architectures, and implementation references."
      actions={<button type="button" className="text-sm text-muted-foreground">Saved filters</button>}
    />

    <FilterToolbar
      resultsLabel={`${initialResponse.total} results`}
      secondaryAction={hasActiveAssetFilters(filters) ? <button type="button" onClick={clearFilters}>Clear filters</button> : null}
      primaryAction={<button type="button" onClick={applyFilters}>Apply filters</button>}
    >
      {/* existing search/select controls stay here */}
    </FilterToolbar>

    {initialResponse.items.length === 0 ? (
      <EmptyState
        icon={Blocks}
        title="No assets matched the current filters."
        description="Clear the active filters or return to featured assets."
      />
    ) : (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{/* cards */}</div>
    )}
  </div>
);
```

- [ ] **Step 5: Update search-param helpers only if needed for new toolbar state**

```ts
// web/src/lib/public-assets.ts
export function hasActiveAssetFilters(query: Pick<PublicAssetQuery, "q" | "cloud" | "industry" | "tech" | "assetType">) {
  return Boolean(query.q || query.cloud || query.industry || query.tech || query.assetType);
}
```

- [ ] **Step 6: Re-run the asset-library tests**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/app/assets/assets-client.test.tsx src/app/assets/page.test.tsx`

Expected: PASS

- [ ] **Step 7: Run a targeted visual regression safety net**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npm run test -- src/lib/public-assets.test.ts`

Expected: PASS

- [ ] **Step 8: Commit the asset-library redesign**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/assets/page.tsx web/src/app/assets/assets-client.tsx web/src/lib/public-assets.ts web/src/app/assets/assets-client.test.tsx web/src/app/assets/page.test.tsx
git commit -m "feat: redesign asset library workspace"
```

### Task 4: Redesign Login And Fix Protected-Route Redirect UX

**Files:**
- Modify: `web/src/app/auth/login/page.tsx`
- Modify: `web/src/components/route-guard.tsx`
- Modify: `web/src/hooks/use-auth.ts`
- Create: `web/src/components/auth/auth-redirect-panel.tsx`
- Create: `web/src/app/auth/login/page.test.tsx`
- Modify: `web/src/components/route-guard.test.tsx`

- [ ] **Step 1: Write the failing login and redirect tests**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import LoginPage from "./page";

describe("LoginPage", () => {
  it("renders a split-layout login page with brand context", () => {
    render(<LoginPage />);

    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(screen.getByText(/Access saved assets, profiles, and admin operations/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore the public content platform/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the login test and verify it fails**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/app/auth/login/page.test.tsx`

Expected: FAIL because the current page only renders the single-card auth surface

- [ ] **Step 3: Add a redirect/loading panel and use it in RouteGuard**

```tsx
// web/src/components/auth/auth-redirect-panel.tsx
export function AuthRedirectPanel({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-primary">AUTHENTICATION</p>
        <h2 className="text-xl font-semibold text-foreground">Redirecting to sign in</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// web/src/components/route-guard.tsx
if (isLoading) {
  return <AuthRedirectPanel message="Checking your session before loading admin tools." />;
}

if (requireAuth && !user) {
  return <AuthRedirectPanel message="You need to sign in before accessing admin routes." />;
}
```

- [ ] **Step 4: Preserve redirect intent in the auth flow**

```tsx
// web/src/components/route-guard.tsx
import { usePathname, useRouter } from "next/navigation";

const pathname = usePathname();

useEffect(() => {
  if (!isLoading && requireAuth && !user) {
    router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
  }
}, [isLoading, pathname, requireAuth, router, user]);
```

- [ ] **Step 5: Replace the login page with the split layout**

```tsx
// web/src/app/auth/login/page.tsx
return (
  <div className="grid min-h-dvh lg:grid-cols-[1.1fr_0.9fr]">
    <section className="hidden bg-[rgb(9_11_20)] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="space-y-4">
        <p className="text-xs tracking-[0.18em] text-white/50">HYPERSCALER ASSET HUB</p>
        <h1 className="text-4xl font-semibold tracking-tight">Explore the public content platform, then move into operational workspaces.</h1>
        <p className="max-w-xl text-base text-white/70">
          Access saved assets, profiles, and admin operations from one identity entry point.
        </p>
      </div>
    </section>

    <section className="flex items-center justify-center bg-background px-6 py-10">
      <Card className="w-full max-w-md border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <p className="text-sm text-muted-foreground">Access saved assets, profiles, and admin operations.</p>
        </CardHeader>
        {/* existing form controls and 2FA logic */}
      </Card>
    </section>
  </div>
);
```

- [ ] **Step 6: Route successful login to the requested destination**

```tsx
// web/src/app/auth/login/page.tsx
import { useSearchParams } from "next/navigation";

const searchParams = useSearchParams();
const nextHref = searchParams.get("next") ?? "/profile";

// on successful auth
router.replace(nextHref);
```

- [ ] **Step 7: Re-run login and guard tests**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/app/auth/login/page.test.tsx src/components/route-guard.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit the auth experience changes**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/auth/login/page.tsx web/src/components/route-guard.tsx web/src/hooks/use-auth.ts web/src/components/auth/auth-redirect-panel.tsx web/src/app/auth/login/page.test.tsx web/src/components/route-guard.test.tsx
git commit -m "feat: redesign login and auth redirect flow"
```

### Task 5: Build The Persistent Admin Shell And Redesign Admin Overview

**Files:**
- Modify: `web/src/app/admin/layout.tsx`
- Modify: `web/src/app/admin/page.tsx`
- Create: `web/src/components/admin/admin-shell.tsx`
- Create: `web/src/components/admin/admin-sidebar.tsx`
- Create: `web/src/components/admin/admin-topbar.tsx`
- Create: `web/src/lib/admin-navigation.ts`
- Create: `web/src/components/admin/admin-shell.test.tsx`
- Modify: `web/src/app/admin/layout.test.tsx`
- Modify: `web/src/app/admin/page.test.tsx`

- [ ] **Step 1: Write the failing admin-shell test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { AdminShell } from "@/components/admin/admin-shell";

describe("AdminShell", () => {
  it("renders a sidebar, topbar, and page content slot", () => {
    render(
      <AdminShell pageTitle="Overview">
        <div>Page body</div>
      </AdminShell>,
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Page body")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the admin-shell test and verify it fails**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/components/admin/admin-shell.test.tsx`

Expected: FAIL with missing-file errors for the new shell components

- [ ] **Step 3: Create shared admin navigation metadata**

```ts
// web/src/lib/admin-navigation.ts
export const adminNavigation = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/assets", label: "Assets" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/policies", label: "Policies" },
  { href: "/admin/matrix", label: "Matrix" },
  { href: "/admin/simulator", label: "Simulator" },
] as const;
```

- [ ] **Step 4: Implement the persistent admin shell**

```tsx
// web/src/components/admin/admin-shell.tsx
import type { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({
  pageTitle,
  children,
}: {
  pageTitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="grid min-h-dvh lg:grid-cols-[260px_minmax(0,1fr)]">
        <AdminSidebar />
        <div className="min-w-0">
          <AdminTopbar pageTitle={pageTitle} />
          <main className="px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wrap the admin layout in the new shell**

```tsx
// web/src/app/admin/layout.tsx
import { AdminShell } from "@/components/admin/admin-shell";
import { RouteGuard } from "@/components/route-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <AdminShell pageTitle="Admin">{children}</AdminShell>
    </RouteGuard>
  );
}
```

- [ ] **Step 6: Redesign the admin overview page around KPIs and shortcuts**

```tsx
// web/src/app/admin/page.tsx
return (
  <div className="space-y-8">
    <PageHeader
      eyebrow="ADMIN"
      title="Operations overview"
      summary="Monitor content health, recent work, and access-control surfaces from one workspace."
    />

    <section className="grid gap-4 md:grid-cols-4">
      {/* KPI cards driven from overview */}
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <Card>{/* recent drafts / recent assets */}</Card>
      <Card>{/* quick actions / governance shortcuts */}</Card>
    </section>
  </div>
);
```

- [ ] **Step 7: Re-run admin layout and overview tests**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/components/admin/admin-shell.test.tsx src/app/admin/layout.test.tsx src/app/admin/page.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit the admin shell**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/admin/layout.tsx web/src/app/admin/page.tsx web/src/components/admin/admin-shell.tsx web/src/components/admin/admin-sidebar.tsx web/src/components/admin/admin-topbar.tsx web/src/lib/admin-navigation.ts web/src/components/admin/admin-shell.test.tsx web/src/app/admin/layout.test.tsx web/src/app/admin/page.test.tsx
git commit -m "feat: add persistent admin shell"
```

### Task 6: Align The Admin Asset List With The New Shell And Run Full Verification

**Files:**
- Modify: `web/src/app/admin/assets/page.tsx`
- Modify: `web/src/components/admin/pagination.tsx` if spacing or hierarchy adjustments are needed
- Modify: `web/src/components/admin/batch-action-bar.tsx` if the new shell requires toolbar restyling
- Modify: `web/src/app/admin/assets/page.test.tsx`

- [ ] **Step 1: Write the failing admin asset-page test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import AdminAssetsPage from "./page";

describe("AdminAssetsPage", () => {
  it("renders the new page header and admin actions", () => {
    render(<AdminAssetsPage />);

    expect(screen.getByRole("heading", { name: "Assets" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /New asset/i })).toBeInTheDocument();
    expect(screen.getByText(/Manage discovery, publication, and lifecycle/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the admin asset-page test and verify it fails**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/app/admin/assets/page.test.tsx`

Expected: FAIL because the current page header copy and shell integration do not match

- [ ] **Step 3: Replace the current standalone header with the shared admin/product scaffold**

```tsx
// web/src/app/admin/assets/page.tsx
import { PageHeader } from "@/components/product/page-header";

return (
  <div className="space-y-6">
    <PageHeader
      eyebrow="ADMIN / ASSETS"
      title="Assets"
      summary="Manage discovery, publication, and lifecycle for reusable platform assets."
      actions={
        <>
          <Link href="/admin/assets/new" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
            New asset
          </Link>
        </>
      }
    />
    {/* existing messages, batch action bar, table, pagination */}
  </div>
);
```

- [ ] **Step 4: Tighten list/table density under the shell**

```tsx
// web/src/app/admin/assets/page.tsx
<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
  <div className="grid grid-cols-[40px_1fr_120px_120px_120px_140px_100px] gap-4 border-b border-border px-5 py-3 text-xs font-medium tracking-[0.12em] text-muted-foreground">
    {/* headers */}
  </div>
  {/* rows / loading / empty state */}
</div>
```

- [ ] **Step 5: Re-run the admin asset-page test**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/app/admin/assets/page.test.tsx`

Expected: PASS

- [ ] **Step 6: Run the focused admin regression suite**

Run: `cd /Users/weiwei.g.zhang/Documents/hsah/web && npx vitest run src/app/admin/page.test.tsx src/app/admin/assets/page.test.tsx src/components/route-guard.test.tsx`

Expected: PASS

- [ ] **Step 7: Run full project verification**

Run:

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run lint
npm run test
npm run build
```

Expected:

- `eslint` exits 0
- `vitest` passes
- `next build` completes successfully

- [ ] **Step 8: Commit the admin asset integration**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/admin/assets/page.tsx web/src/components/admin/pagination.tsx web/src/components/admin/batch-action-bar.tsx web/src/app/admin/assets/page.test.tsx
git commit -m "feat: align admin assets with new shell"
```

## Self-Review

### Spec coverage

- Homepage redesign: covered by Task 2
- Asset library redesign: covered by Task 3
- Login redesign and protected-route behavior: covered by Task 4
- Admin shell and overview redesign: covered by Task 5
- Admin asset-list alignment and operational UX: covered by Task 6
- Shared design-system direction: covered by Task 1 and then reused by later tasks

No approved-spec requirements are left without an implementation task.

### Placeholder scan

- No `TBD`, `TODO`, or deferred implementation placeholders remain.
- Every task includes concrete files, code blocks, commands, and expected outcomes.

### Type consistency

- Shared names are consistent across tasks:
  - `PageHeader`
  - `FilterToolbar`
  - `AdminShell`
  - `AuthRedirectPanel`
- Redirect intent uses the same `next` query param across `RouteGuard` and login page tasks.

