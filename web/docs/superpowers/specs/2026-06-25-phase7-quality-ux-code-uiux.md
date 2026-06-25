# Phase 7: Quality, UX & Code Quality — UI/UX Design

**Document**: `2026-06-25-phase7-quality-ux-code-uiux.md`
**Project**: Hyperscaler Asset Hub (HSAH)
**Phase**: 7 — Quality Infrastructure, UX Optimization, Code Quality
**Date**: 2026-06-25
**Status**: Draft

---

## 1. Design System Context

HSAH uses a **dark-first, glassmorphism design system** with the following tokens (from `globals.css`):

| Token | Value | Usage |
|---|---|---|
| `--color-void-black` | `#0a0a0f` | Deepest background |
| `--color-surface-dark` | `#12121a` | Card / panel background |
| `--color-surface-mid` | `#1e1e2e` | Elevated surfaces |
| `--color-border-subtle` | `#2a2a3c` | Borders |
| `--color-text-primary` | `#f0f0f5` | Headings, primary text |
| `--color-text-secondary` | `#8b8ba3` | Body text, descriptions |
| `--color-text-tertiary` | `#5a5a72` | Meta text, placeholders |
| `--color-electric-purple` | `#7b3ff2` | Primary accent, CTAs |
| `--color-periwinkle` | `#d4daf5` | Secondary accent, icons |
| `--color-destructive` | `#ef4444` | Errors, destructive actions |

**Typography**: Inter (sans), JetBrains Mono (mono)
**Border radius**: `1.25rem` (20px) base, cards use `28px` / `26px` / `2xl`
**Shadows**: `--shadow-card: 0 4px 24px rgb(28 25 103 / 12%)`
**Glass effect**: `backdrop-blur-[24px]`, `bg-[rgb(18_18_26_/72%)]`, `border-[rgb(212_218_245_/12%)]`

All new components must **inherit these tokens** and maintain visual consistency with existing glassmorphism panels.

---

## 2. Skeleton Component

### 2.1 Overview

Skeleton provides a **loading placeholder** that mimics the shape of content before it arrives. It reduces perceived load time and prevents layout shift.

### 2.2 Variants

#### Default
A single rounded rectangle. Used for buttons, avatars, or generic placeholders.

```
┌────────────────────┐
│ ░░░░░░░░░░░░░░░░░░ │  ← rounded-md, bg-muted, animate-pulse
└────────────────────┘
```

**Specs**:
- Background: `bg-muted` (`rgb(212 218 245 / 7%)`)
- Border radius: `rounded-md` (8px)
- Animation: `animate-pulse` (Tailwind default: opacity 1 → 0.5 → 1, 2s cycle)

#### Card
Mimics a content card with aspect ratio.

```
┌──────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← rounded-xl, h-48, bg-muted
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                              │
│ ░░░░░░░░░░░░░░               │  ← title line
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← description line
└──────────────────────────────┘
```

**Specs**:
- Container: `rounded-xl` (12px), `bg-muted`
- Image area: `h-32` (128px), full width, `rounded-t-xl`
- Title line: `h-4 w-2/3`, `mt-4`, `rounded-md`
- Description line: `h-3 w-full`, `mt-2`, `rounded-md`
- All inner elements: `animate-pulse`

#### Table Row
Mimics a data table row with multiple columns.

