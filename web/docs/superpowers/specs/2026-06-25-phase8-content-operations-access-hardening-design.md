# Phase 8 — Content Operations & Access Hardening Design

## Goal

Phase 8 turns Hyperscaler Asset Hub from a feature-complete editor and catalog into an operational asset platform. The focus is not to add peripheral capabilities, but to close the core loop: admins can validate and publish assets, public users can discover published assets efficiently, admin surfaces are consistently protected, and batch operations use backend contracts instead of repeated single-item calls.

## Scope

This phase covers four workstreams:

1. Asset publishing governance for draft, published, and archived states.
2. Public asset library search, filters, URL query sync, and pagination.
3. Admin route guard and token-expiry behavior across admin pages.
4. Asset batch delete API integration in the admin asset list.

This phase does not include i18n, PWA, analytics dashboards, content block schema migrations, or role-policy redesign. Those are separate future phases.

## Product Requirements

### Asset publishing governance

Admins need a clear status workflow:

- `draft`: editable internal content that must not appear on public pages.
- `published`: public-ready content that can appear in the public asset library and asset detail page when `visibility` is `public`.
- `archived`: retained content that is hidden from public surfaces but still visible in admin.

Admin asset rows should expose publish, unpublish, and archive actions where appropriate. Before publishing, the backend should validate that the asset has a title, slug, short description, at least one cloud provider, and at least one visible content block. Failed validation should return structured errors that can be shown in the admin UI.

Public endpoints should return only assets where `visibility == "public"` and `status == "published"`. Direct access to a draft or archived asset detail page should return 404.

### Public asset discovery

The public `/assets` page should become a practical browsing interface. Users should be able to:

- Search by keyword.
- Filter by cloud provider, industry, technology, and asset type.
- See applied filters in the URL query string.
- Paginate through results or load more results without losing filters.
- See a polished empty state when no results match.

The backend currently accepts query parameters but returns a plain list. Phase 8 should return a paginated shape with `items`, `total`, `limit`, and `offset` while preserving a predictable frontend contract.

### Admin access hardening

Admin pages currently mix direct token reads, local redirects, and page-level fetch behavior. Phase 8 should use the existing `RouteGuard` and `useAuth` as the common admin protection layer.

The guard should redirect unauthenticated users to `/auth/login`, not `/login`. Token expiry should clear the stored token and send the user back to login with no broken intermediate UI.

Admin pages may still use page-local data fetching, but authentication checks should be centralized.

### Batch operation API integration

The backend already exposes `/api/v1/admin/assets/batch-delete`, but the frontend still fires multiple individual DELETE requests. Phase 8 should make the admin asset list call the batch endpoint once, then show a success or partial failure message based on `{ deleted, failed }`.

## Architecture

### Backend

Backend changes are intentionally small and contract-focused:

- Update public asset listing/detail queries to require `status == "published"` and `visibility == "public"`.
- Add a paginated response model for public asset listing.
- Add admin asset status transition endpoints:
  - `POST /api/v1/admin/assets/{asset_id}/publish`
  - `POST /api/v1/admin/assets/{asset_id}/unpublish`
  - `POST /api/v1/admin/assets/{asset_id}/archive`
- Add a publishing validation helper that returns structured validation errors.
- Extend tests for published-only public visibility, transition success, transition validation failure, and archived/draft hiding.

No database migration is required because `status`, `visibility`, and `content_blocks` already exist.

### Frontend

Frontend changes are split by surface:

- Public `/assets` becomes a client-side searchable catalog shell backed by URL query parameters and the public paginated API.
- Admin asset list adds status actions, preview/detail links, and true batch-delete integration.
- Admin route protection wraps admin pages or an admin layout with `RouteGuard`.
- Shared admin request behavior handles 401 responses by clearing the token and allowing the guard to redirect.

The public catalog should stay visually consistent with the existing dark product UI. It should avoid marketing-page hero treatment and instead feel like a browsable library: compact filter controls, clear result count, card grid, and stable pagination.

## UI/UX Design

### Public asset library

The first viewport should remain focused on the asset library. The page should include:

- A compact title section.
- A search input with filter controls below or beside it.
- Filter chips or select controls for cloud, industry, technology, and asset type.
- A result count line.
- A responsive asset card grid.
- Pagination controls at the bottom.

On mobile, filters should stack cleanly above results. No cards should be nested inside other cards.

### Admin asset list

Each row should expose actions based on current status:

- Draft: edit, preview, publish, archive, delete.
- Published: view public page, unpublish, archive, delete.
- Archived: edit, unpublish-to-draft or restore-to-draft, delete.

If publishing fails validation, the UI should show the missing requirements in a concise error panel.

### Authentication behavior

Unauthenticated users should see the guard loading skeleton briefly, then be redirected to `/auth/login`. Protected pages should not flash sensitive admin content before authentication is known.

## Error Handling

- Publishing validation errors use a stable backend shape with a top-level code and a list of missing fields.
- Public asset fetch failures show a non-blocking error state and retain the current filters.
- Batch delete partial failures show how many assets were deleted and how many failed.
- 401 admin responses clear local auth state and redirect to login.

## Testing

Backend tests:

- Public listing returns only public published assets.
- Draft and archived asset detail pages return 404.
- Publish succeeds when required fields and content blocks are present.
- Publish fails with structured validation errors when requirements are missing.
- Batch delete still returns deleted and failed counts.

Frontend tests:

- Public asset query builder preserves filters and pagination.
- Admin asset batch delete uses `/batch-delete` once.
- RouteGuard redirects to `/auth/login` when unauthenticated.
- Public asset empty state renders when no items match.

## Acceptance Criteria

- Public users can search and filter published assets from `/assets`.
- Draft and archived assets are hidden from public list and detail pages.
- Admins can publish, unpublish, archive, and restore asset state from the asset list.
- Failed publish attempts explain exactly what must be fixed.
- Admin asset batch delete uses the backend batch endpoint.
- Admin route guard redirects to `/auth/login` consistently.
- `npm run build`, `npm run lint`, `npm run test`, and `pytest -q` pass.
