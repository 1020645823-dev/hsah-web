# Asset Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete asset CRUD system with unified editor form for both create and edit modes.

**Architecture:** Backend provides REST API (GET/POST/PUT) with Pydantic validation. Frontend uses a shared `AssetEditorForm` component that works in both create and edit modes, with client-side validation, dirty detection, and unsaved changes warning. TagInput component handles multi-value fields (tags, roles, users).

**Tech Stack:** FastAPI + Pydantic (backend), Next.js + React + TypeScript (frontend), SQLAlchemy (ORM), Vitest (frontend tests), pytest (backend tests)

**Spec:** `docs/superpowers/specs/2026-06-24-asset-editor-design.md`

---

## File Structure

### Backend
```
api/app/
├─ api/v1/admin_assets.py          # New: CRUD endpoints
├─ schemas/asset.py                # Extend: Add CreateRequest/UpdateRequest
└─ main.py                         # Modify: Register new routes
```

### Frontend
```
web/src/
├─ app/admin/assets/
│  ├─ page.tsx                      # Modify: Upgrade list page
│  ├─ new/page.tsx                  # New: Create page wrapper
│  └─ [id]/edit/page.tsx            # New: Edit page wrapper
├─ components/admin/
│  ├─ asset-editor-form.tsx         # New: Unified form component
│  └─ tag-input.tsx                 # New: Reusable tag input
└─ lib/
   └─ admin-asset-editor.ts        # New: Helper functions + types
```

### Tests
```
api/tests/
└─ test_admin_assets.py            # New: Backend API tests

web/src/
├─ lib/admin-asset-editor.test.ts  # New: Helper function tests
└─ components/admin/tag-input.test.tsx # New: TagInput tests
```

---

## Task 1: Backend CRUD API

**Goal:** Implement GET/POST/PUT endpoints with full validation.

**Files:**
- Create: `api/app/api/v1/admin_assets.py`
- Modify: `api/app/schemas/asset.py`
- Modify: `api/app/main.py`
- Test: `api/tests/test_admin_assets.py`

---

- [ ] **Step 1: Write failing test for GET /admin/assets/{id}**

```python
# api/tests/test_admin_assets.py
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import engine, SessionLocal
from app.models.asset import Asset
import uuid

client = TestClient(app)

def setup_module():
    """Create test asset."""
    db = SessionLocal()
    asset = Asset(
        id=uuid.uuid4(),
        slug="test-asset-01",
        title="Test Asset",
        subtitle="Test subtitle",
        short_description="Test description",
        cloud_providers=["aws"],
        industries=["fintech"],
        technologies=["kubernetes"],
        asset_type="solution",
        status="draft",
        visibility="public",
        allowed_roles=["admin"],
        allowed_users=["alice@example.com"],
        content_blocks=[],
    )
    db.add(asset)
    db.commit()
    db.close()

def test_get_asset_by_id_success():
    """Should return asset when ID exists."""
    db = SessionLocal()
    asset = db.query(Asset).filter(Asset.slug == "test-asset-01").first()
    db.close()
    
    # Login first to get token
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    
    # Fetch asset
    response = client.get(
        f"/api/v1/admin/assets/{asset.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "test-asset-01"
    assert data["title"] == "Test Asset"

def test_get_asset_by_id_not_found():
    """Should return 404 when ID doesn't exist."""
    response = client.get("/api/v1/admin/assets/non-existent-id")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "asset_not_found"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd api
pytest tests/test_admin_assets.py::test_get_asset_by_id_success -v
```

Expected: FAIL with "404 Not Found" or "route not found"

- [ ] **Step 3: Implement GET endpoint**

```python
# api/app/api/v1/admin_assets.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.auth import get_current_user
from app.models.asset import Asset
from app.models.user import User
from app.schemas.asset import AssetDetail

router = APIRouter(prefix="/admin/assets", tags=["admin"])

@router.get("/{asset_id}", response_model=AssetDetail)
def get_asset_by_id(
    asset_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Fetch single asset by ID."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=404,
            detail={"code": "asset_not_found", "message": "Asset not found"}
        )
    return asset
```

- [ ] **Step 4: Register route in main.py**

```python
# api/app/main.py (add to existing imports)
from app.api.v1 import admin_assets

# Add after other router includes
app.include_router(admin_assets.router, prefix="/api/v1")
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd api
pytest tests/test_admin_assets.py::test_get_asset_by_id_success -v
```

Expected: PASS

- [ ] **Step 6: Write failing test for POST /admin/assets**

