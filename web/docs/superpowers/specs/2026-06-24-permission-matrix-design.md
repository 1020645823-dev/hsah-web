# Permission Matrix Design

Date: 2026-06-24
Scope: `/Users/weiwei.g.zhang/Documents/hsah/web`
Status: approved-in-chat, pending written-spec review

## Goal

Add a new Admin Console capability named `Permission Matrix` to provide a read-only, auditable view of effective permissions across roles.

This phase focuses on three operator questions:

- which roles currently have a given permission
- whether the effective result is `allow`, `deny`, or `implicit`
- which policies caused the current decision

This phase will not introduce inline editing inside the matrix. Users will continue editing data through:

- `/admin/roles`
- `/admin/policies`
- `/admin/simulator`

## Scope

Phase 1 includes:

- a new Admin route: `/admin/matrix`
- a new Admin entry card from `/admin`
- client-side aggregation of roles and policies into a matrix view
- resource-context filters for `resource_type` and `resource_visibility`
- permission keyword search
- matrix cell detail panel or detail section
- links from matrix detail to existing Admin pages

Phase 1 excludes:

- editing allow or deny directly from matrix cells
- creating or deleting policies from the matrix page
- bulk role-permission assignment
- CSV or Excel export
- multi-context side-by-side comparison
- backend schema or API changes, unless a blocking contract issue is discovered during implementation

## User Value

The matrix is the first Admin page that lets operators compare permissions horizontally instead of inspecting roles and policies one by one.

It improves:

- auditability, by showing the effective result per role and permission
- troubleshooting speed, by exposing matched policies behind a cell
- consistency, by aligning matrix decisions with the existing simulator precedence rules

## Information Architecture

Top-level Admin routes after this phase:

- `/admin`
- `/admin/users`
- `/admin/assets`
- `/admin/roles`
- `/admin/policies`
- `/admin/simulator`
- `/admin/matrix`

The new `Permission Matrix` card will appear in the existing Admin overview grid and use the same visual language as the current glass card layout.

## Page Structure

The `/admin/matrix` page will contain four areas.

### 1. Header

- eyebrow: `ADMIN / MATRIX`
- page title: `Permission Matrix`
- concise description explaining that the page shows effective permissions by role under the selected resource context
- back link to `/admin`

### 2. Summary strip

Display three or more compact metrics:

- role count
- policy count
- permission count for the active filter context
- optional context label if a resource filter is active

### 3. Controls

Controls remain lightweight in Phase 1:

- permission keyword search input
- `resource_type` selector
- `resource_visibility` selector
- optional reset action for filters

The default view should load without requiring user input.

### 4. Matrix and detail

The main content area contains:

- a horizontally scrollable matrix
- rows representing permissions such as `assets.read`
- columns representing role names
- cells showing one of:
  - `allow`
  - `deny`
  - `implicit`

Clicking a cell opens a detail area that shows:

- selected role
- selected permission
- current decision
- matched policy list
- decision reason
- links to related Admin pages

## Decision Rules

The matrix must follow the same precedence used by the existing permission simulator:

- `deny` overrides `allow`
- `allow` overrides `implicit_deny`
- when no policy matches, the effective matrix value is rendered as `implicit`

The matrix display vocabulary will use:

- `allow`
- `deny`
- `implicit`

This is a presentation label only. Internally, `implicit` corresponds to the simulator outcome `implicit_deny`.

## Data Sources

Phase 1 reuses the existing Admin APIs:

- `/api/v1/admin/roles`
- `/api/v1/admin/policies`

No new API is required for the first implementation.

The frontend does not rely on role objects containing full permission lists. Instead, it derives the matrix from:

- role names returned by the roles endpoint
- policy records returned by the policies endpoint

## Derived Frontend Model

The page will derive a matrix model on the client.

Suggested derived structures:

- `roleNames: string[]`
- `permissionKeys: string[]`
- `resourceTypeOptions: string[]`
- `resourceVisibilityOptions: string[]`
- `matrixCellMap: Record<string, Record<string, MatrixCellState>>`

Suggested cell structure:

