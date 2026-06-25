# Phase 7: Quality, UX & Code Quality — Architecture Design

**Document**: `2026-06-25-phase7-quality-ux-code-architecture.md`  
**Project**: Hyperscaler Asset Hub (HSAH)  
**Phase**: 7 — Quality Infrastructure, UX Optimization, Code Quality  
**Date**: 2026-06-25  
**Status**: Draft

---

## 1. Architecture Overview

Phase 7 introduces no new backend services or API endpoints. Instead, it hardens the existing architecture through:

- **Backend tooling**: `ruff` linting + `pytest-cov` coverage
- **Frontend resilience**: Error Boundary, 404 pages, route guards
- **Frontend UX components**: Skeleton, EmptyState, React Query provider
- **Code quality enforcement**: lint gates, TODO removal, `next/image` adoption

The architecture diagram below shows the new components (green) and their integration points with existing code (grey).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        RootLayout                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────────┐  │  │
│  │  │ QueryClient │  │ ErrorBoundary│  │ RouteGuard (HOC/Layout)  │  │  │
│  │  │  Provider   │  │   (Root)     │  │                           │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────────┬─────────────┘  │  │
│  │         │                │                       │                 │  │
│  │         └────────────────┴───────────────────────┘                 │  │
│  │                              │                                      │  │
│  │                    ┌─────────┴─────────┐                          │  │
│  │                    │   App Router Pages │                          │  │
│  │                    │  (with useQuery)  │                          │  │
│  │                    └─────────┬─────────┘                          │  │
│  │                              │                                      │  │
│  │         ┌────────────────────┼────────────────────┐                 │  │
│  │         │                    │                    │                 │  │
│  │    ┌────┴────┐        ┌─────┴─────┐      ┌────┴────┐            │  │
│  │    │ Skeleton│        │ EmptyState│      │ NotFound│            │  │
│  │    │ (UI)    │        │   (UI)    │      │  (Page) │            │  │
│  │    └─────────┘        └───────────┘      └─────────┘            │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │                    React Query Cache                        │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │  │
│  │  │  │ assets   │  │ users    │  │ roles    │  │ policies │      │  │  │
│  │  │  │ stale 5m │  │ stale 5m │  │ stale 5m │  │ stale 5m │      │  │  │
│  │  │  │ cache 10m│  │ cache 10m│  │ cache 10m│  │ cache 10m│      │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         BACKEND                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────────┐  │  │
│  │  │   FastAPI   │  │   Ruff      │  │   pytest + pytest-cov     │  │  │
│  │  │   Routes    │  │  Linter     │  │   Test Runner             │  │  │
│  │  └─────────────┘  └─────────────┘  └───────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Architecture

### 2.1 Ruff Configuration (`pyproject.toml`)

```toml
[tool.ruff]
target-version = "py311"
line-length = 100
indent-width = 4

[tool.ruff.lint]
select = [
  "E",   # pycodestyle errors
  "W",   # pycodestyle warnings
  "F",   # Pyflakes
  "I",   # isort
  "N",   # pep8-naming
  "UP",  # pyupgrade
  "B",   # flake8-bugbear
  "C4",  # flake8-comprehensions
  "SIM", # flake8-simplify
  "ARG", # flake8-unused-arguments
]
ignore = ["E501"]  # line-length handled by formatter

[tool.ruff.lint.pydocstyle]
convention = "google"

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"

[tool.ruff.lint.isort]
known-first-party = ["hsah"]
```

### 2.2 Lint Rules Rationale

| Rule Set | Purpose | Strictness |
|---|---|---|
| `E`, `W` | Basic Python style consistency | High |
| `F` | Catch undefined names, unused imports | High |
| `I` | Consistent import ordering | Medium |
| `N` | Naming conventions (snake_case, CapWords) | Medium |
| `UP` | Modern Python syntax (py311 features) | Low |
| `B` | Bug-prone patterns | High |
| `C4` | List/dict/set comprehensions | Low |
| `SIM` | Simplification suggestions | Low |
| `ARG` | Unused function arguments | Medium |