```python
# api/tests/test_admin_assets.py (append)
def test_create_asset_success():
    """Should create asset with valid payload."""
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    
    payload = {
        "slug": "new-asset-01",
        "title": "New Asset",
        "subtitle": "New subtitle",
        "short_description": "New description",
        "cloud_providers": ["azure"],
        "industries": ["healthcare"],
        "technologies": ["terraform"],
        "asset_type": "whitepaper",
        "status": "draft",
        "visibility": "public",
        "allowed_roles": ["editor"],
        "allowed_users": ["bob@example.com"],
        "content_blocks": []
    }
    
    response = client.post(
        "/api/v1/admin/assets",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["slug"] == "new-asset-01"
    assert data["title"] == "New Asset"

def test_create_asset_slug_conflict():
    """Should return 409 when slug already exists."""
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    
    payload = {
        "slug": "test-asset-01",  # Already exists
        "title": "Duplicate",
        "short_description": "Test",
        "asset_type": "solution",
        "status": "draft",
        "visibility": "public"
    }
    
    response = client.post(
        "/api/v1/admin/assets",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "slug_already_exists"
```

- [ ] **Step 7: Run test to verify it fails**

```bash
cd api
pytest tests/test_admin_assets.py::test_create_asset_success -v
```

Expected: FAIL with "route not found"

- [ ] **Step 8: Implement POST endpoint**

```python
# api/app/api/v1/admin_assets.py (extend)
from app.schemas.asset import AssetCreateRequest
from fastapi.responses import JSONResponse

@router.post("/", response_model=AssetDetail, status_code=201)
def create_asset(
    request: AssetCreateRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Create new asset."""
    # Check slug uniqueness
    existing = db.query(Asset).filter(Asset.slug == request.slug).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail={"code": "slug_already_exists", "message": "Slug already exists"}
        )
    
    # Create asset
    asset = Asset(
        slug=request.slug,
        title=request.title,
        subtitle=request.subtitle,
        short_description=request.short_description,
        cloud_providers=request.cloud_providers,
        industries=request.industries,
        technologies=request.technologies,
        asset_type=request.asset_type,
        status=request.status,
        visibility=request.visibility,
        allowed_roles=request.allowed_roles,
        allowed_users=request.allowed_users,
        content_blocks=request.content_blocks,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset
```

- [ ] **Step 9: Add AssetCreateRequest schema**

```python
# api/app/schemas/asset.py (extend)
from pydantic import BaseModel, Field

class AssetCreateRequest(BaseModel):
    slug: str = Field(..., min_length=1, max_length=200, pattern=r'^[a-z0-9-]+$')
    title: str = Field(..., min_length=1, max_length=240)
    subtitle: str | None = Field(None, max_length=300)
    short_description: str = Field(..., min_length=1, max_length=500)
    cloud_providers: list[str] = []
    industries: list[str] = []
    technologies: list[str] = []
    asset_type: str = Field(..., pattern=r'^(solution|whitepaper|demo|reference-architecture)$')
    status: str = Field(..., pattern=r'^(draft|published|archived)$')
    visibility: str = Field(..., pattern=r'^(public|restricted|internal)$')
    allowed_roles: list[str] = []
    allowed_users: list[str] = []
    content_blocks: list[dict] = []
```

- [ ] **Step 10: Run test to verify it passes**

```bash
cd api
pytest tests/test_admin_assets.py::test_create_asset_success -v
pytest tests/test_admin_assets.py::test_create_asset_slug_conflict -v
```

Expected: Both PASS

- [ ] **Step 11: Write failing test for PUT /admin/assets/{id}**

```python
# api/tests/test_admin_assets.py (append)
def test_update_asset_success():
    """Should update asset with valid payload."""
    db = SessionLocal()
    asset = db.query(Asset).filter(Asset.slug == "test-asset-01").first()
    db.close()
    
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    
    payload = {
        "slug": "test-asset-01",  # Same slug (no conflict)
        "title": "Updated Title",
        "short_description": "Updated description",
        "asset_type": "solution",
        "status": "published",
        "visibility": "public"
    }
    
    response = client.put(
        f"/api/v1/admin/assets/{asset.id}",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["status"] == "published"

def test_update_asset_slug_conflict():
    """Should return 409 when new slug conflicts with another asset."""
    db = SessionLocal()
    asset1 = db.query(Asset).filter(Asset.slug == "test-asset-01").first()
    asset2 = db.query(Asset).filter(Asset.slug == "new-asset-01").first()
    db.close()
    
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    
    payload = {
        "slug": "new-asset-01",  # Conflicts with asset2
        "title": "Conflict Test",
        "short_description": "Test",
        "asset_type": "solution",
        "status": "draft",
        "visibility": "public"
    }
    
    response = client.put(
        f"/api/v1/admin/assets/{asset1.id}",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 409
```

- [ ] **Step 12: Run test to verify it fails**

```bash
cd api
pytest tests/test_admin_assets.py::test_update_asset_success -v
```

Expected: FAIL with "route not found"

- [ ] **Step 13: Implement PUT endpoint**