```
┌────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ ░░ │ ░░░░░░░░░░░░ │ ░░░░░░░░░░░░ │ ░░░░░░░░░░░░ │ ░░░░░░░░░░░░ │
│ ░░ │ ░░░░░░░░░░░░ │ ░░░░░░░░░░░░ │ ░░░░░░░░░░░░ │ ░░░░░░░░░░░░ │
└────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

**Specs**:
- Row container: `flex gap-4 py-3`
- Each cell: `h-4 rounded-md bg-muted animate-pulse`
- Column widths: `flex-1` distributed, or `w-12` for action columns
- Repeat 5–8 rows for a realistic table skeleton

#### Text Line
Mimics paragraphs or form labels.

```
┌────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← full width
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← 90% width
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │  ← 80% width
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← full width (last line)
└────────────────────────────────────┘
```

**Specs**:
- Container: `space-y-2`
- Each line: `h-3 rounded-md bg-muted animate-pulse`
- Widths: alternate `w-full`, `w-[90%]`, `w-[80%]`, `w-[95%]` for organic feel
- Lines: configurable via `lines` prop (default 3)

### 2.3 Animation

**Pulse** (Tailwind `animate-pulse`):
- Opacity: 1 → 0.4 → 1
- Duration: 2000ms
- Easing: ease-in-out
- Iteration: infinite

No custom keyframes needed. The default Tailwind pulse is sufficient for dark themes because the contrast between `bg-muted` and the dark background is subtle.

### 2.4 Dark Theme Colors

| Element | Light Mode | Dark Mode (HSAH) |
|---|---|---|
| Skeleton bg | `bg-gray-200` | `bg-muted` (`rgb(212 218 245 / 7%)`) |
| Skeleton highlight | `bg-gray-300` | `bg-muted/60` (brighter pulse peak) |
| Container bg | `bg-white` | `bg-card` (`#12121a`) |

In HSAH (dark only), use `bg-muted` and `bg-muted/50` for the pulse effect. The subtle opacity change is enough against the dark void background.

### 2.5 React Query Integration

When React Query `useQuery` is in `isPending` state, show Skeleton. When `isFetching` (background refetch), do **not** show Skeleton — keep existing data visible.

```
State Machine:

isPending ──▶ Skeleton
   │
   ▼
isSuccess ──▶ Data UI
   │
   ▼
isFetching ──▶ Data UI (no skeleton, subtle spinner optional)
   │
   ▼
isError ──▶ Error UI (EmptyState with error icon)
```

---

## 3. Empty State Component

### 3.1 Overview

Empty State appears when data has loaded successfully but the result set is empty. It replaces the common anti-pattern of showing nothing or a plain text message.

### 3.2 Layout

```
┌────────────────────────────────────────────┐
│                                            │
│              ┌────────────┐                │
│              │   [Icon]   │                │  ← size-12, stroke-1.5
│              │  (Lucide)  │                │     color: text-secondary
│              └────────────┘                │
│                                            │
│           "No assets found"                 │  ← text-lg, font-semibold
│                                            │     color: text-primary
│    "Try adjusting your filters or          │  ← text-sm, leading-6
│     search terms to find what              │     color: text-secondary
│     you're looking for."                   │
│                                            │
│         ┌────────────────┐                 │
│         │  Clear Filters │                 │  ← Button variant="outline"
│         └────────────────┘                 │
│                                            │
└────────────────────────────────────────────┘
```

### 3.3 Specs

| Element | Token / Class | Value |
|---|---|---|
| Container | `flex flex-col items-center justify-center` | Centered, min-height `300px` |
| Icon | `size-12` | 48px, `stroke-1.5` for thinner Lucide strokes |
| Icon color | `text-muted-foreground` | `#8b8ba3` |
| Title | `text-lg font-semibold` | `color-text-primary` |
| Title margin | `mt-4` | 16px below icon |
| Description | `text-sm leading-6 max-w-sm` | `color-text-secondary`, centered |
| Description margin | `mt-2` | 8px below title |
| Action button | `Button variant="outline"` | `mt-6`, optional |
| Background | `bg-card` or transparent | Inherits parent panel background |

### 3.4 Icon Selection Guide

| Context | Lucide Icon | Rationale |
|---|---|---|
| Empty list / no data | `Inbox` | Universal "empty container" metaphor |
| Empty search results | `SearchX` | Search with cancellation |
| Missing file / image | `FileQuestion` | File with uncertainty |
| No permissions | `ShieldAlert` | Security with warning |
| No network / error | `WifiOff` | Disconnection |
| Empty templates | `LayoutTemplate` | Template with absence |
| No users | `Users` | People group, empty |

