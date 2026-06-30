# Informationization Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn HSAH from a demo-style asset hub into a credible content asset operations platform through a quarterly task roadmap.

**Architecture:** Extend the existing Next.js public/admin web app and FastAPI backend with review workflow, quality checks, frontstage engagement, access requests, analytics events, and audit logs. Build in thin, testable slices: backend contract first, frontend surface second, metrics/audit foundation third.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl, Tailwind CSS, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Vitest, pytest.

---

## Planning Guardrails

This file is a task breakdown only. Do not implement these tasks until the user explicitly approves development work.

Implementation constraints:

1. Keep changes incremental and independently reviewable.
2. Reuse existing asset, RBAC, template, public asset, and admin shell patterns.
3. Do not introduce a workflow engine, BI platform, recommendation service, or notification system in this quarter.
4. Do not commit during planning. During future implementation, commit per task only if the user explicitly asks for commits.
5. Use tests as the execution driver once development starts.

## Scope Check

The approved spec spans multiple related subsystems. To keep delivery safe, this plan decomposes the quarter into three testable milestones:

1. **M1 Operations foundation:** Review workflow, quality checks, operations workbench.
2. **M2 Frontstage conversion:** Collections, discovery improvements, favorites, feedback, access requests.
3. **M3 Trust evidence:** Analytics events, audit logs, operations dashboards.

Each task below is intended to be executable as a small implementation unit after development approval.

## File Structure Map

### Backend files

- Modify: `api/app/models/asset.py` — add or normalize review/status fields on assets.
- Create: `api/app/models/asset_review.py` — review history records for submit, approve, reject, publish, unpublish, archive.
- Create: `api/app/models/asset_quality.py` — optional persisted quality snapshots for M3 trend reporting.
- Create: `api/app/models/asset_collection.py` — public asset collections and membership.
- Create: `api/app/models/asset_engagement.py` — favorites, feedback, and lightweight asset engagement records.
- Create: `api/app/models/access_request.py` — user requests for delivery-content access.
- Create: `api/app/models/analytics_event.py` — event log for browse, favorite, feedback, request, review, publish.
- Create: `api/app/models/audit_log.py` — admin action audit trail.
- Modify: `api/app/models/__init__.py` — export new models for Alembic discovery.
- Create: `api/alembic/versions/0008_informationization_polish.py` — schema migration for new entities.
- Modify: `api/app/schemas/asset.py` — add review status, quality, collection, engagement response fields.
- Create: `api/app/schemas/operations.py` — operations workbench DTOs.
- Create: `api/app/schemas/asset_quality.py` — quality check result DTOs.
- Create: `api/app/schemas/asset_review.py` — review action request/response DTOs.
- Create: `api/app/schemas/asset_collection.py` — collection DTOs.
- Create: `api/app/schemas/asset_engagement.py` — favorite, feedback, related asset DTOs.
- Create: `api/app/schemas/access_request.py` — access request DTOs.
- Create: `api/app/schemas/analytics.py` — analytics dashboard DTOs.
- Create: `api/app/schemas/audit_log.py` — audit log DTOs.
- Create: `api/app/services/asset_quality.py` — quality scoring and missing-requirement rules.
- Create: `api/app/services/asset_review.py` — status transitions and review records.
- Create: `api/app/services/asset_recommendations.py` — simple related/recommended asset matching.
- Create: `api/app/services/access_requests.py` — duplicate detection and approval/rejection logic.
- Create: `api/app/services/analytics.py` — event recording and aggregation.
- Create: `api/app/services/audit_log.py` — audit event writer.
- Modify: `api/app/api/v1/admin_assets.py` — add review actions and quality check endpoint.
- Create: `api/app/api/v1/admin_operations.py` — operations workbench endpoints.
- Create: `api/app/api/v1/asset_collections.py` — public collection endpoints.
- Create: `api/app/api/v1/asset_engagement.py` — favorite, feedback, related endpoints.
- Create: `api/app/api/v1/access_requests.py` — public and admin access request endpoints.
- Create: `api/app/api/v1/admin_analytics.py` — analytics and audit endpoints.
- Modify: `api/app/api/v1/assets.py` — add sort options and event recording hooks.
- Modify: `api/app/api/v1/router.py` — include new routers.
- Test: `api/tests/test_asset_review.py`
- Test: `api/tests/test_asset_quality.py`
- Test: `api/tests/test_admin_operations.py`
- Test: `api/tests/test_asset_collections.py`
- Test: `api/tests/test_asset_engagement.py`
- Test: `api/tests/test_access_requests.py`
- Test: `api/tests/test_analytics.py`
- Test: `api/tests/test_audit_logs.py`
- Test: `api/tests/test_migration_revisions.py`