```python
# api/app/api/v1/admin_assets.py (extend)
@router.put("/{asset_id}", response_model=AssetDetail)
def update_asset(
    asset_id: str,
    request: AssetCreateRequest,  # Same schema as create
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Update existing asset."""
    # Find asset
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=404,
            detail={"code": "asset_not_found", "message": "Asset not found"}
        )
    
    # Check slug uniqueness (exclude self)
    if request.slug != asset.slug:
        existing = db.query(Asset).filter(Asset.slug == request.slug).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail={"code": "slug_already_exists", "message": "Slug already exists"}
            )
    
    # Update asset
    asset.slug = request.slug
    asset.title = request.title
    asset.subtitle = request.subtitle
    asset.short_description = request.short_description
    asset.cloud_providers = request.cloud_providers
    asset.industries = request.industries
    asset.technologies = request.technologies
    asset.asset_type = request.asset_type
    asset.status = request.status
    asset.visibility = request.visibility
    asset.allowed_roles = request.allowed_roles
    asset.allowed_users = request.allowed_users
    asset.content_blocks = request.content_blocks
    
    db.commit()
    db.refresh(asset)
    return asset
```

- [ ] **Step 14: Run all backend tests**

```bash
cd api
pytest tests/test_admin_assets.py -v
```

Expected: All tests PASS

- [ ] **Step 15: Commit backend changes**

```bash
cd api
git add api/v1/admin_assets.py schemas/asset.py main.py tests/test_admin_assets.py
git commit -m "feat: add asset CRUD API (GET/POST/PUT)"
```

---

## Task 2: Frontend Helper Functions

**Goal:** Implement type-safe helper functions for draft management, validation, and payload building.

**Files:**
- Create: `web/src/lib/admin-asset-editor.ts`
- Test: `web/src/lib/admin-asset-editor.test.ts`

---

- [ ] **Step 1: Write failing test for validateDraft**

```typescript
// web/src/lib/admin-asset-editor.test.ts
import { describe, it, expect } from "vitest";
import { validateDraft, INITIAL_DRAFT } from "./admin-asset-editor";

describe("validateDraft", () => {
  it("should pass with valid draft", () => {
    const draft = {
      ...INITIAL_DRAFT,
      slug: "test-asset",
      title: "Test Asset",
      shortDescription: "Test description",
    };
    const result = validateDraft(draft);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("should fail when slug is empty", () => {
    const draft = {
      ...INITIAL_DRAFT,
      slug: "",
      title: "Test",
      shortDescription: "Test",
    };
    const result = validateDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.slug).toBe("必填");
  });

  it("should fail when slug has invalid format", () => {
    const draft = {
      ...INITIAL_DRAFT,
      slug: "INVALID_SLUG",
      title: "Test",
      shortDescription: "Test",
    };
    const result = validateDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.slug).toBe("只能包含小写字母、数字和连字符");
  });

  it("should fail when title is empty", () => {
    const draft = {
      ...INITIAL_DRAFT,
      slug: "test",
      title: "",
      shortDescription: "Test",
    };
    const result = validateDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBe("必填");
  });

  it("should fail when shortDescription is empty", () => {
    const draft = {
      ...INITIAL_DRAFT,
      slug: "test",
      title: "Test",
      shortDescription: "",
    };
    const result = validateDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.shortDescription).toBe("必填");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web
npm test -- admin-asset-editor.test.ts
```

Expected: FAIL with "module not found" or "function not defined"

- [ ] **Step 3: Implement helper functions**

