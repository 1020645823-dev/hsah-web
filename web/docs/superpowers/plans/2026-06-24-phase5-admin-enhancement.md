# Phase 5: Admin Enhancement Suite Implementation Plan

> **For agentic workers:** Use subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete admin CRUD operations for users, roles, and policies; add comprehensive tests; polish UI/UX; and optimize performance.

**Architecture:** Backend adds PUT/DELETE endpoints for users, roles, policies. Frontend updates admin pages with edit/delete modals. Tests cover all new functionality. UI/UX improvements are applied across admin pages. Performance optimizations target expensive computations and re-renders.

**Tech Stack:** FastAPI, SQLAlchemy, React 19, TypeScript, Vitest, Tailwind CSS v4

---

## File Structure

### Backend
```
api/app/
├── api/v1/admin.py              # MODIFY: Add user/role/policy CRUD endpoints
├── schemas/rbac.py              # MODIFY: Add UserCreateRequest, UserUpdateRequest
├── tests/test_users.py          # NEW: User CRUD tests
├── tests/test_roles.py          # NEW: Role edit/delete tests
└── tests/test_policies.py       # NEW: Policy edit/delete tests
```

### Frontend
```
web/src/
├── app/admin/users/page.tsx     # MODIFY: Add create/edit/delete
├── app/admin/roles/page.tsx     # MODIFY: Add edit/delete
├── app/admin/policies/page.tsx  # MODIFY: Add edit/delete
├── lib/admin.ts                 # MODIFY: Add update/delete API helpers
├── lib/admin.test.ts            # NEW: Test admin utilities
├── components/admin/
│   ├── user-form-modal.tsx      # NEW: Create/edit user modal
│   ├── confirm-dialog.tsx       # NEW: Reusable confirm dialog
│   ├── toast-provider.tsx       # NEW: Toast notification system
│   └── toast-provider.test.tsx  # NEW: Toast tests
├── app/admin/users/page.test.tsx        # NEW: User page tests
├── app/admin/roles/page.test.tsx        # NEW: Role page tests
├── app/admin/policies/page.test.tsx     # NEW: Policy page tests
├── app/admin/matrix/page.test.tsx      # NEW: Matrix page tests
├── app/admin/simulator/page.test.tsx   # NEW: Simulator page tests
└── app/admin/policies/wizard/page.test.tsx  # NEW: Wizard page tests
```

---

## Task 1: Backend User CRUD

**Files:**
- Modify: `api/app/api/v1/admin.py`
- Modify: `api/app/schemas/rbac.py`
- Create: `api/tests/test_users.py`

---

### Step 1: Add user schemas

Modify `api/app/schemas/rbac.py`:

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

### Step 2: Add user endpoints

Modify `api/app/api/v1/admin.py`:

```python
@router.post("/users", response_model=UserSummary)
async def create_user(
    request: UserCreateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # Check if email exists
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="user_already_exists")
    
    new_user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
        is_active=request.is_active,
        is_2fa_enabled=request.is_2fa_enabled,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=UserSummary)
async def update_user(
    user_id: str,
    request: UserUpdateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="user_not_found")
    
    if request.email is not None:
        db_user.email = request.email
    if request.is_active is not None:
        db_user.is_active = request.is_active
    if request.is_2fa_enabled is not None:
        db_user.is_2fa_enabled = request.is_2fa_enabled
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="user_not_found")
    
    db.delete(db_user)
    db.commit()
    return {"message": "user_deleted"}
```

### Step 3: Write backend tests

Create `api/tests/test_users.py`:

