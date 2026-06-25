# Public Content Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a discoverable public content site in `web` with `scenarios`, `architecture`, `insights`, `community`, `about`, supporting detail pages, and lightweight homepage/global navigation updates.

**Architecture:** Keep all new public content frontend-only and driven by local TypeScript data under `src/lib`. Add a shared public shell component for consistent navigation, footer, and page framing without changing `admin`, `auth`, or `assets` route files.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, `lucide-react`

---

### Task 1: Add static public content data

**Files:**
- Create: `src/lib/public-content.ts`

- [ ] **Step 1: Define typed local content collections**

```ts
export type ScenarioItem = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  industry: string;
  businessOutcome: string;
  tags: string[];
  metrics: Array<{ label: string; value: string }>;
  phases: Array<{ title: string; description: string }>;
  relatedArchitectureSlugs: string[];
};
```

- [ ] **Step 2: Add architecture, insight, and community types plus seeded data**

```ts
export const scenarios: ScenarioItem[] = [
  {
    slug: "intelligent-customer-operations",
    title: "Intelligent Customer Operations",
    eyebrow: "Scenario",
    summary: "AI-assisted service operations with case routing and knowledge grounding.",
    industry: "Telecom",
    businessOutcome: "Reduce handling time while improving first-contact resolution.",
    tags: ["Contact Center", "Knowledge", "Automation"],
    metrics: [{ label: "AHT Reduction", value: "28%" }],
    phases: [{ title: "Discover", description: "Map intent, policy, and channel data." }],
    relatedArchitectureSlugs: ["agentic-service-mesh"],
  },
];
```

- [ ] **Step 3: Export lookup helpers**

```ts
export function getScenarioBySlug(slug: string) {
  return scenarios.find((item) => item.slug === slug) ?? null;
}
```

### Task 2: Add shared public site components

**Files:**
- Create: `src/components/public-site-shell.tsx`

- [ ] **Step 1: Create shared navigation and footer component**

```tsx
export function PublicSiteShell({
  children,
  pageTitle,
  pageSummary,
}: {
  children: React.ReactNode;
  pageTitle?: string;
  pageSummary?: string;
}) {
  return <div>{children}</div>;
}
```

- [ ] **Step 2: Add reusable section, card, and detail helpers**

```tsx
export function PublicSectionHero(props: {
  eyebrow: string;
  title: string;
  summary: string;
}) {
  return <section>{props.title}</section>;
}
```

### Task 3: Update homepage to mount public navigation

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Wrap homepage with the shared public shell**

```tsx
import { PublicSiteShell } from "@/components/public-site-shell";

export default function Home() {
  return (
    <PublicSiteShell>
      <div>...</div>
    </PublicSiteShell>
  );
}
```

- [ ] **Step 2: Add discoverability blocks for new public sections**

```tsx
const sectionLinks = [
  { href: "/scenarios", label: "Scenarios" },
  { href: "/architecture", label: "Architecture" },
];
```

### Task 4: Implement `scenarios` list and detail pages

**Files:**
- Create: `src/app/scenarios/page.tsx`
- Create: `src/app/scenarios/[slug]/page.tsx`

- [ ] **Step 1: Build the scenarios listing page from local data**

```tsx
import { scenarios } from "@/lib/public-content";

export default function ScenariosPage() {
  return <div>{scenarios.map((item) => item.title)}</div>;
}
```

- [ ] **Step 2: Build the scenario detail page with `notFound()` guard**

```tsx
import { notFound } from "next/navigation";
import { getScenarioBySlug } from "@/lib/public-content";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getScenarioBySlug(slug);
  if (!item) notFound();
  return <div>{item.title}</div>;
}
```

### Task 5: Implement `architecture` list and detail pages

**Files:**
- Create: `src/app/architecture/page.tsx`
- Create: `src/app/architecture/[slug]/page.tsx`

- [ ] **Step 1: Render architecture cards from local data**

```tsx
import { architectures } from "@/lib/public-content";
```

- [ ] **Step 2: Render architecture detail layers and governance**

```tsx
const item = getArchitectureBySlug(slug);
if (!item) notFound();
```

### Task 6: Implement `insights` list and detail pages

**Files:**
- Create: `src/app/insights/page.tsx`
- Create: `src/app/insights/[slug]/page.tsx`

- [ ] **Step 1: Build insight list page**

```tsx
import { insights } from "@/lib/public-content";
```

- [ ] **Step 2: Build article-style insight detail page**

```tsx
const item = getInsightBySlug(slug);
if (!item) notFound();
```

### Task 7: Implement `community` list and detail pages

**Files:**
- Create: `src/app/community/page.tsx`
- Create: `src/app/community/[slug]/page.tsx`

- [ ] **Step 1: Build community page with event and program cards**

```tsx
import { communityItems } from "@/lib/public-content";
```

- [ ] **Step 2: Build community detail page with agenda and resources**

```tsx
const item = getCommunityItemBySlug(slug);
if (!item) notFound();
```

### Task 8: Implement `about` page

**Files:**
- Create: `src/app/about/page.tsx`

- [ ] **Step 1: Build editorial about page with mission, capabilities, and CTA**

```tsx
export default function AboutPage() {
  return <div>About</div>;
}
```

### Task 9: Verify implementation

**Files:**
- Modify: none

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

- [ ] **Step 3: Report changed files, route list, and verification results**

```text
Include changed file list, page routes, lint outcome, and build outcome.
```