### 3.5 Dark Theme

All colors use the existing dark token system. No special empty-state-only colors. The icon, title, and description naturally contrast against the dark glass panel backgrounds.

---

## 4. Error Boundary Fallback UI

### 4.1 Overview

When a React component throws an error, the Error Boundary catches it and renders a fallback UI. This prevents the entire app from crashing into a white screen.

### 4.2 Layout

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │                                                    │   │
│  │              ┌────────────┐                        │   │
│  │              │  ⚠ Alert  │                        │   │  ← size-16
│  │              │  Triangle  │                        │     color: destructive
│  │              └────────────┘                        │   │
│  │                                                    │   │
│  │         "Something went wrong"                     │   │  ← text-xl, semibold
│  │                                                    │   │
│  │  "An unexpected error occurred. Our team has       │   │  ← text-sm, secondary
│  │   been notified. Please try again or return        │     max-w-md, centered
│  │   to the home page."                               │   │
│  │                                                    │   │
│  │  ┌────────────┐  ┌────────────────┐                │   │
│  │  │   Retry    │  │ Back to Home   │                │   │  ← Button row
│  │  └────────────┘  └────────────────┘                │   │     primary + outline
│  │                                                    │   │
│  │  (dev only)                                        │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ Error: Cannot read property 'map' of null  │   │   │  ← error details
│  │  │ Stack: at AssetList (asset-list.tsx:42)     │   │     monospace, small
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 4.3 Specs

| Element | Token / Class | Value |
|---|---|---|
| Container | `min-h-screen flex items-center justify-center` | Full viewport center |
| Card | `GlassPanel` or `Card` | `rounded-[28px]`, `p-8 md:p-12` |
| Icon | `AlertTriangle` from Lucide | `size-16`, `text-destructive` |
| Title | `text-xl font-semibold` | `color-text-primary` |
| Description | `text-sm text-muted-foreground max-w-md text-center` | `mt-3` |
| Retry button | `Button variant="default"` | `mt-6` |
| Home link | `Button variant="outline"` or `Link` | `mt-2` or inline |
| Error details (dev) | `font-mono text-xs text-destructive/80` | `mt-6 p-4 rounded-lg bg-destructive/10` |
| Error details (prod) | Hidden | Show generic message only |

### 4.4 Interaction

- **Retry**: Calls `resetErrorBoundary()` → re-renders children. If error persists, boundary catches again.
- **Back to Home**: `Link href="/"` → navigates to home, which unmounts the error boundary and remounts fresh.
- **Error logging**: `componentDidCatch` logs to `console.error` in dev, sends to monitoring in production.

---

## 5. 404 Page

### 5.1 Overview

A designed 404 page replaces the default Next.js unstyled 404. It maintains brand consistency and provides clear navigation back to the app.

### 5.2 Layout

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │                                                    │   │
│  │                    404                             │   │  ← text-9xl, font-bold
│  │                                                    │     color: text-tertiary
│  │         "Page not found"                           │   │  ← text-2xl, semibold
│  │                                                    │   │     color: text-primary
│  │  "The page you're looking for doesn't exist        │   │  ← text-sm, secondary
│  │   or has been moved."                              │   │     max-w-sm, centered
│  │                                                    │   │
│  │  ┌────────────────────────────────┐                │   │
│  │  │      ← Back to Home            │                │   │  ← Button or Link
│  │  └────────────────────────────────┘                │   │     with ArrowLeft icon
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.3 Specs

