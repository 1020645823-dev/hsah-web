# Phase 5: Admin Enhancement Suite Design

## Overview

Complete the admin management capabilities by adding full CRUD operations for users, roles, and policies. Also add comprehensive tests, UI/UX polish, and performance optimizations.

## Part 1: User Management (Full CRUD)

### Goal
Add create, edit, delete, and enable/disable capabilities to the user management page.

### Backend Changes

**New Endpoints (api/app/api/v1/admin.py):**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/users` | Create user (email, password, is_active, is_2fa_enabled) |
| PUT | `/admin/users/{id}` | Update user (email, is_active, is_2fa_enabled) |
| DELETE | `/admin/users/{id}` | Delete user |

**Schema additions:**
```python
class UserCreateRequest(BaseModel):
    email: str
    password: str
    is_active: bool = True
    is_2fa_enabled: bool = False

class UserUpdateRequest(BaseModel):
    email: Optional[str] = None
    is_active: Optional[bool] = None
    is_2fa_enabled: Optional[bool] = None
```

### Frontend Changes

**Modify `/admin/users/page.tsx`:**
- Add "Create User" button opening a modal
- Add "Edit" button per user row
- Add "Delete" button per user row (with confirmation)
- Add toggle for is_active status
- Create modal form: email, password, is_active, is_2fa_enabled

## Part 2: Role Edit/Delete

### Goal
Add edit and delete capabilities to the role management page.

### Backend Changes

**New Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| PUT | `/admin/roles/{id}` | Update role (name, description, user_ids) |
| DELETE | `/admin/roles/{id}` | Delete role |

### Frontend Changes

**Modify `/admin/roles/page.tsx`:**
- Add "Edit" button per role row
- Add "Delete" button per role row (with confirmation)
- Reuse existing create form for editing

## Part 3: Policy Edit/Delete

### Goal
Add edit and delete capabilities to the policy management page.

### Backend Changes

**New Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| PUT | `/admin/policies/{id}` | Update policy (all fields) |
| DELETE | `/admin/policies/{id}` | Delete policy |

### Frontend Changes

**Modify `/admin/policies/page.tsx`:**
- Add "Edit" button per policy row
- Add "Delete" button per policy row (with confirmation)
- Reuse existing create form for editing
- Wizard should also support editing existing policies (Phase 2 of wizard)

## Part 4: Comprehensive Tests

### Test Coverage Plan

**Backend tests:**
- `test_users.py` — User CRUD operations
- `test_roles.py` — Role edit/delete
- `test_policies.py` — Policy edit/delete
- Update `test_admin_assets.py` — Add asset delete test

**Frontend tests:**
- `lib/admin.test.ts` — Test adminRequest, extractArrayPayload, pick helpers
- `app/admin/users/page.test.tsx` — User management page
- `app/admin/roles/page.test.tsx` — Role management page
- `app/admin/policies/page.test.tsx` — Policy management page
- `app/admin/matrix/page.test.tsx` — Permission matrix page
- `app/admin/simulator/page.test.tsx` — Simulator page
- `app/admin/policies/wizard/page.test.tsx` — Wizard page

## Part 5: UI/UX Polish

### Responsive Design
- Ensure all admin pages work on mobile (768px and below)
- Tables should scroll horizontally on small screens
- Modals should be full-width on mobile
- Navigation should collapse to hamburger menu on mobile

### Animations
- Page transitions: subtle fade-in
- Modal open/close: scale + fade animation
- Toast notifications: slide-in from top-right
- Loading states: shimmer skeleton instead of plain text

### Interaction Details
- Hover states on all interactive elements
- Focus rings for keyboard navigation
- Loading spinners on async actions
- Empty states with helpful illustrations
- Error boundaries with fallback UI

## Part 6: Performance Optimization

### Code Review Items
- Memoize expensive computations (useMemo)
- Debounce search inputs
- Virtualize long lists (if needed)
- Lazy load heavy components
- Optimize re-renders (React.memo, useCallback)

### Specific Optimizations
- `PermissionMatrixTable`: Memoize matrix computation
- `BlockList`: Virtualize if block count > 50
- `TemplateSelector`: Cache template list
- `GlobalSearchModal`: Debounce search input
- Admin pages: Use React Suspense for data loading

## Implementation Order

1. **Backend API** — User/Role/Policy CRUD endpoints
2. **Frontend Pages** — Update Users/Roles/Policies pages with edit/delete
3. **Tests** — Backend + frontend tests
4. **UI/UX** — Responsive design, animations, interactions
5. **Performance** — Code review and optimizations

## Success Criteria

1. ✅ Admin can create/edit/delete users
2. ✅ Admin can edit/delete roles
3. ✅ Admin can edit/delete policies
4. ✅ All new features have tests
5. ✅ All admin pages are responsive
6. ✅ Animations and interactions feel polished
7. ✅ No performance regressions
8. ✅ Build succeeds, lint clean