- `decision: "allow" | "deny" | "implicit"`
- `matchedPolicies: Array<{ id: string; name: string; effect: "allow" | "deny" }>`
- `reason: string`
- `resourceType: string | null`
- `resourceVisibility: string | null`

Permissions are derived from the union of `policy.permissions` after applying the active context filters.

## Aggregation Logic

For the selected resource context:

1. Load all roles.
2. Load all policies.
3. Build the role list from role names.
4. Build the permission list from policies that survive the active resource filters.
5. For each `role x permission` pair:
   - find policies whose `role_names` include the role, or are global if role scoping is empty
   - require permission match
   - require `resource_type` match when policy value exists
   - require `resource_visibility` match when policy value exists
6. Apply the precedence rule:
   - any deny match => `deny`
   - else any allow match => `allow`
   - else => `implicit`

This logic must stay aligned with the simulator contract to avoid conflicting operator interpretations.

## Filter Behavior

Phase 1 uses a single active context at a time.

Filtering rules:

- if `resource_type` is selected, only policies matching that type or no type restriction participate
- if `resource_visibility` is selected, only policies matching that visibility or no visibility restriction participate
- if no explicit filter is selected, the page should default to the most common or most relevant context, with `asset + public` as the preferred initial combination when available

Permission search filters rows only and must not mutate the underlying matrix decisions.

## Interaction Design

Cell styling should align with the existing Admin dark glass system:

- `allow`: restrained green tint
- `deny`: restrained red tint
- `implicit`: neutral muted surface

Interaction rules:

- hover reveals that the cell is inspectable
- click selects the cell and opens detail
- selected cell remains visually highlighted until another cell is chosen

Detail area contents:

- role name
- permission name
- decision badge
- matched policies rendered as chips or stacked items
- short reason text such as `matched_deny_policy`, `matched_allow_policy`, or `no_matching_policy`
- quick links:
  - `Open Roles`
  - `Open Policies`
  - `Open Simulator`

## Empty and Error States

The page must handle:

- no roles returned
- no policies returned
- no permissions after filters
- API request failure

Expected behavior:

- empty roles: show explanatory empty state instead of blank table
- empty policies: show matrix explanation and indicate all effective results are currently implicit
- filtered empty result: show “no permissions match current filters”
- request failure: show the existing Admin-style error surface and keep raw response visibility only if needed for current debugging patterns

## Component Plan

Expected additions under `src/app/admin` and `src/components`:

- new route: `src/app/admin/matrix/page.tsx`
- optional reusable matrix table component
- optional metric strip component reuse if current Admin patterns support it
- optional detail panel component if it improves separation without over-fragmenting files

If the implementation stays small, the page may keep aggregation and render logic co-located, but matrix transformation helpers should move into a focused utility when they become non-trivial.

## Route and Code Boundaries

Implementation will likely touch:

- `src/app/admin/page.tsx`
- `src/app/admin/matrix/page.tsx`
- `src/lib/admin.ts`
- optional helper or component files under `src/components`

Implementation will not change:

- backend API contracts for roles and policies in Phase 1
- auth flow
- public site pages
- asset browsing pages

## Testing and Verification

After implementation:

- run `npm run lint`
- run `npm run build`

Functional verification should confirm:

- the new Admin card opens `/admin/matrix`
- roles and policies load successfully
- matrix rows and columns render from real data
- `allow`, `deny`, and `implicit` cells match simulator precedence
- clicking a cell reveals matched policy details
- filter changes recompute the matrix correctly
- links to `/admin/roles`, `/admin/policies`, and `/admin/simulator` work

## Future Phases

Phase 2: `Policy Wizard`

- guided policy creation
- friendlier role selection and resource scoping
- stronger validation and defaults

Phase 3: `Asset Editor`

- asset create and edit flow
- deeper business management workflow
- tighter relationship between content operations and access control

These future phases are intentionally out of scope for the current design and must not expand the implementation plan for this spec.

## Self-review

- No placeholder sections remain.
- The design is scoped to a single sub-project: Phase 1 permission matrix.
- The decision precedence is explicitly aligned with the simulator.
- Editing and backend expansion are explicitly deferred to later phases.
- The route and file impact stay within the existing Admin surface in `web`.