| Element | Token / Class | Value |
|---|---|---|
| Container | `min-h-screen flex items-center justify-center` | Full viewport center |
| Status code | `text-9xl font-bold tracking-tighter` | `color-text-tertiary` (`#5a5a72`) |
| Title | `text-2xl font-semibold mt-4` | `color-text-primary` |
| Description | `text-sm text-muted-foreground mt-3 max-w-sm text-center` | `leading-6` |
| Back link | `inline-flex items-center gap-2` | `text-primary hover:underline` |
| Background | `bg-background` | `#0a0a0f` |

### 5.4 Dark Theme

The 404 page uses the same dark void background as the rest of the app. The large "404" is intentionally muted (`text-tertiary`) so it doesn't compete with the message. The "Back to Home" link uses the electric purple accent for visibility.

### 5.5 Responsive

- Mobile: `text-7xl` for status code, `text-xl` for title, `px-6` for container
- Desktop: `text-9xl` for status code, `text-2xl` for title

---

## 6. Responsive Design

### 6.1 Mobile Sidebar Collapse

#### Current State (Desktop)

```
┌────────┬────────────────────────────────────────┐
│        │                                        │
│ Logo   │  Header: Title + Actions               │
│        │                                        │
│ Nav    │                                        │
│        │  Main Content                            │
│ Item 1 │                                        │
│ Item 2 │                                        │
│ Item 3 │                                        │
│        │                                        │
│        │                                        │
└────────┴────────────────────────────────────────┘
```

#### Mobile State (Collapsed)

```
┌────────────────────────────────────────┐
│  ≡  │  Title                    │  ⚙️  │  ← Header with hamburger
├────────────────────────────────────────┤
│                                        │
│  Main Content                          │
│                                        │
│                                        │
│                                        │
│                                        │
└────────────────────────────────────────┘
```

#### Mobile State (Expanded)

```
┌────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Overlay backdrop
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     rgba(0,0,0,0.6)
│ ▓▓┌────────────────────────────┐▓▓▓▓▓▓▓│
│ ▓▓│  Logo                      │▓▓▓▓▓▓▓│  ← Sidebar slides in
│ ▓▓│                            │▓▓▓▓▓▓▓│     from left
│ ▓▓│  Nav Item 1                │▓▓▓▓▓▓▓│
│ ▓▓│  Nav Item 2                │▓▓▓▓▓▓▓│
│ ▓▓│  Nav Item 3                │▓▓▓▓▓▓▓│
│ ▓▓│                            │▓▓▓▓▓▓▓│
│ ▓▓└────────────────────────────┘▓▓▓▓▓▓▓│
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└────────────────────────────────────────┘
```

#### Specs

| Element | Desktop | Mobile |
|---|---|---|
| Sidebar | `w-64 fixed left` | `fixed left top-0 h-full w-64 z-50` |
| Sidebar visibility | Always visible | `translateX(-100%)` when closed |
| Toggle button | Hidden | `md:hidden`, hamburger icon in header |
| Backdrop | None | `fixed inset-0 bg-black/60 z-40` when open |
| Animation | None | `transition-transform duration-300 ease-out-expo` |
| Body scroll | Normal | `overflow-hidden` when sidebar open |
| Close trigger | — | Click backdrop, click close button, press Escape |

#### Animation

```css
.sidebar-mobile {
  transform: translateX(-100%);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.sidebar-mobile.open {
  transform: translateX(0);
}
```

### 6.2 Table Horizontal Scroll

#### Problem

Data tables with many columns overflow the viewport on mobile, breaking the layout.

#### Solution

Wrap every table in a scroll container. The table maintains its natural column widths; the container enables horizontal scrolling only when needed.

```
Desktop:
┌────────────────────────────────────────────────────────┐
│ Name │ Role │ Status │ Created │ Actions │            │
├──────┼──────┼────────┼─────────┼─────────┤            │
│ ...  │ ...  │ ...    │ ...     │ ...     │            │
└────────────────────────────────────────────────────────┘

Mobile:
┌────────────────────────┐
│ Name │ Role │ Status │ ←  │  ← overflow-x-auto
├──────┼──────┼────────┤    │     shows partial columns
│ ...  │ ...  │ ...    │    │     user swipes to scroll
│      │      │        │  → │
└────────────────────────┘
```