```typescript
// web/src/lib/admin-asset-editor.ts
export type AssetEditorDraft = {
  slug: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  cloudProviders: string[];
  industries: string[];
  technologies: string[];
  assetType: string;
  status: string;
  visibility: string;
  allowedRoles: string[];
  allowedUsers: string[];
};

export const INITIAL_DRAFT: AssetEditorDraft = {
  slug: "",
  title: "",
  subtitle: "",
  shortDescription: "",
  cloudProviders: [],
  industries: [],
  technologies: [],
  assetType: "solution",
  status: "draft",
  visibility: "public",
  allowedRoles: [],
  allowedUsers: [],
};

type ValidationResult = {
  valid: boolean;
  errors: Partial<Record<keyof AssetEditorDraft, string>>;
};

export function validateDraft(draft: AssetEditorDraft): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  // Slug validation
  if (!draft.slug.trim()) {
    errors.slug = "必填";
  } else if (!/^[a-z0-9-]+$/.test(draft.slug)) {
    errors.slug = "只能包含小写字母、数字和连字符";
  } else if (draft.slug.length > 200) {
    errors.slug = "最多 200 个字符";
  }

  // Title validation
  if (!draft.title.trim()) {
    errors.title = "必填";
  } else if (draft.title.length > 240) {
    errors.title = "最多 240 个字符";
  }

  // Subtitle validation (optional)
  if (draft.subtitle.length > 300) {
    errors.subtitle = "最多 300 个字符";
  }

  // Short description validation
  if (!draft.shortDescription.trim()) {
    errors.shortDescription = "必填";
  } else if (draft.shortDescription.length > 500) {
    errors.shortDescription = "最多 500 个字符";
  }

  // Enum validation
  const validAssetTypes = ["solution", "whitepaper", "demo", "reference-architecture"];
  if (!validAssetTypes.includes(draft.assetType)) {
    errors.assetType = "无效的资产类型";
  }

  const validStatuses = ["draft", "published", "archived"];
  if (!validStatuses.includes(draft.status)) {
    errors.status = "无效的状态";
  }

  const validVisibilities = ["public", "restricted", "internal"];
  if (!validVisibilities.includes(draft.visibility)) {
    errors.visibility = "无效的可见性";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildPayload(draft: AssetEditorDraft) {
  return {
    slug: draft.slug.trim(),
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim() || null,
    short_description: draft.shortDescription.trim(),
    cloud_providers: [...new Set(draft.cloudProviders.map((s) => s.trim()).filter(Boolean))],
    industries: [...new Set(draft.industries.map((s) => s.trim()).filter(Boolean))],
    technologies: [...new Set(draft.technologies.map((s) => s.trim()).filter(Boolean))],
    asset_type: draft.assetType,
    status: draft.status,
    visibility: draft.visibility,
    allowed_roles: [...new Set(draft.allowedRoles.map((s) => s.trim()).filter(Boolean))],
    allowed_users: [...new Set(draft.allowedUsers.map((s) => s.trim()).filter(Boolean))],
    content_blocks: [], // Phase 1: always empty
  };
}

export function parseAssetToDraft(asset: Record<string, any>): AssetEditorDraft {
  return {
    slug: asset.slug || "",
    title: asset.title || "",
    subtitle: asset.subtitle || "",
    shortDescription: asset.short_description || "",
    cloudProviders: Array.isArray(asset.cloud_providers) ? asset.cloud_providers : [],
    industries: Array.isArray(asset.industries) ? asset.industries : [],
    technologies: Array.isArray(asset.technologies) ? asset.technologies : [],
    assetType: asset.asset_type || "solution",
    status: asset.status || "draft",
    visibility: asset.visibility || "public",
    allowedRoles: Array.isArray(asset.allowed_roles) ? asset.allowed_roles : [],
    allowedUsers: Array.isArray(asset.allowed_users) ? asset.allowed_users : [],
  };
}

export function areDraftsEqual(a: AssetEditorDraft, b: AssetEditorDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web
npm test -- admin-asset-editor.test.ts
```

Expected: All tests PASS

- [ ] **Step 5: Add tests for buildPayload and parseAssetToDraft**

```typescript
// web/src/lib/admin-asset-editor.test.ts (append)
import { buildPayload, parseAssetToDraft } from "./admin-asset-editor";

describe("buildPayload", () => {
  it("should convert camelCase to snake_case", () => {
    const draft = {
      ...INITIAL_DRAFT,
      slug: "test",
      title: "Test",
      shortDescription: "Description",
      cloudProviders: ["aws", "azure"],
    };
    const payload = buildPayload(draft);
    expect(payload.slug).toBe("test");
    expect(payload.short_description).toBe("Description");
    expect(payload.cloud_providers).toEqual(["aws", "azure"]);
  });

  it("should deduplicate arrays", () => {
    const draft = {
      ...INITIAL_DRAFT,
      slug: "test",
      title: "Test",
      shortDescription: "Description",
      cloudProviders: ["aws", "aws", "azure"],
    };
    const payload = buildPayload(draft);
    expect(payload.cloud_providers).toEqual(["aws", "azure"]);
  });

  it("should trim strings and remove empty values", () => {
    const draft = {
      ...INITIAL_DRAFT,
      slug: "test",
      title: "Test",
      shortDescription: "Description",
      cloudProviders: ["aws", "  ", "azure"],
    };
    const payload = buildPayload(draft);
    expect(payload.cloud_providers).toEqual(["aws", "azure"]);
  });

  it("should set content_blocks to empty array", () => {
    const payload = buildPayload(INITIAL_DRAFT);
    expect(payload.content_blocks).toEqual([]);
  });
});

describe("parseAssetToDraft", () => {
  it("should convert snake_case to camelCase", () => {
    const asset = {
      slug: "test",
      title: "Test",
      short_description: "Description",
      cloud_providers: ["aws"],
    };
    const draft = parseAssetToDraft(asset);
    expect(draft.slug).toBe("test");
    expect(draft.shortDescription).toBe("Description");
    expect(draft.cloudProviders).toEqual(["aws"]);
  });

  it("should handle missing fields with defaults", () => {
    const asset = { slug: "test" };
    const draft = parseAssetToDraft(asset);
    expect(draft.title).toBe("");
    expect(draft.assetType).toBe("solution");
    expect(draft.status).toBe("draft");
    expect(draft.visibility).toBe("public");
  });
});
```

- [ ] **Step 6: Run all helper tests**

```bash
cd web
npm test -- admin-asset-editor.test.ts
```

Expected: All tests PASS