### 2.3 Test Coverage with pytest-cov

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "--cov=hsah --cov-report=term-missing --cov-report=html:htmlcov --cov-fail-under=50"
```

- Coverage target: **50% lines** for backend (current baseline unknown; raise iteratively)
- HTML report generated at `htmlcov/index.html`
- Missing line annotations in terminal output for quick debugging

### 2.4 Backend Test Expansion Plan

| Module | Current Tests | New Tests |
|---|---|---|
| API routes | Basic 200s | 400/401/403/404/500 error paths |
| Validation | Happy path | Empty strings, max length, unicode, nulls |
| Service layer | Direct calls | Exception-to-HTTP mapping |
| Auth | Login success | Token expiry, refresh failure, malformed tokens |

---

## 3. Frontend Architecture

### 3.1 Error Boundary

**File**: `src/components/error-boundary.tsx`

```typescript
interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}
```

**Behavior**:
- `static getDerivedStateFromError(error)` → sets `hasError: true`
- `componentDidCatch(error, info)` → logs to console (dev) or monitoring (prod)
- `reset()` → clears error state, triggers re-render of children
- Default fallback: card with error message, "Retry" button, "Back to Home" link

**Placement**:
- Wrap `RootLayout` children for app-wide protection
- Optionally wrap individual route segments for granular recovery

### 3.2 NotFound Page

**File**: `src/app/not-found.tsx` (App Router root)

**Behavior**:
- Rendered by Next.js when no route matches
- Can also be triggered manually via `notFound()` in server components
- Design: large "404" text, brief message, link to home

**Segment-level 404**:
- `src/app/admin/not-found.tsx` for admin-specific 404 styling
- `src/app/assets/not-found.tsx` for asset-specific 404

### 3.3 Skeleton Component Hierarchy

**File**: `src/components/ui/skeleton.tsx`

```typescript
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "table-row" | "text-line";
  lines?: number;           // for text-line variant
  columns?: number;         // for table-row variant
  className?: string;
}
```

**Variants**:

| Variant | DOM Structure | Tailwind Classes |
|---|---|---|
| `default` | Single `div` | `animate-pulse rounded-md bg-muted` |
| `card` | `div` with aspect ratio | `animate-pulse rounded-xl bg-muted h-48` |
| `table-row` | Row of `div`s | `flex gap-4 *:animate-pulse *:rounded-md *:bg-muted` |
| `text-line` | Stacked `div`s | `space-y-2 *:animate-pulse *:rounded-md *:bg-muted` |

**Composition**:
- `Skeleton` is a low-level primitive
- Page-specific skeletons compose multiple `Skeleton` instances:
  - `AssetListSkeleton` = 5× `Skeleton variant="table-row"`
  - `CardGridSkeleton` = 4× `Skeleton variant="card"`

### 3.4 EmptyState Component

**File**: `src/components/ui/empty-state.tsx`

```typescript
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;  // Lucide icon
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}
```

**Layout**:
```
┌─────────────────────────────┐
│         [Icon]              │  ← size-12, color-text-secondary
│                             │
│         Title                 │  ← text-lg font-semibold, text-primary
│                             │
│    Description text           │  ← text-sm text-muted-foreground
│                             │
│      [Action Button]        │  ← optional, variant="outline"
└─────────────────────────────┘
```

**Usage**:
- Replace all `rows.length === 0` inline JSX with `<EmptyState ... />`
- Icon selection per context:
  - Empty list → `Inbox`
  - Empty search → `SearchX`
  - Missing file → `FileQuestion`
  - No permissions → `ShieldAlert`

### 3.5 React Query Provider Setup

**File**: `src/components/query-provider.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

**Integration**:
- Wrap `RootLayout` with `QueryClientProvider`
- Conditionally include `ReactQueryDevtools` in development builds