#### Specs

| Element | Class | Behavior |
|---|---|---|
| Scroll container | `overflow-x-auto` | Horizontal scroll when content exceeds width |
| Table | `min-w-full w-full` | Full width on desktop, natural width on mobile |
| Table wrapper | `rounded-xl border border-border-subtle` | Visual containment |
| Header row | `sticky left-0` (optional) | First column stays visible while scrolling |
| Shadow hint | `shadow-[inset_-8px_0_12px_-8px_rgba(0,0,0,0.3)]` | Subtle shadow on right edge indicating more content |

### 6.3 Modal Sizing

#### Problem

Modals on mobile can be wider than the viewport, causing horizontal overflow or clipped content.

#### Solution

Responsive max-width with viewport margin.

```
Desktop:
┌────────────────────────────────────────────────────────┐
│                                                        │
│        ┌────────────────────────────┐                  │
│        │                            │                  │
│        │      Modal Content         │                  │
│        │                            │                  │
│        │                            │                  │
│        └────────────────────────────┘                  │
│                                                        │
└────────────────────────────────────────────────────────┘

Mobile:
┌────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓┌──────────────────┐▓▓│
│▓▓│                  │▓▓│
│▓▓│  Modal Content   │▓▓│  ← mx-4 (16px margin each side)
│▓▓│                  │▓▓│
│▓▓│                  │▓▓│
│▓▓└──────────────────┘▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└────────────────────────┘
```

#### Specs

| Breakpoint | Modal Width | Margin |
|---|---|---|
| Mobile (`< 640px`) | `w-full` | `mx-4` (16px) |
| Tablet (`640px–1024px`) | `max-w-lg` (512px) | `mx-auto` |
| Desktop (`> 1024px`) | `max-w-xl` (576px) or `max-w-2xl` (672px) | `mx-auto` |
| Max height | `max-h-[90vh]` | Prevents overflow on short viewports |
| Scroll | `overflow-y-auto` | Internal scroll if content exceeds max height |

---

## 7. React Query Loading States Integration

### 7.1 State Mapping

React Query provides four states that map to UI components:

| React Query State | UI Component | Visual |
|---|---|---|
| `isPending` (first load) | `Skeleton` | Pulse animation placeholders |
| `isSuccess` + `data` | Data UI | Normal content |
| `isSuccess` + `data.length === 0` | `EmptyState` | Icon + message + action |
| `isError` | `EmptyState` (error variant) | Error icon + retry action |
| `isFetching` (background) | Data UI + subtle indicator | Optional: small spinner in header |

### 7.2 Skeleton + Data Transition

The transition from Skeleton to data should be **smooth**, not jarring:

1. **Fade out skeleton**: `opacity-100` → `opacity-0` over 200ms
2. **Fade in data**: `opacity-0` → `opacity-100` over 200ms (with 100ms delay)
3. **Total transition**: 300ms

Implementation: Wrap Skeleton and Data in a container with `relative`. Use absolute positioning and CSS transitions, or use React's `key` prop to trigger mount animations.

```
Frame 1 (Skeleton):          Frame 2 (Transition):        Frame 3 (Data):
┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
│ ░░░░░░░░░░░░░░░░░░ │  →   │ ░░░░░░░░░░░░░░░░░░ │  →   │ ┌────────────────┐ │
│ ░░░░░░░░░░░░░░░░░░ │      │ ░░░░░░░░░░░░░░░░░░ │      │ │  Real Content  │ │
│ ░░░░░░░░░░░░░░░░░░ │      │ ░░░░░░░░░░░░░░░░░░ │      │ │                │ │
│ ░░░░░░░░░░░░░░░░░░ │      │ ░░░░░░░░░░░░░░░░░░ │      │ └────────────────┘ │
└────────────────────┘      └────────────────────┘      └────────────────────┘
  opacity: 1                    opacity: 0.5                   opacity: 1
                                (cross-fade)                   (data visible)
```

