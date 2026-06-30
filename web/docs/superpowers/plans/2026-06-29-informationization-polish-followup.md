# Informationization Polish — Follow-up Plan

Date: 2026-06-29
Scope: Hyperscaler Asset Hub
Status: planning (not started)
Predecessor: `docs/superpowers/specs/2026-06-29-informationization-polish-design.md` and `docs/superpowers/plans/2026-06-29-informationization-polish-tasks.md`

## Context

The 23 tasks of the original informationization-polish plan are now fully implemented and committed across three commits on `founction_refined`:
- backend models, services, APIs, migration, and tests (133 pytest passing)
- frontend operations workbench, review/quality controls, engagement surfaces, and i18n (429 vitest passing, 0 lint errors)
- design spec + task plan docs

This document is the next-step plan. It does not repeat finished work. It covers (A) hardening of what was just shipped, (B) small gaps surfaced during polish that were intentionally deferred, and (C) the roadmap items the design explicitly deferred to a later quarter.

## Guiding Principles

1. Evidence-driven: each item maps to a concrete file, test, or gate.
2. No new scope creep: smart recommendation, notification center, and BI builder stay out unless explicitly approved.
3. Keep the four gates green at every step: `pytest -q`, `npm run test`, `npm run lint`, `npm run build`.

---

## Track A — Hardening (P0, do first)

These address correctness, security, and data-integrity risks in the shipped feature set.

### A1. Authorization scoping for new admin endpoints

**Problem:** The new admin endpoints (`/admin/operations/*`, `/admin/analytics/*`, `/admin/audit-logs`, `/admin/access-requests/*`) currently require only `get_current_user` (any authenticated user). The design defines distinct permission points (`asset:approve`, `access_request:review`, `analytics:read`, `audit_log:read`) but enforcement is not yet wired.

**Files:**
- Modify: `api/app/api/v1/admin_operations.py`
- Modify: `api/app/api/v1/admin_analytics.py`
- Modify: `api/app/api/v1/access_requests.py` (admin routes)
- Modify: `api/app/api/v1/admin_assets.py` (submit-review/approve/reject/publish/archive)
- Create: `api/app/core/permissions.py` — permission requirement dependency reading user roles + policies
- Test: `api/tests/test_authorization.py`

**Tasks:**
- [ ] Add a `require_permission(action)` FastAPI dependency that resolves the current user's roles and matched policies and raises 403 when no allow policy matches.
- [ ] Apply `require_permission("asset:approve")` to approve, `"asset:reject"` to reject, `"asset:publish"` to publish, `"asset:archive"` to archive.
- [ ] Apply `require_permission("access_request:review")` to admin access-request list/approve/reject.
- [ ] Apply `require_permission("analytics:read")` to analytics overview + asset performance.
- [ ] Apply `require_permission("audit_log:read")` to audit logs.
- [ ] Add tests proving a user without the permission gets 403 and a user with a matching allow policy gets 200.
- [ ] Verify the existing simulator still resolves the same permission names (already tested in `test_new_permissions.py`).

**Acceptance:** No authenticated-but-unauthorized user can approve assets, review access requests, or read analytics/audit logs.

### A2. Auth-required favorite endpoint on public detail

**Problem:** `/assets/{id}/favorite` requires auth, but the detail page's engagement bar only shows a soft "sign in" message instead of the existing `delivery_access`-style gated CTA when there is no token. This is a UX gap, not a security gap.

**Files:**
- Modify: `web/src/components/public/asset-engagement-bar.tsx`

**Tasks:**
- [ ] When no token, render the Save button as a link to `/auth/login?next=<current detail path>` instead of an inline message, matching the existing `DeliveryAccessPanel` pattern.

**Acceptance:** Anonymous users clicking Save are sent to login with a return path, consistent with the delivery-access gate.

### A3. Pagination parity for operations tasks and audit logs on the frontend

**Problem:** Backend supports `limit`/`offset` for `/admin/operations/tasks` and `/admin/audit-logs`, but the frontend fetches with a fixed `limit=50` and renders no pagination control. Large datasets will silently truncate.