### Frontend files

- Modify: `web/src/lib/admin-navigation.ts` — add Operations, Access Requests, Analytics, Audit navigation items if separate pages are used.
- Modify: `web/src/lib/admin.ts` — add typed helpers for operations, review, quality, access request, analytics, audit APIs or delegate to focused files.
- Create: `web/src/lib/admin-operations.ts` — operations workbench client helpers.
- Create: `web/src/lib/admin-asset-review.ts` — review and quality client helpers.
- Create: `web/src/lib/access-requests.ts` — public/admin access request client helpers.
- Create: `web/src/lib/asset-engagement.ts` — favorite, feedback, related asset client helpers.
- Create: `web/src/lib/admin-analytics.ts` — analytics and audit client helpers.
- Modify: `web/src/lib/public-assets.ts` — support sort, collections, recommended, related asset queries.
- Modify: `web/src/types/asset.ts` — add review status, quality, engagement state, related asset types.
- Create: `web/src/types/operations.ts` — operations dashboard types.
- Create: `web/src/types/access-request.ts` — access request types.
- Create: `web/src/types/analytics.ts` — analytics and audit types.
- Modify: `web/src/app/[locale]/admin/page.tsx` — upgrade admin overview into operations workbench.
- Modify: `web/src/app/[locale]/admin/assets/page.tsx` — add review status, quality score, review actions.
- Modify: `web/src/components/admin/asset-editor-form.tsx` — show quality check panel and submit-review action.
- Create: `web/src/components/admin/asset-quality-panel.tsx` — quality score and missing-requirement UI.
- Create: `web/src/components/admin/asset-review-actions.tsx` — submit, approve, reject, publish, unpublish controls.
- Create: `web/src/components/admin/operations-workbench.tsx` — operations cards, queues, recent activity.
- Create: `web/src/app/[locale]/admin/access-requests/page.tsx` — admin access request queue.
- Create: `web/src/components/admin/access-request-queue.tsx` — approve/reject list UI.
- Create: `web/src/app/[locale]/admin/analytics/page.tsx` — analytics overview page.
- Create: `web/src/app/[locale]/admin/audit-logs/page.tsx` — audit log page.
- Create: `web/src/components/admin/analytics-dashboard.tsx` — metric cards and trend sections.
- Create: `web/src/components/admin/audit-log-table.tsx` — filterable audit table.
- Modify: `web/src/app/[locale]/assets/assets-client.tsx` — add collection/recommendation sections and sort controls.
- Modify: `web/src/app/[locale]/assets/page.tsx` — fetch collection/recommendation data when needed.
- Modify: `web/src/components/asset-detail-view.tsx` — add conversion section for favorite, share, feedback, request access, related assets.
- Modify: `web/src/components/public-asset-detail-client.tsx` — wire client-side engagement actions.
- Create: `web/src/components/public/asset-collection-rail.tsx` — collection cards or rails.
- Create: `web/src/components/public/related-assets.tsx` — related asset rail.
- Create: `web/src/components/public/access-request-form.tsx` — request delivery access.
- Create: `web/src/components/public/asset-feedback-form.tsx` — feedback submission form.
- Modify: `web/messages/en.json` — add English labels for new pages/actions/errors.
- Modify: `web/messages/zh.json` — add Chinese labels for new pages/actions/errors.
- Test: matching `.test.tsx` files next to changed frontend components and app pages.

## Milestone M1 — Operations Foundation

### Task 1: Normalize Asset Review Status

**Goal:** Define asset lifecycle states and transition rules.

**Files:**
- Modify: `api/app/models/asset.py`
- Modify: `api/app/schemas/asset.py`
- Create: `api/alembic/versions/0008_informationization_polish.py`
- Test: `api/tests/test_asset_review.py`
- Test: `api/tests/test_migration_revisions.py`

**Task checklist:**

- [ ] Confirm accepted lifecycle states: `draft`, `reviewing`, `rejected`, `published`, `archived`.
- [ ] Add backend tests asserting public list/detail returns only `published` + `public` assets.
- [ ] Add backend tests asserting invalid transitions are rejected with HTTP 422.
- [ ] Add migration fields needed for review status without removing existing asset data.
- [ ] Update asset schemas so admin responses include lifecycle status consistently.
- [ ] Run future validation: `cd api && pytest tests/test_asset_review.py tests/test_migration_revisions.py -q`.

**Acceptance:** Existing public visibility behavior remains intact, and backend has a single lifecycle vocabulary for future review tasks.

### Task 2: Add Review Records and Transition Service

**Goal:** Persist submit, approve, reject, publish, unpublish, and archive actions.