### 7.3 Background Refetch Indicator

When data is already cached and React Query performs a background refetch, show a **subtle indicator** instead of replacing the entire UI with Skeleton:

```
┌────────────────────────────────────────┐
│  Assets                    ● Refreshing │  ← small dot + text in header
├────────────────────────────────────────┤
│                                        │
│  [Data remains visible]                │
│                                        │
│                                        │
└────────────────────────────────────────┘
```

**Specs**:
- Indicator: `flex items-center gap-1.5 text-xs text-muted-foreground`
- Dot: `size-1.5 rounded-full bg-primary animate-pulse`
- Text: "Refreshing..." or just the dot
- Position: Inline with page title or in table header

---

## 8. Component Token Summary

### 8.1 Skeleton Tokens

| Property | Token | Value |
|---|---|---|
| Background | `bg-muted` | `rgb(212 218 245 / 7%)` |
| Border radius | `rounded-md` / `rounded-xl` | 8px / 12px |
| Animation | `animate-pulse` | 2s opacity cycle |
| Height (text line) | `h-3` | 12px |
| Height (title line) | `h-4` | 16px |
| Height (card image) | `h-32` | 128px |
| Height (table cell) | `h-4` | 16px |

### 8.2 Empty State Tokens

| Property | Token | Value |
|---|---|---|
| Icon size | `size-12` | 48px |
| Icon stroke | `stroke-1.5` | Thin stroke |
| Icon color | `text-muted-foreground` | `#8b8ba3` |
| Title | `text-lg font-semibold` | `#f0f0f5` |
| Description | `text-sm leading-6` | `#8b8ba3` |
| Max width | `max-w-sm` | 384px |
| Container min-height | `min-h-[300px]` | 300px |

### 8.3 Error Boundary Tokens

| Property | Token | Value |
|---|---|---|
| Icon | `AlertTriangle` | `size-16` |
| Icon color | `text-destructive` | `#ef4444` |
| Title | `text-xl font-semibold` | `#f0f0f5` |
| Description | `text-sm text-muted-foreground` | `#8b8ba3` |
| Error details bg | `bg-destructive/10` | `rgba(239,68,68,0.1)` |
| Error details text | `text-destructive/80` | `rgba(239,68,68,0.8)` |
| Font (details) | `font-mono` | JetBrains Mono |

### 8.4 404 Page Tokens

| Property | Token | Value |
|---|---|---|
| Status code | `text-9xl font-bold` | `#5a5a72` (tertiary) |
| Title | `text-2xl font-semibold` | `#f0f0f5` |
| Description | `text-sm text-muted-foreground` | `#8b8ba3` |
| Back link | `text-primary` | `#7b3ff2` |

---

## 9. Accessibility Considerations

### 9.1 Skeleton

- Skeleton containers should have `aria-busy="true"` when active
- Screen readers: announce "Loading content" via `aria-live="polite"` on the parent container
- Avoid skeletons for very short loads (< 200ms) to prevent screen reader chatter

### 9.2 Empty State

- Icon should have `aria-hidden="true"` (decorative)
- Title should be `h2` or `h3` depending on page hierarchy
- Action button should have clear `aria-label` if label is ambiguous

### 9.3 Error Boundary

- Fallback should be focusable: `tabIndex={-1}` on the container so focus can be moved there programmatically
- Retry button should be the first focusable element
- Error details in dev mode should be in a `pre` or `code` element with `aria-label="Error details"`

### 9.4 404 Page

- Status code should be `aria-hidden="true"` (decorative, large text)
- Title should be `h1` (primary page heading)
- Back link should have `aria-label="Return to home page"`

---

## 10. Document History

| Date | Author | Change |
|---|---|---|
| 2026-06-25 | AI Assistant | Initial draft |
