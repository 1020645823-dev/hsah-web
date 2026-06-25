# Phase 7: Quality, UX & Code Quality Design — PRD

**Document**: `2026-06-25-phase7-quality-ux-code-design.md`  
**Project**: Hyperscaler Asset Hub (HSAH)  
**Phase**: 7 — Quality Infrastructure, UX Optimization, Code Quality  
**Date**: 2026-06-25  
**Status**: Draft

---

## 1. Overview

Phase 7 is a **non-feature, quality-focused phase** that hardens the HSAH platform before scaling to new feature areas. It covers three workstreams:

1. **Quality Infrastructure** — backend linting, expanded test coverage, runtime error resilience, and a proper 404 experience.
2. **UX Optimization** — loading skeletons, empty states, intelligent data caching via React Query, and responsive design improvements.
3. **Code Quality** — eliminate remaining lint errors, remove TODO debt, adopt `next/image` for performance, and centralize route guards.

The goal is to raise the **production-readiness bar** so that subsequent feature phases can build on a stable, well-tested, and polished foundation.

---

## 2. Goals & Success Criteria

| Goal | Success Criteria |
|---|---|
| Backend lint passes cleanly | `ruff check .` returns zero errors |
| Test coverage increases | Frontend unit test coverage ≥ 60% (lines); backend ≥ 50% |
| No runtime crashes from render errors | Error Boundary catches and recovers from all component tree errors |
| 404 pages exist for all unmatched routes | Custom `not-found.tsx` in App Router; no default Next.js 404 |
| Loading UX is consistent | Every async data surface shows Skeleton; no raw "Loading..." text |
| Empty states are informative | Every list/table has a designed Empty State with icon, message, and action |
| Data caching reduces redundant fetches | React Query `staleTime` configured; no duplicate API calls on navigation |
| Mobile experience is usable | Sidebar collapses on mobile; tables scroll horizontally; modals fit viewport |
| Zero lint errors | `next lint` and `ruff check` both pass |
| No TODOs in source | `grep -r "TODO\|FIXME\|HACK" src/ api/` returns empty |
| All images use `next/image` | Zero raw `<img>` tags in `src/` |
| Route guard is centralized | Single HOC/component handles auth redirects; no inline `router.push` in pages |

---

## 3. Scope

### 3.1 In Scope

- **Backend**
  - Add `ruff` to backend Python codebase with `pyproject.toml` configuration
  - Add `pytest-cov` for coverage reporting
  - Write additional backend tests for edge cases and error paths
- **Frontend**
  - Create `ErrorBoundary` class component with fallback UI
  - Create `not-found.tsx` pages for unmatched App Router routes
  - Create reusable `Skeleton` component with multiple variants (card, table-row, text-line)
  - Create reusable `EmptyState` component with Lucide icon, title, description, and action button
  - Integrate `@tanstack/react-query` for data fetching and caching
  - Improve responsive design: mobile sidebar collapse, table overflow, modal sizing
  - Fix all remaining ESLint errors
  - Remove all TODO/FIXME/HACK comments
  - Replace all `<img>` tags with `next/image`
  - Extract global route guard into a reusable HOC or middleware pattern

### 3.2 Out of Scope

- New business features (no new admin pages, no new content types)
- Backend framework changes (stay on FastAPI / equivalent)
- Database schema changes
- CI/CD pipeline changes (covered in a separate DevOps phase)
- Performance optimization beyond image loading and data caching

---

## 4. Workstreams

### 4.1 Quality Infrastructure

#### 4.1.1 Backend Lint (Ruff)

- Add `ruff` as a dev dependency in backend `pyproject.toml`
- Configure rules:
  - `E`, `W` — pycodestyle
  - `F` — Pyflakes
  - `I` — isort (import sorting)
  - `N` — pep8-naming
  - `UP` — pyupgrade
  - `B` — flake8-bugbear
  - `C4` — flake8-comprehensions
  - `SIM` — flake8-simplify
  - `ARG` — flake8-unused-arguments
- Set line length to 100
- Exclude `migrations/`, `venv/`, `.venv/`, `__pycache__/`
- Add `ruff check .` to backend lint script

#### 4.1.2 Additional Tests

- **Backend**: Add tests for:
  - API error responses (400, 401, 403, 404, 500)
  - Validation edge cases (empty strings, max length, special characters)
  - Service layer exceptions being mapped to HTTP responses
- **Frontend**: Add tests for:
  - `ErrorBoundary` fallback rendering and recovery
  - `Skeleton` component renders all variants correctly
  - `EmptyState` renders icon, title, description, and action
  - `not-found.tsx` renders 404 content
  - Route guard redirects unauthenticated users

#### 4.1.3 Error Boundary

- Create `src/components/error-boundary.tsx`
- Class component implementing `componentDidCatch`
- Fallback UI includes:
  - Error message (non-dev builds show generic message)
  - "Retry" button to reset error boundary state
  - "Back to Home" link
- Wrap the root layout or high-level route segments

#### 4.1.4 404 Page

- Create `src/app/not-found.tsx` at the root App Router level
- Create `not-found.tsx` in major route segments if needed (e.g., `/admin/`, `/assets/`)
- Design: large "404" status code, short message, link back to home
- Dark theme consistent with HSAH design system

---

### 4.2 UX Optimization

#### 4.2.1 Skeleton Component