**Files:**
- Create: `api/app/models/asset_review.py`
- Create: `api/app/schemas/asset_review.py`
- Create: `api/app/services/asset_review.py`
- Modify: `api/app/models/__init__.py`
- Modify: `api/app/api/v1/admin_assets.py`
- Test: `api/tests/test_asset_review.py`

**Task checklist:**

- [ ] Write tests for submit-review creating a review record and setting status to `reviewing`.
- [ ] Write tests for approve setting status to `published` or an approved-ready state selected during implementation.
- [ ] Write tests for reject requiring a non-empty reason and setting status to `rejected`.
- [ ] Write tests for publish, unpublish, archive preserving review history.
- [ ] Implement review service with explicit transition matrix.
- [ ] Wire admin asset endpoints to the service.
- [ ] Run future validation: `cd api && pytest tests/test_asset_review.py -q`.

**Acceptance:** Every lifecycle action produces an auditable review record with actor, action, reason, and timestamp.

### Task 3: Add Asset Quality Check Service

**Goal:** Make publish readiness explainable through quality rules and missing fields.

**Files:**
- Create: `api/app/schemas/asset_quality.py`
- Create: `api/app/services/asset_quality.py`
- Modify: `api/app/api/v1/admin_assets.py`
- Test: `api/tests/test_asset_quality.py`

**Task checklist:**

- [ ] Write tests for quality score when title, slug, description, providers, and visible content blocks are present.
- [ ] Write tests for missing requirements: title, slug, short description, cloud providers, visible content block.
- [ ] Write tests for optional warnings: missing video, missing CTA, missing delivery permissions.
- [ ] Implement deterministic score bands: `ready`, `needs_work`, `blocked`.
- [ ] Add `GET /api/v1/admin/assets/{asset_id}/quality-check`.
- [ ] Reuse quality service in publish validation so failures share the same missing-field contract.
- [ ] Run future validation: `cd api && pytest tests/test_asset_quality.py tests/test_admin_assets.py -q`.

**Acceptance:** Admin users can see why an asset is or is not publishable before attempting to publish it.

### Task 4: Add Operations Workbench Backend

**Goal:** Provide a single backend contract for admin workbench cards, queues, and recent activity.

**Files:**
- Create: `api/app/schemas/operations.py`
- Create: `api/app/api/v1/admin_operations.py`
- Modify: `api/app/api/v1/router.py`
- Test: `api/tests/test_admin_operations.py`

**Task checklist:**

- [ ] Write tests for overview counts: total assets, published assets, reviewing assets, low-quality assets, pending access requests.
- [ ] Write tests for task queue shape with asset id, title, reason, priority, and target URL.
- [ ] Write tests for recent activity sorted newest first.
- [ ] Implement `GET /api/v1/admin/operations/overview`.
- [ ] Implement `GET /api/v1/admin/operations/tasks`.
- [ ] Implement `GET /api/v1/admin/operations/recent-activities`.
- [ ] Run future validation: `cd api && pytest tests/test_admin_operations.py -q`.

**Acceptance:** The admin homepage can render operational status without making many unrelated API calls.

### Task 5: Upgrade Admin Workbench UI

**Goal:** Convert the current admin overview into an operational control surface.

**Files:**
- Modify: `web/src/app/[locale]/admin/page.tsx`
- Create: `web/src/lib/admin-operations.ts`
- Create: `web/src/types/operations.ts`
- Create: `web/src/components/admin/operations-workbench.tsx`
- Modify: `web/messages/en.json`
- Modify: `web/messages/zh.json`
- Test: `web/src/app/[locale]/admin/page.test.tsx`
- Test: `web/src/components/admin/operations-workbench.test.tsx`

**Task checklist:**

- [ ] Write component tests for metric cards rendering counts from the operations API.
- [ ] Write tests for task queue empty, loading, error, and populated states.
- [ ] Add typed admin operations client helper.
- [ ] Replace static recent-draft content with API-backed queues.
- [ ] Add localized strings for operations workbench labels and errors.
- [ ] Run future validation: `cd web && npm run test -- src/app/[locale]/admin/page.test.tsx src/components/admin/operations-workbench.test.tsx`.

**Acceptance:** Admin users land on a page that shows concrete work to do instead of static placeholder-like operational text.

### Task 6: Add Quality and Review Controls to Admin Asset Surfaces

**Goal:** Make lifecycle and quality visible where admins manage assets.

**Files:**
- Modify: `web/src/app/[locale]/admin/assets/page.tsx`
- Modify: `web/src/components/admin/asset-editor-form.tsx`
- Create: `web/src/lib/admin-asset-review.ts`
- Create: `web/src/components/admin/asset-quality-panel.tsx`
- Create: `web/src/components/admin/asset-review-actions.tsx`
- Modify: `web/messages/en.json`
- Modify: `web/messages/zh.json`
- Test: `web/src/app/[locale]/admin/assets/page.test.tsx`
- Test: `web/src/components/admin/asset-editor-form.test.tsx`
- Test: `web/src/components/admin/asset-quality-panel.test.tsx`
- Test: `web/src/components/admin/asset-review-actions.test.tsx`