**Files:**
- Modify: `web/src/components/admin/audit-log-table.tsx`
- Modify: `web/src/components/admin/operations-workbench.tsx`
- Modify: `web/src/lib/admin-analytics.ts` (return total)

**Tasks:**
- [ ] Add a simple prev/next pagination control to the audit table using the `total` from the response.
- [ ] Add a "showing N of M" count line to the operations task queue.
- [ ] Add tests for pagination state.

**Acceptance:** Both lists page through all records without silent truncation.

---

## Track B — Deferred polish items (P1)

Small, low-risk improvements surfaced during the design-taste polish pass.

### B1. Chart visualization on the analytics dashboard

**Problem:** The analytics dashboard renders metrics as text rows only. The design calls for "simple trend sections" but the current implementation intentionally avoids a chart library.

**Files:**
- Modify: `web/src/components/admin/analytics-dashboard.tsx`
- Create: `web/src/components/admin/metric-bar.tsx` — a lightweight inline bar (no library) per spec rule "no filled background tracks as comparison visuals on landing pages" is a marketing rule; an admin cockpit is exempt and may use a compact bar.

**Tasks:**
- [ ] Add an inline bar per metric group (content/experience/workflow) showing relative magnitude, using `bg-primary` fill on a `bg-muted` track.
- [ ] Keep it dependency-free (pure divs).
- [ ] Add a test asserting the bars render given metric data.

**Acceptance:** The dashboard communicates relative magnitude at a glance, not just raw numbers.

### B2. Collection cover images

**Problem:** `AssetCollection` has a `cover_url` field and the collection rail/detail reference it, but there is no admin UI to set it and seeded collections have none, so collections render as text-only cards.

**Files:**
- Modify: `api/app/api/v1/asset_collections.py` — add admin create/update endpoints (currently read-only public)
- Modify: `web/src/components/public/asset-collection-rail.tsx` — render `next/image` when `cover_url` present
- Modify: `web/src/components/public/recommended-assets-rail.tsx` — n/a (assets have no cover, leave as-is)
- Test: `api/tests/test_asset_collections.py`

**Tasks:**
- [ ] Add admin `POST /admin/collections` and `PUT /admin/collections/{id}` endpoints guarded by `require_permission("collection:manage")`.
- [ ] Render cover image in the collection rail when present, with a tasteful fallback when absent.
- [ ] Add backend tests for create/update.

**Acceptance:** Collections can have cover images and render them on the public rail.

### B3. my-access-requests status visibility

**Problem:** The backend exposes `/me/access-requests` but there is no UI for a logged-in user to see the status of their own access requests. They only see the immediate post-submit confirmation.

**Files:**
- Create: `web/src/app/[locale]/me/access-requests/page.tsx`
- Create: `web/src/components/public/my-access-requests.tsx`
- Test: matching `.test.tsx`

**Tasks:**
- [ ] Add a "My access requests" page listing the current user's requests with status badges.
- [ ] Link to it from the access-request-form confirmation state.
- [ ] Add a navigation entry or profile link.

**Acceptance:** Users can track their pending/approved/rejected access requests.

---

## Track C — Roadmap (P2, later quarter)

Items the design explicitly deferred. Listed here so they are not lost.

### C1. Smart quality suggestions
Move from rule-based missing-requirement checks to NLP-assisted suggestions for description quality, tag completeness, and readability. Requires an LLM integration decision.

### C2. Recommendation engine
Replace the current shared-metadata scoring (`asset_recommendations.py`) with a behavioral model trained on the `analytics_events` table once enough view/favorite/request data exists.

### C3. Notification center
Notify users when their access request is approved/rejected, and notify reviewers when a new request or asset review lands. Currently no notification channel exists.

### C4. Editorial operations analytics
Deeper dashboards: average review duration, reject rate trends, content performance over time. Requires time-series aggregation and likely a charting library.

### C5. Export and reporting
CSV/PDF export of audit logs, access-request history, and analytics snapshots for compliance reviews.

---

## Verification Protocol

Every task in Track A and Track B must keep all four gates green before merge:
- `cd api && pytest -q`
- `cd web && npm run test`
- `cd web && npm run lint`
- `cd web && npm run build`

Track A1 (authorization) is the highest priority because it is the only item with a security implication. It should be done before this branch is merged or deployed.
