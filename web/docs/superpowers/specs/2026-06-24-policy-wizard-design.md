# Policy Wizard Design

Date: 2026-06-24
Scope: `/Users/weiwei.g.zhang/Documents/hsah/web`
Status: approved-in-chat, pending written-spec review

## Goal

Add a guided `Policy Wizard` to reduce configuration friction when creating access policies, while keeping the existing `/admin/policies` page as a stable fallback.

Phase 1 focuses on:

- wizard-style policy creation
- template-based starting points
- final submission to the existing backend endpoint `POST /api/v1/admin/policies`

## Scope

Phase 1 includes:

- new route: `/admin/policies/wizard`
- entry CTA from `/admin/policies` named `Create with Wizard`
- step-by-step creation flow (template → basics → permissions → scope & review)
- optional quick-add suggestions for roles and permissions
- create policy submission and success handling

Phase 1 excludes:

- editing existing policies
- replacing the existing inline create form on `/admin/policies`
- policy simulation preview inside the wizard
- bulk creation and export

## Information Architecture

Admin routes impacted:

- `/admin/policies` (add a link/button into the wizard)
- `/admin/policies/wizard` (new)

## Wizard Steps

The wizard is a single page with an internal step state.

### Step 0: Template

Provide preset templates plus a blank option:

- `Blank`
- `Allow public asset read` (allow + `assets.read` + `asset/public`)
- `Deny restricted asset read` (deny + `assets.read` + `asset/restricted`)
- `Deny public asset write` (deny + `assets.write` + `asset/public`)

Selecting a template initializes the working draft. Templates can be modified on later steps.

### Step 1: Basics

Fields:

- `name` (required)
- `effect` (`allow` or `deny`)

Validation:

- `name` must be non-empty after trim
- `effect` must be selected

### Step 2: Permissions

Goal: capture `permissions[]` with minimal friction.

Input model:

- a comma-separated text input for quick paste
- a chip list showing normalized permissions
- quick add suggestions for common permissions: `assets.read`, `assets.write`, `assets.manage`

Validation:

- require at least one permission
- normalize by trimming, dropping empty tokens, and de-duplicating

### Step 3: Scope & Review

Fields:

- `role_names[]` (optional)
  - fetched from `GET /api/v1/admin/roles`
  - selectable as chips
  - supports comma-separated manual entry as fallback
- `resource_type` (optional)
- `resource_visibility` (optional)

Review:

- show the final payload JSON that will be submitted
- show human-readable summary blocks for effect, permissions, roles, and resource scope

Submission:

- submit to `POST /api/v1/admin/policies`
- disable submit while in-flight
- show success state with a clear next action

## Backend Contract

The wizard uses existing endpoints only.

### Load roles

- `GET /api/v1/admin/roles`
- role list is used for role-name suggestions

### Create policy

- `POST /api/v1/admin/policies`

Payload shape (snake_case):

- `name: string`
- `effect: "allow" | "deny"`
- `permissions: string[]`
- `role_names: string[]`
- `resource_type: string | null`
- `resource_visibility: string | null`

## Error Handling

The wizard should map backend errors into clear user feedback.

Expected cases:

- `409 policy_already_exists`: tell user to change the policy name
- `400 invalid_role_names`: list invalid role names and suggest refreshing roles
- `401`: session expired, suggest re-login and take user to `/auth/login`

If the backend returns an unstructured error, show a generic message but keep the raw payload hidden by default.

## Success Handling

After a successful create:

- show a success callout
- provide a primary action: `Back to Policies`
- navigate to `/admin/policies` and allow the list to refresh

## UI Direction

Phase 1 keeps the existing Admin visual system:

- glass cards
- restrained accent usage
- existing buttons and inputs

Step indicator:

- a lightweight step pill row or progress strip without introducing new UI libraries

Templates:

- rendered as large selection cards to make the entry point feel guided and fast

## Route and Code Boundaries

Implementation will likely touch:

- `src/app/admin/policies/page.tsx`
- `src/app/admin/policies/wizard/page.tsx`
- `src/lib/admin.ts`
- optional small helper components under `src/components/admin`

Implementation will not change:

- backend API schema and routes in Phase 1
- existing policies list rendering logic beyond adding an entry CTA

## Verification

After implementation:

- run `npm run lint`
- run `npm run build`

Manual verification:

- open `/admin/policies` and confirm `Create with Wizard` entry is visible
- go through wizard with a template, then submit, confirm success
- confirm the created policy appears on `/admin/policies`
- verify error handling by submitting a duplicate name to trigger `409`

## Future Phases

Phase 2:

- editing existing policies via the wizard
- optional deep linking into steps

Phase 3:

- replace the legacy inline create form
- add simulator-backed preview for the selected scope

## Self-review

- No placeholder sections remain.
- Phase 1 scope is constrained to wizard creation and templates.
- Backend integration relies only on existing endpoints.
- Editing support is explicitly deferred.