**Task checklist:**

- [ ] Write tests for asset rows showing lifecycle status and quality band.
- [ ] Write tests for submit, approve, reject, publish, unpublish buttons based on status.
- [ ] Write tests for reject requiring a reason before API submission.
- [ ] Write tests for quality panel listing blocking items and warnings.
- [ ] Add typed client helpers for review actions and quality check.
- [ ] Wire admin asset list actions to API with success and failure feedback.
- [ ] Wire asset editor quality panel to load and refresh quality checks.
- [ ] Run future validation: `cd web && npm run test -- src/app/[locale]/admin/assets/page.test.tsx src/components/admin/asset-quality-panel.test.tsx src/components/admin/asset-review-actions.test.tsx`.

**Acceptance:** Admins can see asset readiness and execute lifecycle actions without leaving the management context.

## Milestone M2 — Frontstage Conversion

### Task 7: Add Public Asset Collections Backend

**Goal:** Support curated asset groupings for public discovery.

**Files:**
- Create: `api/app/models/asset_collection.py`
- Create: `api/app/schemas/asset_collection.py`
- Create: `api/app/api/v1/asset_collections.py`
- Modify: `api/app/models/__init__.py`
- Modify: `api/app/api/v1/router.py`
- Test: `api/tests/test_asset_collections.py`

**Task checklist:**

- [ ] Write tests for listing public collections with published public assets only.
- [ ] Write tests for collection detail by slug returning ordered items.
- [ ] Write tests for hidden or empty collections returning stable empty responses.
- [ ] Add collection and collection item models.
- [ ] Add public collection list and detail endpoints.
- [ ] Run future validation: `cd api && pytest tests/test_asset_collections.py -q`.

**Acceptance:** Public pages can render curated content lanes without hard-coded asset groupings.

### Task 8: Extend Public Asset Discovery API

**Goal:** Add sorting, recommended assets, and related assets using existing metadata.

**Files:**
- Modify: `api/app/api/v1/assets.py`
- Create: `api/app/services/asset_recommendations.py`
- Modify: `api/app/schemas/asset.py`
- Test: `api/tests/test_assets.py`
- Test: `api/tests/test_search.py`

**Task checklist:**

- [ ] Write tests for `sort=title`, `sort=updated_at`, and unsupported sort fallback.
- [ ] Write tests for recommended assets returning only public published assets.
- [ ] Write tests for related assets matching cloud providers, industries, technologies, or asset type.
- [ ] Implement deterministic scoring for related assets using shared metadata counts.
- [ ] Add `GET /api/v1/assets/recommended`.
- [ ] Add `GET /api/v1/assets/{slug}/related` or equivalent id-based route selected during implementation.
- [ ] Run future validation: `cd api && pytest tests/test_assets.py tests/test_search.py -q`.

**Acceptance:** Frontend discovery improvements rely on backend contracts rather than hard-coded static lists.

### Task 9: Add Favorite and Feedback Backend

**Goal:** Capture user intent signals from asset detail pages.

**Files:**
- Create: `api/app/models/asset_engagement.py`
- Create: `api/app/schemas/asset_engagement.py`
- Create: `api/app/api/v1/asset_engagement.py`
- Modify: `api/app/models/__init__.py`
- Modify: `api/app/api/v1/router.py`
- Test: `api/tests/test_asset_engagement.py`

**Task checklist:**

- [ ] Write tests for authenticated users creating and removing favorites.
- [ ] Write tests for duplicate favorite returning the existing favorite state.
- [ ] Write tests for feedback requiring asset id, feedback type, and message.
- [ ] Write tests for unauthenticated favorite/feedback returning 401.
- [ ] Add favorite create/delete endpoints.
- [ ] Add feedback create endpoint.
- [ ] Run future validation: `cd api && pytest tests/test_asset_engagement.py -q`.

**Acceptance:** Asset details can capture lightweight user actions with stable backend storage.

### Task 10: Add Access Request Backend

**Goal:** Turn delivery-content lockouts into a trackable operational queue.

**Files:**
- Create: `api/app/models/access_request.py`
- Create: `api/app/schemas/access_request.py`
- Create: `api/app/services/access_requests.py`
- Create: `api/app/api/v1/access_requests.py`
- Modify: `api/app/models/__init__.py`
- Modify: `api/app/api/v1/router.py`
- Test: `api/tests/test_access_requests.py`