### 3.6 Data Flow: React Query Cache → Components

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   API Call  │────▶│  QueryCache │────▶│  useQuery   │
│  (fetch)    │     │  (in-memory)│     │  (hook)     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                       ┌────────────────────────┘
                       │
              ┌────────┴────────┐
              │   Component     │
              │  ┌───────────┐  │
              │  │ Skeleton  │  │ ← isPending
              │  │  (show)   │  │
              │  └───────────┘  │
              │  ┌───────────┐  │
              │  │  Data UI  │  │ ← data available
              │  │  (show)   │  │
              │  └───────────┘  │
              │  ┌───────────┐  │
              │  │EmptyState │  │ ← data empty
              │  │  (show)   │  │
              │  └───────────┘  │
              └─────────────────┘
```

**Stale-While-Revalidate Pattern**:
1. User navigates to `/admin/assets`
2. `useQuery({ queryKey: ["assets"], queryFn: fetchAssets })`
3. Cache miss → show `Skeleton`, fetch in background
4. User navigates away, then back
5. Cache hit (data within 5m staleTime) → show cached data immediately
6. Background refetch updates data if changed

### 3.7 Route Guard

**File**: `src/components/route-guard.tsx`

**Approach A: HOC (for client components)**
```typescript
function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: { allowedRoles?: string[] }
): React.FC<P>
```

**Approach B: Layout wrapper (for App Router)**
```typescript
export function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) router.replace("/auth/login");
  }, [isAuthenticated, router]);
  
  if (!isAuthenticated) return <Skeleton variant="card" className="h-screen" />;
  return children;
}
```

**Selected Approach**: Layout wrapper for App Router compatibility.

**Usage**:
```typescript
// src/app/admin/layout.tsx
import { AuthLayout } from "@/components/route-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout allowedRoles={["admin"]}>{children}</AuthLayout>;
}
```

**Cleanup**:
- Remove all `useEffect(() => { if (!token) router.push("/auth/login") }, [...])` from individual pages
- Centralize auth state in `useAuth` hook or context

---

## 4. Component Hierarchy

### 4.1 New Components

```
src/
├── components/
│   ├── error-boundary.tsx          # Class component, root wrapper
│   ├── query-provider.tsx          # React Query client setup
│   ├── route-guard.tsx             # Auth redirect logic
│   └── ui/
│       ├── skeleton.tsx              # Loading placeholder primitive
│       └── empty-state.tsx           # Zero-data state component
├── app/
│   ├── not-found.tsx                 # Root 404 page
│   ├── admin/
│   │   └── not-found.tsx             # Admin 404
│   └── assets/
│       └── not-found.tsx             # Assets 404
```

### 4.2 Dependencies Between New Components

| Component | Depends On | Used By |
|---|---|---|
| `QueryProvider` | `@tanstack/react-query` | `RootLayout` |
| `ErrorBoundary` | React class component APIs | `RootLayout` |
| `RouteGuard` | `useRouter`, `useAuth` | `admin/layout.tsx`, `profile/page.tsx` |
| `Skeleton` | `cn` utility | All async pages |
| `EmptyState` | `lucide-react`, `Button` | All list pages |
| `NotFound` | `Link` from `next/link` | App Router (auto) |

### 4.3 Integration with Existing Components

| Existing Page | Current Loading | New Loading | Current Empty | New Empty |
|---|---|---|---|---|
| `/admin/assets` | `loading ? "..."` | `Skeleton` | inline JSX | `EmptyState` |
| `/admin/users` | `loading ? "..."` | `Skeleton` | inline JSX | `EmptyState` |
| `/admin/roles` | `loading ? "..."` | `Skeleton` | inline JSX | `EmptyState` |
| `/admin/policies` | `loading ? "..."` | `Skeleton` | inline JSX | `EmptyState` |
| `/admin/matrix` | `loading ? "..."` | `Skeleton` | inline JSX | `EmptyState` |
| `/profile` | `loadingUser ? "Loading..."` | `Skeleton` | — | — |

---

## 5. Responsive Design Architecture

### 5.1 Mobile Sidebar

**Current**: Sidebar is always visible, fixed width.

**New Architecture**:
- Sidebar becomes `fixed` / `absolute` on mobile
- Toggle button (hamburger) in header on `md` breakpoint and below
- Sidebar slides in from left with `transform: translateX(-100%)` → `translateX(0)`
- Overlay backdrop on mobile to capture outside clicks
- Body scroll locked when sidebar is open

```
Desktop (>768px):                    Mobile (≤768px):
┌────────┬─────────────────┐        ┌─────────────────┐
│Sidebar │    Main Content   │        │  ≡  Header      │
│        │                   │        ├─────────────────┤
│        │                   │        │                 │
│        │                   │        │  Main Content   │
│        │                   │        │                 │
└────────┴─────────────────┘        └─────────────────┘