```python
import pytest
from app.tests.conftest import client, get_auth_header

def test_create_user_success():
    headers = get_auth_header()
    payload = {
        "email": "newuser@example.com",
        "password": "securepassword123",
        "is_active": True,
        "is_2fa_enabled": False,
    }
    response = client.post("/api/v1/admin/users", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["is_active"] is True

def test_create_user_duplicate_email():
    headers = get_auth_header()
    payload = {
        "email": "newuser@example.com",
        "password": "securepassword123",
    }
    # First creation
    client.post("/api/v1/admin/users", json=payload, headers=headers)
    # Second creation should fail
    response = client.post("/api/v1/admin/users", json=payload, headers=headers)
    assert response.status_code == 409

def test_update_user_success():
    headers = get_auth_header()
    # Create user first
    create_payload = {
        "email": "updateuser@example.com",
        "password": "password123",
    }
    create_response = client.post("/api/v1/admin/users", json=create_payload, headers=headers)
    user_id = create_response.json()["id"]
    
    # Update
    update_payload = {"is_active": False}
    response = client.put(f"/api/v1/admin/users/{user_id}", json=update_payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["is_active"] is False

def test_delete_user_success():
    headers = get_auth_header()
    # Create user first
    create_payload = {
        "email": "deleteuser@example.com",
        "password": "password123",
    }
    create_response = client.post("/api/v1/admin/users", json=create_payload, headers=headers)
    user_id = create_response.json()["id"]
    
    # Delete
    response = client.delete(f"/api/v1/admin/users/{user_id}", headers=headers)
    assert response.status_code == 200
    
    # Verify deleted
    get_response = client.get(f"/api/v1/admin/users", headers=headers)
    users = get_response.json()
    assert not any(u["id"] == user_id for u in users)

def test_user_crud_requires_auth():
    response = client.post("/api/v1/admin/users", json={"email": "test@test.com", "password": "pass"})
    assert response.status_code == 401
```

### Step 4: Run tests

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_users.py -v
```

---

## Task 2: Backend Role Edit/Delete

**Files:**
- Modify: `api/app/api/v1/admin.py`
- Create: `api/tests/test_roles.py`

---

### Step 1: Add role endpoints

Modify `api/app/api/v1/admin.py`:

```python
@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    request: RoleCreateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="role_not_found")
    
    role.name = request.name
    role.description = request.description
    
    # Update users
    if request.user_ids:
        users = db.query(User).filter(User.id.in_(request.user_ids)).all()
        role.users = users
    
    db.commit()
    db.refresh(role)
    return role

@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="role_not_found")
    
    db.delete(role)
    db.commit()
    return {"message": "role_deleted"}