**Task checklist:**

- [ ] Write tests for logged-in user creating a request with purpose and asset id.
- [ ] Write tests for duplicate open request returning the existing request state.
- [ ] Write tests for admin listing pending requests.
- [ ] Write tests for approve adding access to the asset or equivalent access representation selected during implementation.
- [ ] Write tests for reject requiring a processing reason.
- [ ] Add public request create and my-requests endpoints.
- [ ] Add admin list, approve, and reject endpoints.
- [ ] Run future validation: `cd api && pytest tests/test_access_requests.py -q`.

**Acceptance:** Users can request restricted delivery content, and admins can process requests with a visible record.

### Task 11: Add Public Collections and Recommendation UI

**Goal:** Make the public asset library feel curated and easier to browse.

**Files:**
- Modify: `web/src/lib/public-assets.ts`
- Modify: `web/src/app/[locale]/assets/page.tsx`
- Modify: `web/src/app/[locale]/assets/assets-client.tsx`
- Create: `web/src/components/public/asset-collection-rail.tsx`
- Modify: `web/messages/en.json`
- Modify: `web/messages/zh.json`
- Test: `web/src/lib/public-assets.test.ts`
- Test: `web/src/app/[locale]/assets/page.test.tsx`
- Test: `web/src/app/[locale]/assets/assets-client.test.tsx`
- Test: `web/src/components/public/asset-collection-rail.test.tsx`

**Task checklist:**

- [ ] Write tests for public asset query builder preserving sort and collection parameters.
- [ ] Write tests for collection rail empty and populated states.
- [ ] Write tests for asset list rendering recommended or curated sections without breaking filters.
- [ ] Add client fetch helpers for collections and recommended assets.
- [ ] Render curated sections above results without hiding the core asset grid.
- [ ] Add localized labels for collections, recommended, latest, and popular concepts.
- [ ] Run future validation: `cd web && npm run test -- src/lib/public-assets.test.ts src/app/[locale]/assets/assets-client.test.tsx src/components/public/asset-collection-rail.test.tsx`.

**Acceptance:** Users can browse curated and recommended assets while preserving the existing searchable asset library.

### Task 12: Add Asset Detail Conversion UI

**Goal:** Convert asset detail pages from passive content into decision surfaces.

**Files:**
- Modify: `web/src/components/asset-detail-view.tsx`
- Modify: `web/src/components/public-asset-detail-client.tsx`
- Create: `web/src/lib/asset-engagement.ts`
- Create: `web/src/components/public/related-assets.tsx`
- Create: `web/src/components/public/asset-feedback-form.tsx`
- Modify: `web/messages/en.json`
- Modify: `web/messages/zh.json`
- Test: `web/src/components/asset-detail-view.test.tsx`
- Test: `web/src/components/public-asset-detail-client.test.tsx`
- Test: `web/src/components/public/related-assets.test.tsx`
- Test: `web/src/components/public/asset-feedback-form.test.tsx`

**Task checklist:**

- [ ] Write tests for rendering favorite, share, feedback, and related asset sections.
- [ ] Write tests for feedback form validation: type and message required.
- [ ] Write tests for related assets loading, error, empty, and populated states.
- [ ] Add client helpers for favorite, unfavorite, feedback, and related assets.
- [ ] Wire conversion actions with success and error feedback.
- [ ] Add localized strings for conversion actions and validation errors.
- [ ] Run future validation: `cd web && npm run test -- src/components/asset-detail-view.test.tsx src/components/public-asset-detail-client.test.tsx src/components/public/asset-feedback-form.test.tsx`.

**Acceptance:** Users have clear next actions after evaluating an asset.

### Task 13: Add Public Access Request UI

**Goal:** Provide a useful path when delivery content is restricted.

**Files:**
- Create: `web/src/lib/access-requests.ts`
- Create: `web/src/types/access-request.ts`
- Create: `web/src/components/public/access-request-form.tsx`
- Modify: `web/src/components/asset-detail-view.tsx`
- Modify: `web/src/components/public-asset-detail-client.tsx`
- Modify: `web/messages/en.json`
- Modify: `web/messages/zh.json`
- Test: `web/src/components/public/access-request-form.test.tsx`
- Test: `web/src/components/public-asset-detail-client.test.tsx`

**Task checklist:**

- [ ] Write tests for restricted delivery content showing the access request form.
- [ ] Write tests for unauthenticated users seeing sign-in guidance before request submission.
- [ ] Write tests for purpose field validation.
- [ ] Write tests for duplicate open request rendering current request status.
- [ ] Add access request client helper.
- [ ] Wire restricted-detail UI to request submission and status display.
- [ ] Run future validation: `cd web && npm run test -- src/components/public/access-request-form.test.tsx src/components/public-asset-detail-client.test.tsx`.