- Location: `src/components/ui/skeleton.tsx`
- Variants:
  - `card` — rounded rectangle with aspect ratio, mimicking content cards
  - `table-row` — horizontal lines mimicking table cells
  - `text-line` — single or multiple lines of varying widths
- Animation: CSS `pulse` (opacity oscillation) using Tailwind `animate-pulse`
- Dark theme: background uses `muted` or `surface-mid` colors
- Usage: replace all inline "Loading..." text in async pages with Skeleton

#### 4.2.2 Empty State Component

- Location: `src/components/ui/empty-state.tsx`
- Props:
  - `icon`: Lucide icon component (e.g., `Inbox`, `SearchX`, `FileQuestion`)
  - `title`: string
  - `description`: string
  - `action`: optional `{ label: string; onClick: () => void; href?: string }`
- Layout: vertically centered, icon at top, title bold, description muted, action button at bottom
- Dark theme: icon uses `color-text-secondary`, text uses design tokens
- Usage: all list/table pages when data array is empty after loading

#### 4.2.3 React Query Integration

- Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- Create `src/components/query-provider.tsx` wrapping the app with `QueryClientProvider`
- Configure `QueryClient`:
  - `staleTime: 5 * 60 * 1000` (5 minutes)
  - `cacheTime: 10 * 60 * 1000` (10 minutes)
  - `retry: 1`
  - `refetchOnWindowFocus: false`
- Migrate at least 3 high-traffic data-fetching pages to use `useQuery` / `useMutation`
- Pattern: `stale-while-revalidate` — show cached data immediately, refetch in background

#### 4.2.4 Responsive Design Improvements

- **Mobile sidebar**: Add collapse/expand toggle on viewports `< lg`; use hamburger menu icon; animate with CSS transitions
- **Table overflow**: Wrap all data tables in `overflow-x-auto` container; ensure horizontal scroll on mobile without breaking layout
- **Modal sizing**: Ensure modals use `max-w-lg` / `max-w-xl` with `mx-4` margin on mobile; prevent overflow on small screens
- **Font scaling**: Ensure no fixed `px` font sizes that break mobile readability; use `text-sm` / `text-base` responsive classes

---

### 4.3 Code Quality

#### 4.3.1 Fix Remaining Lint Errors

- Run `next lint` and fix all reported errors
- Common expected issues:
  - Missing `key` props in list renders
  - Unused imports or variables
  - `any` types without justification
  - Missing dependency arrays in `useEffect`

#### 4.3.2 Clean Up TODOs

- Search for `TODO`, `FIXME`, `HACK`, `XXX` across `src/` and backend
- For each:
  - If trivial, implement immediately
  - If non-trivial, create a tracked issue/comment and remove from source
  - If obsolete, delete

#### 4.3.3 Replace `img` with `next/image`

- Files identified with raw `<img>`:
  - `src/components/content-block-renderer.tsx`
  - `src/components/admin/content-blocks/block-preview.tsx`
  - `src/components/admin/content-blocks/image-block-editor.tsx`
- For each:
  - Import `Image` from `next/image`
  - Add `width` and `height` (or `fill` with `sizes`)
  - Add `alt` text if missing
  - Ensure `unoptimized` is not used unless necessary (e.g., external dynamic images)

#### 4.3.4 Global Route Guard

- Create `src/components/route-guard.tsx` (or HOC)
- Responsibilities:
  - Check authentication state (token / session)
  - Redirect to `/auth/login` if unauthenticated
  - Optionally check role-based access for admin routes
- Usage: wrap admin page components or apply in layout
- Remove inline `router.push` auth checks from individual pages

---

## 5. Dependencies

### New Frontend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@tanstack/react-query` | ^5.x | Data fetching, caching, stale-while-revalidate |
| `@tanstack/react-query-devtools` | ^5.x | DevTools for debugging cache state |

### New Backend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `ruff` | ^0.x | Python linting and formatting |
| `pytest-cov` | ^6.x | Test coverage reporting |

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| React Query migration breaks existing fetch logic | Medium | Migrate one page at a time; keep existing `useEffect` fetch as fallback during transition |
| Error Boundary catches too aggressively | Low | Log errors to monitoring; only show fallback for uncaught render errors |
| `next/image` requires dimensions for external images | Low | Use `fill` + `sizes` for dynamic images; add `unoptimized` for truly unknown sources |
| Mobile sidebar refactor affects desktop layout | Medium | Test on actual mobile viewport; use `lg:` breakpoint consistently |
| Removing TODOs surfaces hidden bugs | Low | Each TODO removal paired with a quick functional test |

---

## 7. Acceptance Checklist

- [ ] `ruff check .` passes with zero errors on backend
- [ ] `pytest --cov` report generated and coverage meets target
- [ ] `next lint` passes with zero errors on frontend
- [ ] `npm run test` (vitest) passes with all new tests green
- [ ] Error Boundary renders fallback when a test error is thrown
- [ ] 404 page renders for unmatched routes
- [ ] Skeleton visible on all async-loading pages
- [ ] Empty State visible on all zero-result list pages
- [ ] React Query DevTools show cache entries after navigation
- [ ] Mobile sidebar collapses and expands correctly
- [ ] Tables scroll horizontally on mobile without clipping
- [ ] Zero `<img>` tags remain in `src/`
- [ ] Zero `TODO` / `FIXME` / `HACK` comments remain in source
- [ ] Route guard redirects unauthenticated users from `/admin/*`

---

## 8. Document History

| Date | Author | Change |
|---|---|---|
| 2026-06-25 | AI Assistant | Initial draft |