Sidebar Open:
┌────┬─────────────────────┐
│Side│  Overlay (click to  │
│bar │   close sidebar)     │
│    │                     │
└────┴─────────────────────┘
```

### 5.2 Table Overflow

**Pattern**: Wrap every table in a scroll container.

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* table content */}
  </table>
</div>
```

- `min-w-full` ensures table maintains column widths
- `overflow-x-auto` enables horizontal scroll on mobile
- No layout breakage on desktop (scroll container has no effect when content fits)

### 5.3 Modal Sizing

**Pattern**: Responsive max-width with margin.

```tsx
<div className="mx-4 w-full max-w-lg md:mx-auto md:max-w-xl">
  {/* modal content */}
</div>
```

- Mobile: `mx-4` provides side padding, `max-w-lg` prevents overflow
- Desktop: `mx-auto` centers, `max-w-xl` allows wider content

---

## 6. Image Architecture

### 6.1 Current State

Three files use raw `<img>` tags:

| File | Image Source | Dimensions Known? |
|---|---|---|
| `content-block-renderer.tsx` | Content block data URL | Yes |
| `block-preview.tsx` | Content block preview URL | Yes |
| `image-block-editor.tsx` | Uploaded image preview | Yes (thumbnail) |

### 6.2 Migration Plan

For each `<img>`:
1. Import `Image` from `next/image`
2. Provide `width` and `height` (or `fill` with `sizes`)
3. Provide meaningful `alt` text
4. Use `className` for styling (Next.js Image supports `className`)
5. For external / dynamic URLs, add `unoptimized` only if the image host does not support Next.js optimization

```tsx
// Before
<img src={block.imageUrl} className="rounded-lg" />

// After
<Image
  src={block.imageUrl}
  alt={block.altText || "Content image"}
  width={400}
  height={300}
  className="rounded-lg"
  unoptimized={block.imageUrl.startsWith("data:")}
/>
```

---

## 7. Testing Architecture

### 7.1 Frontend Tests (Vitest + React Testing Library)

| Component | Test Cases |
|---|---|
| `ErrorBoundary` | 1. Renders children normally. 2. Catches thrown error and shows fallback. 3. Retry button resets state. |
| `Skeleton` | 1. Renders default variant. 2. Renders card variant with correct aspect ratio. 3. Renders text-line with correct line count. |
| `EmptyState` | 1. Renders icon, title, description. 2. Renders action button when action prop provided. 3. Action click handler fires. |
| `NotFound` | 1. Renders 404 status code. 2. Contains link to home. |
| `RouteGuard` | 1. Redirects unauthenticated user. 2. Shows skeleton while checking auth. 3. Renders children when authenticated. |

### 7.2 Backend Tests (pytest)

| Module | Test Cases |
|---|---|
| API error handling | 1. 400 on invalid payload. 2. 401 on missing token. 3. 403 on insufficient permissions. 4. 404 on missing resource. 5. 500 on unexpected exception. |
| Validation | 1. Empty string rejected. 2. Max length exceeded rejected. 3. Unicode accepted. 4. Null field behavior. |
| Service exceptions | 1. Service raises → API returns correct status code. 2. Exception message is not leaked in production. |

---

## 8. Document History

| Date | Author | Change |
|---|---|---|
| 2026-06-25 | AI Assistant | Initial draft |