**Acceptance:** Restricted content does not dead-end; it becomes a clear request workflow.

### Task 14: Add Admin Access Request Queue

**Goal:** Give operations users a backend UI for processing access requests.

**Files:**
- Create: `web/src/app/[locale]/admin/access-requests/page.tsx`
- Create: `web/src/components/admin/access-request-queue.tsx`
- Modify: `web/src/lib/admin-navigation.ts`
- Modify: `web/src/lib/access-requests.ts`
- Modify: `web/messages/en.json`
- Modify: `web/messages/zh.json`
- Test: `web/src/app/[locale]/admin/access-requests/page.test.tsx`
- Test: `web/src/components/admin/access-request-queue.test.tsx`
- Test: `web/src/lib/admin-navigation.test.ts`

**Task checklist:**

- [ ] Write tests for navigation item visibility and active state.
- [ ] Write tests for queue loading, error, empty, pending, approved, and rejected states.
- [ ] Write tests for approve and reject actions updating the visible row state.
- [ ] Write tests for reject requiring a reason.
- [ ] Add admin queue page wrapped by the existing admin layout and route guard.
- [ ] Wire approve and reject actions to API helpers.
- [ ] Run future validation: `cd web && npm run test -- src/app/[locale]/admin/access-requests/page.test.tsx src/components/admin/access-request-queue.test.tsx src/lib/admin-navigation.test.ts`.

**Acceptance:** Admins can process access requests without using raw API tools.

## Milestone M3 — Trust Evidence

### Task 15: Add Analytics Event Backend

**Goal:** Record key platform events for dashboard aggregation.

**Files:**
- Create: `api/app/models/analytics_event.py`
- Create: `api/app/schemas/analytics.py`
- Create: `api/app/services/analytics.py`
- Modify: `api/app/models/__init__.py`
- Modify: `api/app/api/v1/assets.py`
- Modify: `api/app/api/v1/asset_engagement.py`
- Modify: `api/app/api/v1/access_requests.py`
- Test: `api/tests/test_analytics.py`

**Task checklist:**

- [ ] Write tests for recording asset view events from detail access.
- [ ] Write tests for recording favorite, feedback, and access request events.
- [ ] Write tests for anonymous events omitting user id but retaining asset id and event type.
- [ ] Implement analytics event writer with event type allowlist.
- [ ] Call event writer from public asset, engagement, and access request endpoints.
- [ ] Run future validation: `cd api && pytest tests/test_analytics.py tests/test_assets.py tests/test_asset_engagement.py tests/test_access_requests.py -q`.

**Acceptance:** The platform records enough event data to support basic operational dashboards.

### Task 16: Add Audit Log Backend

**Goal:** Persist critical admin actions for trust and governance.

**Files:**
- Create: `api/app/models/audit_log.py`
- Create: `api/app/schemas/audit_log.py`
- Create: `api/app/services/audit_log.py`
- Modify: `api/app/models/__init__.py`
- Modify: `api/app/api/v1/admin_assets.py`
- Modify: `api/app/api/v1/admin.py`
- Modify: `api/app/api/v1/access_requests.py`
- Test: `api/tests/test_audit_logs.py`

**Task checklist:**

- [ ] Write tests for asset review, publish, unpublish, archive audit entries.
- [ ] Write tests for access request approve/reject audit entries.
- [ ] Write tests for user, role, and policy create/update/delete audit entries.
- [ ] Implement audit writer that stores actor id, action, resource type, resource id, summary, metadata, timestamp.
- [ ] Wire audit writer to admin actions without changing existing API responses.
- [ ] Run future validation: `cd api && pytest tests/test_audit_logs.py tests/test_admin_assets.py tests/test_admin.py tests/test_access_requests.py -q`.

**Acceptance:** Key administrative changes are traceable through a stable audit model.

### Task 17: Add Admin Analytics and Audit APIs

**Goal:** Expose dashboard metrics and audit logs to frontend admin pages.

**Files:**
- Create: `api/app/api/v1/admin_analytics.py`
- Modify: `api/app/schemas/analytics.py`
- Modify: `api/app/schemas/audit_log.py`
- Modify: `api/app/api/v1/router.py`
- Test: `api/tests/test_analytics.py`
- Test: `api/tests/test_audit_logs.py`

**Task checklist:**

- [ ] Write tests for `GET /api/v1/admin/analytics/overview` metric structure.
- [ ] Write tests for asset performance metrics grouped by asset id.
- [ ] Write tests for `GET /api/v1/admin/audit-logs` pagination and filters.
- [ ] Implement overview aggregation for content, experience, workflow, quality, and governance metrics.
- [ ] Implement audit log list with pagination, action filter, actor filter, resource type filter.
- [ ] Run future validation: `cd api && pytest tests/test_analytics.py tests/test_audit_logs.py -q`.