- [ ] **Step 7: Commit helper functions**

```bash
cd web
git add src/lib/admin-asset-editor.ts src/lib/admin-asset-editor.test.ts
git commit -m "feat: add asset editor helper functions with validation"
```

---

## Task 3: TagInput Component

**Goal:** Build reusable tag input with chip rendering and optional suggestions.

**Files:**
- Create: `web/src/components/admin/tag-input.tsx`
- Test: `web/src/components/admin/tag-input.test.tsx`

---

- [ ] **Step 1: Write failing test for TagInput behavior**

```typescript
// web/src/components/admin/tag-input.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagInput } from "./tag-input";

describe("TagInput", () => {
  it("should render empty input", () => {
    render(<TagInput value={[]} onChange={() => {}} />);
    const input = screen.getByPlaceholderText(/add tag/i);
    expect(input).toBeInTheDocument();
  });

  it("should render chips for existing values", () => {
    render(<TagInput value={["aws", "azure"]} onChange={() => {}} />);
    expect(screen.getByText("aws")).toBeInTheDocument();
    expect(screen.getByText("azure")).toBeInTheDocument();
  });

  it("should add tag on Enter", () => {
    let values: string[] = [];
    render(
      <TagInput
        value={values}
        onChange={(newValues) => {
          values = newValues;
        }}
      />
    );
    const input = screen.getByPlaceholderText(/add tag/i);
    fireEvent.change(input, { target: { value: "gcp" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(values).toContain("gcp");
  });

  it("should add tag on comma", () => {
    let values: string[] = [];
    render(
      <TagInput
        value={values}
        onChange={(newValues) => {
          values = newValues;
        }}
      />
    );
    const input = screen.getByPlaceholderText(/add tag/i);
    fireEvent.change(input, { target: { value: "aws," } });
    expect(values).toContain("aws");
  });

  it("should deduplicate tags", () => {
    let values = ["aws"];
    render(
      <TagInput
        value={values}
        onChange={(newValues) => {
          values = newValues;
        }}
      />
    );
    const input = screen.getByPlaceholderText(/add tag/i);
    fireEvent.change(input, { target: { value: "aws" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(values.filter((v) => v === "aws")).toHaveLength(1);
  });

  it("should remove tag via × button", () => {
    let values = ["aws", "azure"];
    render(
      <TagInput
        value={values}
        onChange={(newValues) => {
          values = newValues;
        }}
      />
    );
    const removeButton = screen.getAllByText("×")[0];
    fireEvent.click(removeButton);
    expect(values).not.toContain("aws");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web
npm test -- tag-input.test.tsx
```

Expected: FAIL with "module not found"

- [ ] **Step 3: Implement TagInput component**

```typescript
// web/src/components/admin/tag-input.tsx
"use client";

import { useState } from "react";

type TagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
};

export function TagInput({ value, onChange, placeholder = "Add tag", suggestions }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return; // Deduplicate
    onChange([...value, trimmed]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Check for separators
    if (val.includes(",") || val.includes(" ")) {
      const parts = val.split(/[,\s]+/);
      parts.forEach((part) => {
        if (part.trim()) {
          addTag(part);
        }
      });
    } else {
      setInput(val);
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const filteredSuggestions = suggestions
    ? suggestions.filter((s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s))
    : [];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-[rgb(138_133_245_/15%)] px-3 py-1 text-sm text-[var(--color-periwinkle)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-[var(--color-periwinkle)] hover:text-[var(--color-text-primary)]"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/95%)] py-1 shadow-lg">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  addTag(s);
                  setShowSuggestions(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[rgb(255_255_255_/5%)]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web
npm test -- tag-input.test.tsx
```

Expected: All tests PASS

- [ ] **Step 5: Commit TagInput component**

```bash
cd web
git add src/components/admin/tag-input.tsx src/components/admin/tag-input.test.tsx
git commit -m "feat: add reusable TagInput component"
```

---

## Task 4: AssetEditorForm Component

**Goal:** Build unified form component with 4 cards, validation, and dirty detection.

**Files:**
- Create: `web/src/components/admin/asset-editor-form.tsx`

---

- [ ] **Step 1: Create AssetEditorForm component**

