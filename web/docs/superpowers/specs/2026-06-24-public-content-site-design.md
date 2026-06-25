# Public Content Site Design

Date: 2026-06-24
Scope: `/Users/weiwei.g.zhang/Documents/hsah/web`
Status: approved-in-chat, pending written-spec review

## Goal

Complete the missing public content sections for the web app by adding:

- `scenarios`
- `architecture`
- `insights`
- `community`
- `about`

Also add the necessary detail pages for content collections, while avoiding changes under:

- `src/app/admin`
- `src/app/auth`
- `src/app/assets`

The work may lightly adjust the homepage and root shared navigation so that the new public routes are discoverable.

## Constraints

- Only modify files inside `web`.
- Preserve the existing dark premium visual tone and token system from `src/app/globals.css`.
- Do not introduce emoji as icons.
- Use an existing declared icon library. The implementation will use `lucide-react`.
- Prefer static local content for the new sections so the pages build without backend dependencies.
- Keep route structure App Router native and compatible with Next.js 16 async route params.

## Information Architecture

Top-level public routes:

- `/`
- `/assets`
- `/scenarios`
- `/architecture`
- `/insights`
- `/community`
- `/about`

Detail routes:

- `/scenarios/[slug]`
- `/architecture/[slug]`
- `/insights/[slug]`
- `/community/[slug]`

No detail page is required for `/about`.

## Content Model

The new routes will be driven by local static content objects in `src/lib`.

### Scenario item

- `slug`
- `title`
- `eyebrow`
- `summary`
- `industry`
- `businessOutcome`
- `tags`
- `metrics`
- `phases`
- `relatedArchitectureSlugs`

### Architecture item

- `slug`
- `title`
- `eyebrow`
- `summary`
- `focus`
- `layers`
- `governance`
- `deploymentNotes`
- `relatedScenarioSlugs`

### Insight item

- `slug`
- `title`
- `category`
- `summary`
- `publishDate`
- `readTime`
- `keyPoints`
- `bodySections`

### Community item

- `slug`
- `title`
- `format`
- `summary`
- `audience`
- `dateLabel`
- `location`
- `agenda`
- `resources`

## UX Structure

### Shared shell

Add a lightweight public site shell with:

- top navigation
- compact brand mark / title
- primary CTA to `/assets`
- footer with section links

The shared shell applies to public pages only and must not alter admin or auth flows.

### Homepage

Keep the existing hero direction, but add clear entry points to the new information sections:

- primary navigation
- a compact section index / highlights area
- stronger discoverability for the new content routes

### Listing pages

Each collection page follows a consistent structure:

- intro hero
- short positioning copy
- filter-like metadata chips or category labels
- card grid
- section CTA

### Detail pages

Each detail page follows a consistent structure:

- breadcrumb/back link
- page header
- supporting metadata
- 2-column or stacked content sections
- related content links

## Component Plan

Reusable components to add under `src/components`:

- public navigation
- public footer
- section hero
- metric strip
- content card
- detail page header
- related links block

If simpler, some small components may live together in a single `public-site.tsx` file to keep the footprint low.

## Data Flow

- All new content pages read from local static TypeScript data.
- Listing pages map arrays into cards.
- Detail pages resolve items by `slug`.
- Unknown slugs return `notFound()`.

## Route Boundaries

Implementation will only touch:

- `src/app/page.tsx`
- `src/app/layout.tsx` or public shared components consumed by it
- new route folders under `src/app`
- new shared components under `src/components`
- new local content modules under `src/lib`

Implementation will not modify:

- `src/app/admin/**/*`
- `src/app/auth/**/*`
- `src/app/assets/**/*`

## Visual Direction

- Keep the current deep dark base and glass surfaces.
- Reduce reliance on loud purple or magenta gradients for the new content pages.
- Use typography, spacing, borders, and restrained accent usage to make the public content site feel more editorial and structured.

## Verification

After implementation:

- run `npm run lint`
- run `npm run build`
- report changed files
- report route list
- report lint and build outcomes

## Self-review

- No placeholder sections remain.
- Route scope is limited to public content pages.
- Detail pages are explicitly included for the four collection sections.
- The design does not depend on missing backend APIs.