**Acceptance:** Admin dashboards can load metrics and audit logs from dedicated backend contracts.

### Task 18: Add Admin Analytics Dashboard UI

**Goal:** Show proof of platform health and usage in the admin area.

**Files:**
- Create: `web/src/app/[locale]/admin/analytics/page.tsx`
- Create: `web/src/lib/admin-analytics.ts`
- Create: `web/src/types/analytics.ts`
- Create: `web/src/components/admin/analytics-dashboard.tsx`
- Modify: `web/src/lib/admin-navigation.ts`
- Modify: `web/messages/en.json`
- Modify: `web/messages/zh.json`
- Test: `web/src/app/[locale]/admin/analytics/page.test.tsx`
- Test: `web/src/components/admin/analytics-dashboard.test.tsx`

**Task checklist:**

- [ ] Write tests for content, experience, workflow, quality, and governance metric sections.
- [ ] Write tests for loading, error, empty, and populated dashboard states.
- [ ] Add admin analytics client helper.
- [ ] Add analytics navigation item.
- [ ] Render metric cards and simple trend sections without chart library dependency.
- [ ] Add localized analytics labels and explanations.
- [ ] Run future validation: `cd web && npm run test -- src/app/[locale]/admin/analytics/page.test.tsx src/components/admin/analytics-dashboard.test.tsx`.

**Acceptance:** Admins can see credible platform indicators without leaving the product.

### Task 19: Add Admin Audit Log UI

**Goal:** Make governance history searchable from the admin UI.

**Files:**
- Create: `web/src/app/[locale]/admin/audit-logs/page.tsx`
- Modify: `web/src/lib/admin-analytics.ts`
- Create: `web/src/components/admin/audit-log-table.tsx`
- Modify: `web/src/lib/admin-navigation.ts`
- Modify: `web/messages/en.json`
- Modify: `web/messages/zh.json`
- Test: `web/src/app/[locale]/admin/audit-logs/page.test.tsx`
- Test: `web/src/components/admin/audit-log-table.test.tsx`

**Task checklist:**

- [ ] Write tests for audit table loading, empty, error, and populated states.
- [ ] Write tests for action filter, resource type filter, and pagination.
- [ ] Add audit log client helper using existing admin request patterns.
- [ ] Add audit log navigation item or analytics sub-entry selected during implementation.
- [ ] Render actor, action, resource, summary, timestamp, and metadata preview.
- [ ] Run future validation: `cd web && npm run test -- src/app/[locale]/admin/audit-logs/page.test.tsx src/components/admin/audit-log-table.test.tsx`.

**Acceptance:** Operators can inspect important administrative changes through a stable UI.

## Cross-Cutting Tasks

### Task 20: Add Permission Points for New Operations

**Goal:** Keep new actions aligned with existing RBAC and policy simulation.

**Files:**
- Modify: `api/app/schemas/rbac.py`
- Modify: `api/app/api/v1/admin.py`
- Modify: `web/src/app/[locale]/admin/simulator/page.tsx`
- Modify: `web/src/app/[locale]/admin/matrix/page.tsx`
- Test: `api/tests/test_rbac.py`
- Test: `api/tests/test_policies.py`
- Test: `web/src/app/[locale]/admin/simulator/page.test.tsx`
- Test: `web/src/app/[locale]/admin/matrix/page.test.tsx`

**Task checklist:**

- [ ] Define permission names: `asset:submit_review`, `asset:approve`, `asset:reject`, `asset:publish`, `asset:archive`, `access_request:review`, `analytics:read`, `audit_log:read`.
- [ ] Write backend tests proving policy simulation handles each new permission name.
- [ ] Write frontend tests showing matrix and simulator can display or submit new permissions.
- [ ] Seed or expose new permission labels through existing policy UI patterns.
- [ ] Run future validation: `cd api && pytest tests/test_rbac.py tests/test_policies.py -q` and `cd web && npm run test -- src/app/[locale]/admin/simulator/page.test.tsx src/app/[locale]/admin/matrix/page.test.tsx`.

**Acceptance:** New features do not bypass governance or confuse existing policy tooling.

### Task 21: Standardize API Error Contracts

**Goal:** Make frontend error handling consistent across review, quality, access request, analytics, and audit APIs.

**Files:**
- Modify: `api/app/schemas/common.py`
- Modify: `api/app/api/v1/admin_assets.py`
- Modify: `api/app/api/v1/access_requests.py`
- Modify: `api/app/api/v1/admin_analytics.py`
- Modify: `web/src/lib/api-errors.ts`
- Modify: `web/src/lib/admin.ts`
- Test: `api/tests/test_admin_assets.py`
- Test: `api/tests/test_access_requests.py`
- Test: `web/src/lib/api-errors.test.ts`
- Test: `web/src/lib/admin.test.ts`