```typescript
// web/src/components/admin/asset-editor-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TagInput } from "./tag-input";
import {
  AssetEditorDraft,
  INITIAL_DRAFT,
  validateDraft,
  buildPayload,
  parseAssetToDraft,
  areDraftsEqual,
} from "@/lib/admin-asset-editor";
import { adminRequest, getErrorMessage } from "@/lib/admin";

type AssetEditorFormProps = {
  mode: "create" | "edit";
  assetId?: string;
  token: string;
};

export function AssetEditorForm({ mode, assetId, token }: AssetEditorFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<AssetEditorDraft>(INITIAL_DRAFT);
  const [initialDraft, setInitialDraft] = useState<AssetEditorDraft>(INITIAL_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<keyof AssetEditorDraft, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState("");
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);

  // Load asset data in edit mode
  useEffect(() => {
    if (mode === "edit" && assetId) {
      let canceled = false;
      (async () => {
        try {
          const result = await adminRequest<unknown>(`/api/v1/admin/assets/${assetId}`, token, {
            method: "GET",
          });
          if (canceled) return;
          if ("data" in result) {
            const assetData = result.data as Record<string, any>;
            const parsed = parseAssetToDraft(assetData);
            setDraft(parsed);
            setInitialDraft(parsed);
          } else {
            setLoadError("加载失败");
          }
        } catch (err) {
          if (!canceled) setLoadError("加载失败");
        } finally {
          if (!canceled) setLoading(false);
        }
      })();
      return () => {
        canceled = true;
      };
    }
  }, [mode, assetId, token]);

  // Load role suggestions
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const result = await adminRequest<unknown>("/api/v1/admin/roles", token, { method: "GET" });
        if (canceled) return;
        if ("data" in result) {
          const roles = Array.isArray(result.data) ? result.data : [];
          setRoleSuggestions(roles.map((r: any) => r.name).filter(Boolean));
        }
      } catch (err) {
        // Ignore error, suggestions are optional
      }
    })();
    return () => {
      canceled = true;
    };
  }, [token]);

  const isDirty = !areDraftsEqual(draft, initialDraft);

  const updateField = <K extends keyof AssetEditorDraft>(key: K, value: AssetEditorDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    // Clear error when user edits
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    // Validate
    const validation = validateDraft(draft);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload(draft);
      const url = mode === "create" ? "/api/v1/admin/assets" : `/api/v1/admin/assets/${assetId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const result = await adminRequest<unknown>(url, token, {
        method,
        body: JSON.stringify(payload),
      });

      if ("data" in result) {
        router.push("/admin/assets");
      } else {
        setSubmitError(getErrorMessage(result.data, result.status));
      }
    } catch (err) {
      setSubmitError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm("有未保存的变更，确定要离开吗？")) {
      return;
    }
    router.push("/admin/assets");
  };

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  if (loading) {
    return <div className="py-12 text-center text-[var(--color-text-secondary)]">加载中...</div>;
  }

  if (loadError) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-[var(--color-text-secondary)]">{loadError}</div>
        <button
          onClick={() => router.push("/admin/assets")}
          className="rounded-lg bg-[var(--color-electric-purple)] px-4 py-2 text-sm font-medium text-white"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Card 1: Basic Info */}
      <div className="rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] p-6 backdrop-blur-[24px]">
        <div className="mb-4">
          <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
            BASIC INFORMATION
          </div>
          <div className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
            基本信息
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={draft.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
            />
            {errors.slug && <div className="mt-1 text-xs text-red-500">{errors.slug}</div>}
          </div>
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
            />
            {errors.title && <div className="mt-1 text-xs text-red-500">{errors.title}</div>}
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Subtitle
            </label>
            <input
              type="text"
              value={draft.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
            />
            {errors.subtitle && <div className="mt-1 text-xs text-red-500">{errors.subtitle}</div>}
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={draft.shortDescription}
              onChange={(e) => updateField("shortDescription", e.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
            />
            {errors.shortDescription && (
              <div className="mt-1 text-xs text-red-500">{errors.shortDescription}</div>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Tags */}
      <div className="rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] p-6 backdrop-blur-[24px]">
        <div className="mb-4">
          <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
            CLASSIFICATION TAGS
          </div>
          <div className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
            分类标签
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Cloud Providers
            </label>
            <TagInput
              value={draft.cloudProviders}
              onChange={(val) => updateField("cloudProviders", val)}
              placeholder="输入标签，按回车添加"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Industries
            </label>
            <TagInput
              value={draft.industries}
              onChange={(val) => updateField("industries", val)}
              placeholder="输入标签，按回车添加"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Technologies
            </label>
            <TagInput
              value={draft.technologies}
              onChange={(val) => updateField("technologies", val)}
              placeholder="输入标签，按回车添加"
            />
          </div>
        </div>
      </div>

      {/* Card 3: Type & Status */}
      <div className="rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] p-6 backdrop-blur-[24px]">
        <div className="mb-4">
          <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
            TYPE & STATUS
          </div>
          <div className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
            类型与状态
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Asset Type
            </label>
            <select
              value={draft.assetType}
              onChange={(e) => updateField("assetType", e.target.value)}
              className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/90%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
            >
              <option value="solution">Solution</option>
              <option value="whitepaper">Whitepaper</option>
              <option value="demo">Demo</option>
              <option value="reference-architecture">Reference Architecture</option>
            </select>
            {errors.assetType && <div className="mt-1 text-xs text-red-500">{errors.assetType}</div>}
          </div>
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">Status</label>
            <select
              value={draft.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/90%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            {errors.status && <div className="mt-1 text-xs text-red-500">{errors.status}</div>}
          </div>
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Visibility
            </label>
            <select
              value={draft.visibility}
              onChange={(e) => updateField("visibility", e.target.value)}
              className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/90%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
              <option value="internal">Internal</option>
            </select>
            {errors.visibility && (
              <div className="mt-1 text-xs text-red-500">{errors.visibility}</div>
            )}
          </div>
        </div>
      </div>

      {/* Card 4: Access Control */}
      <div className="rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] p-6 backdrop-blur-[24px]">
        <div className="mb-4">
          <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
            ACCESS CONTROL
          </div>
          <div className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
            访问控制
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Allowed Roles
            </label>
            <TagInput
              value={draft.allowedRoles}
              onChange={(val) => updateField("allowedRoles", val)}
              placeholder="输入角色名称"
              suggestions={roleSuggestions}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-secondary)]">
              Allowed Users
            </label>
            <TagInput
              value={draft.allowedUsers}
              onChange={(val) => updateField("allowedUsers", val)}
              placeholder="输入用户邮箱"
            />
          </div>
        </div>
        <div className="mt-3 text-xs text-[var(--color-text-tertiary)]">
          💡 当 visibility = public 时，allowed_roles / allowed_users 不影响公共访问
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-4">
        {submitError && <div className="text-sm text-red-500">{submitError}</div>}
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-[rgb(212_218_245_/12%)] px-6 py-2 text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isDirty || submitting}
          className="rounded-lg bg-[var(--color-electric-purple)] px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "保存中..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit AssetEditorForm component**

```bash
cd web
git add src/components/admin/asset-editor-form.tsx
git commit -m "feat: add unified AssetEditorForm component"
```

---

## Task 5: Create/Edit Pages

**Goal:** Build page wrappers for create and edit routes.

**Files:**
- Create: `web/src/app/admin/assets/new/page.tsx`
- Create: `web/src/app/admin/assets/[id]/edit/page.tsx`

---

- [ ] **Step 1: Create /admin/assets/new page**

```typescript
// web/src/app/admin/assets/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredAdminToken } from "@/lib/admin";
import { AssetEditorForm } from "@/components/admin/asset-editor-form";

export default function NewAssetPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return getStoredAdminToken();
  });

  useEffect(() => {
    if (!token) router.replace("/auth/login");
  }, [router, token]);

  if (!token) return null;

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / ASSETS / NEW
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Create New Asset
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              创建新的资产条目
            </div>
          </div>
          <Link
            href="/admin/assets"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ← Back to Assets
          </Link>
        </div>

        <AssetEditorForm mode="create" token={token} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit create page**

```bash
cd web
git add src/app/admin/assets/new/page.tsx
git commit -m "feat: add /admin/assets/new page"
```

- [ ] **Step 3: Create /admin/assets/[id]/edit page**

```typescript
// web/src/app/admin/assets/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getStoredAdminToken } from "@/lib/admin";
import { AssetEditorForm } from "@/components/admin/asset-editor-form";

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return getStoredAdminToken();
  });

  useEffect(() => {
    if (!token) router.replace("/auth/login");
  }, [router, token]);

  if (!token) return null;

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / ASSETS / EDIT
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Edit Asset
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              编辑资产条目
            </div>
          </div>
          <Link
            href="/admin/assets"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ← Back to Assets
          </Link>
        </div>

        <AssetEditorForm mode="edit" assetId={assetId} token={token} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit edit page**

```bash
cd web
git add src/app/admin/assets/[id]/edit/page.tsx
git commit -m "feat: add /admin/assets/[id]/edit page"
```

---

## Task 6: List Page Upgrade

**Goal:** Upgrade assets list page with adminRequest, New Asset button, and Edit links.

**Files:**
- Modify: `web/src/app/admin/assets/page.tsx`

---

- [ ] **Step 1: Rewrite assets list page**

```typescript
// web/src/app/admin/assets/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminRequest, extractArrayPayload, getStoredAdminToken, formatDateLabel } from "@/lib/admin";

type AssetRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string;
  cloud_providers: string[];
  industries: string[];
  asset_type: string;
  status: string;
  visibility: string;
  created_at: string;
};

export default function AdminAssetsPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return getStoredAdminToken();
  });
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) router.replace("/auth/login");
  }, [router, token]);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    (async () => {
      try {
        const result = await adminRequest<unknown>("/api/v1/admin/assets", token, {
          method: "GET",
        });
        if (canceled) return;
        if ("data" in result) {
          setRows(extractArrayPayload(result.data, ["assets", "items", "results"]));
        }
      } catch (err) {
        // Ignore error
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [token]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500/10 text-gray-400",
      published: "bg-green-500/10 text-green-400",
      archived: "bg-amber-500/10 text-amber-400",
    };
    return (
      <span className={`inline-block rounded-full px-3 py-1 text-xs ${colors[status] || colors.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / ASSETS
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">Assets</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              管理所有资产条目
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/assets/new"
              className="rounded-lg bg-[var(--color-electric-purple)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              + New Asset
            </Link>
            <Link
              href="/admin"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              ← Back
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[var(--color-text-secondary)]">加载中...</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
            <div className="grid grid-cols-[1fr_120px_120px_120px_140px_100px] gap-4 border-b border-[rgb(212_218_245_/12%)] px-5 py-3 text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
              <div>Title</div>
              <div>Type</div>
              <div>Status</div>
              <div>Visibility</div>
              <div>Cloud</div>
              <div>Action</div>
            </div>
            <div className="divide-y divide-[rgb(212_218_245_/10%)]">
              {rows.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-[1fr_120px_120px_120px_140px_100px] gap-4 px-5 py-4 text-sm text-[var(--color-text-primary)]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.title}</div>
                    <div className="mt-1 truncate text-xs text-[var(--color-text-tertiary)]">
                      {a.slug}
                    </div>
                  </div>
                  <div className="text-[var(--color-text-secondary)]">{a.asset_type}</div>
                  <div>{getStatusBadge(a.status)}</div>
                  <div className="text-[var(--color-text-secondary)]">{a.visibility}</div>
                  <div className="text-[var(--color-text-secondary)]">
                    {a.cloud_providers.map((c) => c.toUpperCase()).join(" / ")}
                  </div>
                  <div>
                    <Link
                      href={`/admin/assets/${a.id}/edit`}
                      className="text-sm text-[var(--color-electric-purple)] hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
              {rows.length === 0 ? (
                <div className="px-5 py-8 text-sm text-[var(--color-text-secondary)]">
                  No assets.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit list page upgrade**

```bash
cd web
git add src/app/admin/assets/page.tsx
git commit -m "feat: upgrade assets list page with admin UI standards"
```

---

## Task 7: Integration Testing

**Goal:** Test complete create/edit flows end-to-end.

---

- [ ] **Step 1: Start backend and frontend**

```bash
# Terminal 1: Backend
cd api
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd web
npm run dev
```

- [ ] **Step 2: Test create flow in browser**

1. Navigate to `http://localhost:3000/auth/login`
2. Login with admin credentials
3. Navigate to `/admin/assets`
4. Click "New Asset" button
5. Fill in form:
   - Slug: `test-create-01`
   - Title: `Test Create Asset`
   - Short Description: `Test description`
   - Cloud Providers: `aws`, `azure`
   - Status: `draft`
6. Click "Save Changes"
7. Verify redirect to `/admin/assets`
8. Verify new asset appears in list

- [ ] **Step 3: Test edit flow in browser**

1. Click "Edit" link on the asset created above
2. Verify form loads with existing data
3. Change title to `Updated Test Asset`
4. Add industry tag: `fintech`
5. Click "Save Changes"
6. Verify redirect to `/admin/assets`
7. Verify title and industry updated in list

- [ ] **Step 4: Test validation errors**

1. Navigate to `/admin/assets/new`
2. Try to submit empty form
3. Verify error messages appear on required fields
4. Enter invalid slug: `INVALID_SLUG`
5. Verify error message: "只能包含小写字母、数字和连字符"

- [ ] **Step 5: Test slug conflict**

1. Navigate to `/admin/assets/new`
2. Enter slug that already exists: `test-create-01`
3. Fill in other required fields
4. Click "Save Changes"
5. Verify error message: "这个 Slug 已被其他资产使用，请换一个"

- [ ] **Step 6: Test dirty detection**

1. Navigate to `/admin/assets/new`
2. Fill in some fields
3. Verify "Save Changes" button is enabled
4. Clear all fields
5. Verify "Save Changes" button is disabled (no changes)
6. Try to navigate away
7. Verify confirmation dialog appears

- [ ] **Step 7: Run all tests**

```bash
# Backend tests
cd api
pytest tests/test_admin_assets.py -v

# Frontend tests
cd web
npm test
```

Expected: All tests pass

- [ ] **Step 8: Final commit**

```bash
cd web
git add .
git commit -m "feat: complete asset editor with create/edit flows"
```

---

## Success Criteria

✅ Can create a new asset via UI  
✅ Can edit an existing asset via UI  
✅ Slug uniqueness enforced (409 error handled)  
✅ All validation rules working (client + server)  
✅ Form preserves data on network error  
✅ Dirty detection prevents unnecessary saves  
✅ Unsaved changes warning works  
✅ List page shows all assets with Edit links  
✅ All tests passing (backend + frontend)

---

## Notes

- Phase 1 does not edit `content_blocks`. It's preserved during edit and set to `[]` during create.
- The backend uses the same `AssetCreateRequest` schema for both POST and PUT.
- Frontend uses camelCase for draft state, converts to snake_case for API payload.
- TagInput deduplicates and trims values automatically.
- Role suggestions are loaded from `/api/v1/admin/roles` for the `allowedRoles` field.