```

### Step 2: Write tests

Create `api/tests/test_roles.py`:

```python
def test_update_role_success():
    headers = get_auth_header()
    # Create role first
    create_payload = {"name": "TestRole", "description": "Test"}
    create_response = client.post("/api/v1/admin/roles", json=create_payload, headers=headers)
    role_id = create_response.json()["id"]
    
    # Update
    update_payload = {"name": "UpdatedRole", "description": "Updated"}
    response = client.put(f"/api/v1/admin/roles/{role_id}", json=update_payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "UpdatedRole"

def test_delete_role_success():
    headers = get_auth_header()
    # Create role first
    create_payload = {"name": "DeleteRole", "description": "To delete"}
    create_response = client.post("/api/v1/admin/roles", json=create_payload, headers=headers)
    role_id = create_response.json()["id"]
    
    # Delete
    response = client.delete(f"/api/v1/admin/roles/{role_id}", headers=headers)
    assert response.status_code == 200
```

---

## Task 3: Backend Policy Edit/Delete

**Files:**
- Modify: `api/app/api/v1/admin.py`
- Create: `api/tests/test_policies.py`

---

### Step 1: Add policy endpoints

Modify `api/app/api/v1/admin.py`:

```python
@router.put("/policies/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: str,
    request: PolicyCreateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    policy = db.query(AccessPolicy).filter(AccessPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="policy_not_found")
    
    policy.name = request.name
    policy.effect = request.effect
    policy.permissions = request.permissions
    policy.role_names = request.role_names
    policy.resource_type = request.resource_type
    policy.resource_visibility = request.resource_visibility
    
    db.commit()
    db.refresh(policy)
    return policy

@router.delete("/policies/{policy_id}")
async def delete_policy(
    policy_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    policy = db.query(AccessPolicy).filter(AccessPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="policy_not_found")
    
    db.delete(policy)
    db.commit()
    return {"message": "policy_deleted"}
```

### Step 2: Write tests

Create `api/tests/test_policies.py`:

```python
def test_update_policy_success():
    headers = get_auth_header()
    # Create policy first
    create_payload = {
        "name": "TestPolicy",
        "effect": "allow",
        "permissions": ["assets.read"],
    }
    create_response = client.post("/api/v1/admin/policies", json=create_payload, headers=headers)
    policy_id = create_response.json()["id"]
    
    # Update
    update_payload = {
        "name": "UpdatedPolicy",
        "effect": "deny",
        "permissions": ["assets.read", "assets.write"],
    }
    response = client.put(f"/api/v1/admin/policies/{policy_id}", json=update_payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "UpdatedPolicy"
    assert response.json()["effect"] == "deny"

def test_delete_policy_success():
    headers = get_auth_header()
    # Create policy first
    create_payload = {"name": "DeletePolicy", "effect": "allow", "permissions": ["assets.read"]}
    create_response = client.post("/api/v1/admin/policies", json=create_payload, headers=headers)
    policy_id = create_response.json()["id"]
    
    # Delete
    response = client.delete(f"/api/v1/admin/policies/{policy_id}", headers=headers)
    assert response.status_code == 200
```

---

## Task 4: Frontend User Management CRUD

**Files:**
- Modify: `web/src/lib/admin.ts`
- Modify: `web/src/app/admin/users/page.tsx`
- Create: `web/src/components/admin/user-form-modal.tsx`
- Create: `web/src/components/admin/confirm-dialog.tsx`

---

### Step 1: Add API helpers

Modify `web/src/lib/admin.ts`:

```typescript
export async function createUser(token: string, data: { email: string; password: string; is_active?: boolean; is_2fa_enabled?: boolean }) {
  return adminRequest("/users", token, { method: "POST", body: JSON.stringify(data) });
}

export async function updateUser(token: string, userId: string, data: { email?: string; is_active?: boolean; is_2fa_enabled?: boolean }) {
  return adminRequest(`/users/${userId}`, token, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteUser(token: string, userId: string) {
  return adminRequest(`/users/${userId}`, token, { method: "DELETE" });
}
```

### Step 2: Create confirm dialog

Create `web/src/components/admin/confirm-dialog.tsx`:

```typescript
"use client";

import { X, AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/95%)] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[rgb(255_255_255_/5%)]">
            取消
          </button>
          <button onClick={onConfirm} className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30">
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Create user form modal

Create `web/src/components/admin/user-form-modal.tsx`:

```typescript
"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface UserFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  user?: { id: string; email: string; is_active: boolean; is_2fa_enabled: boolean };
  onSubmit: (data: { email: string; password?: string; is_active: boolean; is_2fa_enabled: boolean }) => void;
  onClose: () => void;
}

export function UserFormModal({ isOpen, mode, user, onSubmit, onClose }: UserFormModalProps) {
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [is2fa, setIs2fa] = useState(user?.is_2fa_enabled ?? false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("邮箱不能为空");
      return;
    }
    if (mode === "create" && !password) {
      setError("密码不能为空");
      return;
    }
    onSubmit({ email, password: password || undefined, is_active: isActive, is_2fa_enabled: is2fa });
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/95%)] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {mode === "create" ? "创建用户" : "编辑用户"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[rgb(255_255_255_/5%)] rounded">
            <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/80%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-electric-purple)]"
            />
          </div>
          
          {mode === "create" && (
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[rgb(255_255_255_/10%)] bg-[rgb(18_18_26_/80%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-electric-purple)]"
              />
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">启用账号</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={is2fa}
                onChange={(e) => setIs2fa(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">启用 2FA</span>
            </label>
          </div>
          
          {error && <div className="text-sm text-red-400">{error}</div>}
          
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[rgb(255_255_255_/5%)]">
              取消
            </button>
            <button type="submit" className="rounded-lg bg-[rgb(123_63_242_/25%)] px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[rgb(123_63_242_/35%)]">
              {mode === "create" ? "创建" : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Step 4: Update users page

Modify `web/src/app/admin/users/page.tsx` to add create/edit/delete functionality using the new modals and API helpers.

---

## Task 5: Frontend Role Edit/Delete

**Files:**
- Modify: `web/src/lib/admin.ts`
- Modify: `web/src/app/admin/roles/page.tsx`

---

### Step 1: Add API helpers

```typescript
export async function updateRole(token: string, roleId: string, data: { name: string; description?: string; user_ids?: string[] }) {
  return adminRequest(`/roles/${roleId}`, token, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteRole(token: string, roleId: string) {
  return adminRequest(`/roles/${roleId}`, token, { method: "DELETE" });
}
```

### Step 2: Update roles page

Add edit/delete buttons to each role row. Reuse the existing create form for editing.

---

## Task 6: Frontend Policy Edit/Delete

**Files:**
- Modify: `web/src/lib/admin.ts`
- Modify: `web/src/app/admin/policies/page.tsx`

---

### Step 1: Add API helpers

```typescript
export async function updatePolicy(token: string, policyId: string, data: PolicyCreateRequest) {
  return adminRequest(`/policies/${policyId}`, token, { method: "PUT", body: JSON.stringify(data) });
}

export async function deletePolicy(token: string, policyId: string) {
  return adminRequest(`/policies/${policyId}`, token, { method: "DELETE" });
}
```

### Step 2: Update policies page

Add edit/delete buttons to each policy row. Reuse the existing create form for editing.

---

## Task 7: Comprehensive Tests

### Backend Tests

Run all backend tests:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest -v
```

### Frontend Tests

Create tests for:
- `web/src/lib/admin.test.ts` — Test adminRequest, extractArrayPayload, pick helpers
- `web/src/app/admin/users/page.test.tsx` — Test user CRUD UI
- `web/src/app/admin/roles/page.test.tsx` — Test role edit/delete UI
- `web/src/app/admin/policies/page.test.tsx` — Test policy edit/delete UI

Run all frontend tests:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

---

## Task 8: UI/UX Polish

### Responsive Design

Add responsive classes to admin pages:
- Tables: `overflow-x-auto` wrapper
- Modals: Full-width on mobile (`max-w-full md:max-w-md`)
- Navigation: Collapsible on mobile

### Animations

Add CSS transitions:
- Modal: `transition-all duration-200 ease-out`
- Buttons: `transition-colors duration-150`
- Cards: `transition-transform duration-200 hover:scale-[1.02]`

### Toast Notifications

Create `web/src/components/admin/toast-provider.tsx`:
- Stack of toast notifications
- Auto-dismiss after 3 seconds
- Types: success, error, warning, info

---

## Task 9: Performance Optimization

### Memoization

- Wrap `PermissionMatrixTable` with React.memo
- Memoize `buildPermissionMatrix` result with useMemo
- Memoize filtered blocks in ContentBlockEditor

### Debounce

- Debounce search inputs (300ms)
- Debounce filter changes (150ms)

### Lazy Loading

- Lazy load heavy components (modals, editors)
- Use dynamic imports for route components

---

## Task 10: Final Verification

```bash
# Frontend
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run lint
npm run build
npm test

# Backend
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest -v
```

---

## Success Criteria

1. ✅ Admin can create/edit/delete users
2. ✅ Admin can edit/delete roles
3. ✅ Admin can edit/delete policies
4. ✅ All new features have tests
5. ✅ All admin pages are responsive
6. ✅ Animations and interactions feel polished
7. ✅ No performance regressions
8. ✅ Build succeeds, lint clean