**Task checklist:**

- [ ] Define common error shape with `code`, `message`, and optional `fields` or `details`.
- [ ] Write backend tests for publish blocked, review rejected without reason, duplicate access request, unauthorized analytics.
- [ ] Write frontend tests for parsing structured field errors and generic HTTP failures.
- [ ] Update backend endpoints to return stable structured errors.
- [ ] Update frontend parsing helpers to preserve field-level details.
- [ ] Run future validation: `cd api && pytest tests/test_admin_assets.py tests/test_access_requests.py -q` and `cd web && npm run test -- src/lib/api-errors.test.ts src/lib/admin.test.ts`.

**Acceptance:** Users see actionable errors, and components do not need one-off parsing logic.

### Task 22: Complete i18n Coverage for New Features

**Goal:** Keep the new informationization surfaces consistent with the existing zh/en setup.

**Files:**
- Modify: `web/messages/en.json`
- Modify: `web/messages/zh.json`
- Test: affected frontend component/page tests.

**Task checklist:**

- [ ] Add namespaces or keys for Operations, Review, Quality, AccessRequests, Analytics, AuditLogs, Engagement.
- [ ] Replace new UI strings with `useTranslations` or existing server translation patterns.
- [ ] Add tests that mock translation keys and assert key usage for major components.
- [ ] Run future validation: `cd web && npm run test -- src/components/admin/operations-workbench.test.tsx src/components/admin/access-request-queue.test.tsx src/components/admin/analytics-dashboard.test.tsx src/components/admin/audit-log-table.test.tsx`.

**Acceptance:** New user-facing text works in both English and Chinese routes.

### Task 23: Add Release-Level Verification Pass

**Goal:** Verify the quarter roadmap can be delivered without breaking existing behavior.

**Files:**
- Modify only files touched by implementation tasks.
- No new product files required for this task.

**Task checklist:**

- [ ] Run backend focused tests for every completed milestone.
- [ ] Run frontend focused tests for every completed milestone.
- [ ] Run full backend test suite: `cd api && pytest -q`.
- [ ] Run full frontend test suite: `cd web && npm run test`.
- [ ] Run lint: `cd web && npm run lint`.
- [ ] Run build: `cd web && npm run build`.
- [ ] Document any unrelated failures with exact command output and file paths.

**Acceptance:** The implementation is verifiably stable or has clearly documented unrelated blockers.

## Suggested Execution Order

1. Task 1 — Normalize Asset Review Status
2. Task 2 — Add Review Records and Transition Service
3. Task 3 — Add Asset Quality Check Service
4. Task 4 — Add Operations Workbench Backend
5. Task 5 — Upgrade Admin Workbench UI
6. Task 6 — Add Quality and Review Controls to Admin Asset Surfaces
7. Task 7 — Add Public Asset Collections Backend
8. Task 8 — Extend Public Asset Discovery API
9. Task 9 — Add Favorite and Feedback Backend
10. Task 10 — Add Access Request Backend
11. Task 11 — Add Public Collections and Recommendation UI
12. Task 12 — Add Asset Detail Conversion UI
13. Task 13 — Add Public Access Request UI
14. Task 14 — Add Admin Access Request Queue
15. Task 15 — Add Analytics Event Backend
16. Task 16 — Add Audit Log Backend
17. Task 17 — Add Admin Analytics and Audit APIs
18. Task 18 — Add Admin Analytics Dashboard UI
19. Task 19 — Add Admin Audit Log UI
20. Task 20 — Add Permission Points for New Operations
21. Task 21 — Standardize API Error Contracts
22. Task 22 — Complete i18n Coverage for New Features
23. Task 23 — Add Release-Level Verification Pass

## Coverage Matrix

- Operations workbench: Tasks 4, 5, 23
- Asset lifecycle and review: Tasks 1, 2, 6, 20, 21, 23
- Content quality governance: Tasks 3, 6, 18, 23
- Public discovery and collections: Tasks 7, 8, 11, 22, 23
- Asset detail conversion: Tasks 9, 12, 13, 22, 23
- Access requests: Tasks 10, 13, 14, 20, 21, 23
- Analytics and audit: Tasks 15, 16, 17, 18, 19, 20, 23
- i18n and error handling: Tasks 21, 22, 23

## Review Notes

The plan intentionally avoids implementation code and command execution because development has not been approved. It provides concrete task boundaries, file targets, test targets, future validation commands, and acceptance criteria so implementation can start later with a clear checklist.
