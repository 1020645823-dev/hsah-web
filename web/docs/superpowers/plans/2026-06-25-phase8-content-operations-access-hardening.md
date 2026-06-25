# Phase 8 — Content Operations & Access Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐资产发布治理、公开资产库搜索筛选分页、Admin 鉴权落地和资产批量删除收敛，让 HSAH 从“可编辑”升级为“可运营”。

**Architecture:** 后端先把公开资产接口收紧为仅返回 `public + published` 内容，并补齐资产状态流转与发布前校验；前端再将 `/assets` 升级为带 URL query 的可搜索资产库，同时把 Admin 鉴权和批量删除统一到现有 guard 与 API contract 上。整个 Phase 8 以最小改动复用现有模型、路由和组件，不做数据库迁移。

**Tech Stack:** Python (FastAPI, SQLAlchemy, pytest), TypeScript (Next.js 16 App Router, React 19, Tailwind CSS 4, Vitest, ESLint)

---

## File Map

| File | Action | Responsibility |
|------|--------|--------------|
| `/Users/weiwei.g.zhang/Documents/hsah/api/app/schemas/common.py` | Modify | 复用或扩展分页响应模型 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/app/api/v1/assets.py` | Modify | 公开资产分页、筛选、published-only 可见性、详情 404 规则 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/app/api/v1/admin_assets.py` | Modify | 资产发布校验、publish/unpublish/archive/restore 流转端点 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_assets.py` | Modify | 公开资产列表与详情的 published/public 约束测试 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_admin_assets.py` | Modify | 状态流转、发布校验、batch-delete 回归测试 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/public-assets.ts` | Create | 公开资产库 query builder、类型、fetch helper |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/public-assets.test.ts` | Create | query builder、响应解析测试 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/assets/page.tsx` | Modify | 公开资产库搜索、筛选、分页 UI |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/assets/assets-client.tsx` | Create | 客户端资产库容器，管理 URL query 和交互 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/assets/assets-client.test.tsx` | Create | 空状态、筛选、分页、结果渲染测试 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/route-guard.tsx` | Modify | 修正重定向到 `/auth/login` |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/hooks/use-auth.ts` | Modify | token 失效清理与统一未登录状态 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/admin.ts` | Modify | 401 自动清 token；资产 batch-delete helper |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/page.tsx` | Modify | 状态流转按钮、发布错误展示、batch-delete 接入 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/users/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/roles/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/policies/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/matrix/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/simulator/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/templates/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/policies/wizard/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/new/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/[id]/edit/page.tsx` | Modify | 接入 RouteGuard |

---

## Task 1: 收紧公开资产 API 为 published-only + 分页合同

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/app/api/v1/assets.py`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/app/schemas/common.py`
- Test: `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_assets.py`

- [ ] **Step 1: 为公开资产列表写失败测试**

```python
def test_list_assets_returns_only_public_published(client: TestClient, db_session: Session) -> None:
    published = Asset(
        slug="pub-asset",
        title="Published Asset",
        short_description="Visible asset",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="published",
        visibility="public",
        content_blocks=[],
        allowed_roles=[],
        allowed_users=[],
    )
    draft = Asset(
        slug="draft-asset",
        title="Draft Asset",
        short_description="Hidden asset",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="draft",
        visibility="public",
        content_blocks=[],
        allowed_roles=[],
        allowed_users=[],
    )
    db_session.add_all([published, draft])
    db_session.commit()

    res = client.get("/api/v1/assets")

    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "pub-asset"
```

- [ ] **Step 2: 为公开详情页 hidden 状态写失败测试**

```python
def test_get_asset_returns_404_for_draft_asset(client: TestClient, db_session: Session) -> None:
    asset = Asset(
        slug="draft-detail",
        title="Draft Detail",
        short_description="Should be hidden",
        cloud_providers=["aws"],
        industries=["banking"],
        technologies=["ai"],
        asset_type="solution",
        status="draft",
        visibility="public",
        content_blocks=[],
        allowed_roles=[],
        allowed_users=[],
    )
    db_session.add(asset)
    db_session.commit()

    res = client.get("/api/v1/assets/draft-detail")

    assert res.status_code == 404
```

- [ ] **Step 3: 运行测试确认失败**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_assets.py -q
```

Expected: 新增用例失败，因为当前接口仍返回 plain list，且 draft 详情仍可被访问。

- [ ] **Step 4: 实现分页响应与 published-only 约束**

```python
# app/api/v1/assets.py
from sqlalchemy import func, or_, select

from app.schemas.common import PaginatedResponse


@router.get("", response_model=PaginatedResponse[AssetSummary])
def list_assets(...):
    stmt = select(Asset).where(
        Asset.visibility == "public",
        Asset.status == "published",
    )
    count_stmt = select(func.count()).select_from(Asset).where(
        Asset.visibility == "public",
        Asset.status == "published",
    )
    ...
    total = db.scalar(count_stmt) or 0
    rows = db.scalars(stmt.offset(offset).limit(limit)).all()
    return PaginatedResponse(
        items=[...],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{slug}", response_model=AssetDetail)
def get_asset(slug: str, db: Session = Depends(get_db)) -> AssetDetail:
    asset = db.scalar(select(Asset).where(Asset.slug == slug))
    if asset is None or asset.visibility != "public" or asset.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
```

- [ ] **Step 5: 运行测试确认通过**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_assets.py -q
```

Expected: PASS。

- [ ] **Step 6: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/app/api/v1/assets.py api/app/schemas/common.py api/tests/test_assets.py
git commit -m "feat: restrict public assets to published visibility"
```

---

## Task 2: 添加资产发布校验与状态流转端点

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/app/api/v1/admin_assets.py`
- Test: `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_admin_assets.py`

- [ ] **Step 1: 写 publish 校验失败测试**

```python
def test_publish_asset_requires_visible_content_block(client: TestClient, token_headers: dict[str, str]) -> None:
    res = client.post(
        "/api/v1/admin/assets",
        json={
            "slug": "empty-asset",
            "title": "Empty Asset",
            "short_description": "No visible blocks",
            "cloud_providers": ["aws"],
            "industries": ["banking"],
            "technologies": ["ai"],
            "asset_type": "solution",
            "status": "draft",
            "visibility": "public",
            "content_blocks": [],
            "allowed_roles": [],
            "allowed_users": [],
        },
        headers=token_headers,
    )
    asset_id = res.json()["id"]

    publish_res = client.post(f"/api/v1/admin/assets/{asset_id}/publish", headers=token_headers)

    assert publish_res.status_code == 422
    assert publish_res.json()["detail"]["code"] == "publish_validation_failed"
    assert "content_blocks" in publish_res.json()["detail"]["fields"]
```

- [ ] **Step 2: 写 publish / unpublish / archive 成功测试**

```python
def test_asset_status_transitions(client: TestClient, token_headers: dict[str, str]) -> None:
    create_res = client.post("/api/v1/admin/assets", json=VALID_ASSET_PAYLOAD, headers=token_headers)
    asset_id = create_res.json()["id"]

    publish_res = client.post(f"/api/v1/admin/assets/{asset_id}/publish", headers=token_headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["status"] == "published"

    unpublish_res = client.post(f"/api/v1/admin/assets/{asset_id}/unpublish", headers=token_headers)
    assert unpublish_res.status_code == 200
    assert unpublish_res.json()["status"] == "draft"

    archive_res = client.post(f"/api/v1/admin/assets/{asset_id}/archive", headers=token_headers)
    assert archive_res.status_code == 200
    assert archive_res.json()["status"] == "archived"
```

- [ ] **Step 3: 运行测试确认失败**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_admin_assets.py -q
```

Expected: FAIL，因为流转端点尚不存在。

- [ ] **Step 4: 添加发布校验 helper 与状态流转端点**

```python
# app/api/v1/admin_assets.py
def _validate_publishable(asset: Asset) -> list[str]:
    errors: list[str] = []
    if not asset.title.strip():
        errors.append("title")
    if not asset.slug.strip():
        errors.append("slug")
    if not asset.short_description.strip():
        errors.append("short_description")
    if not asset.cloud_providers:
        errors.append("cloud_providers")
    visible_blocks = [
        block for block in (asset.content_blocks or [])
        if isinstance(block, dict) and block.get("visible", True)
    ]
    if not visible_blocks:
        errors.append("content_blocks")
    return errors


@router.post("/{asset_id}/publish")
def publish_asset(...):
    asset = _get_asset_or_404(asset_id, db)
    fields = _validate_publishable(asset)
    if fields:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "publish_validation_failed",
                "message": "Asset is not ready to publish",
                "fields": fields,
            },
        )
    asset.status = "published"
    db.commit()
    db.refresh(asset)
    return _to_detail(asset)
```

- [ ] **Step 5: 实现 `unpublish`、`archive`、`restore` 最小逻辑**

```python
@router.post("/{asset_id}/unpublish")
def unpublish_asset(...):
    asset = _get_asset_or_404(asset_id, db)
    asset.status = "draft"
    db.commit()
    db.refresh(asset)
    return _to_detail(asset)


@router.post("/{asset_id}/archive")
def archive_asset(...):
    asset = _get_asset_or_404(asset_id, db)
    asset.status = "archived"
    db.commit()
    db.refresh(asset)
    return _to_detail(asset)


@router.post("/{asset_id}/restore")
def restore_asset(...):
    asset = _get_asset_or_404(asset_id, db)
    asset.status = "draft"
    db.commit()
    db.refresh(asset)
    return _to_detail(asset)
```

- [ ] **Step 6: 运行测试确认通过**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_admin_assets.py -q
```

Expected: PASS。

- [ ] **Step 7: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/app/api/v1/admin_assets.py api/tests/test_admin_assets.py
git commit -m "feat: add asset publishing workflow endpoints"
```

---

## Task 3: 实现公开资产库 query helper 与客户端容器

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/public-assets.ts`
- Test: `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/public-assets.test.ts`
- Create: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/assets/assets-client.tsx`
- Test: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/assets/assets-client.test.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/assets/page.tsx`

- [ ] **Step 1: 为 query builder 写失败测试**

```ts
it("builds query string with filters and pagination", () => {
  const query = buildAssetSearchQuery({
    q: "agent",
    cloud: "aws",
    industry: "banking",
    tech: "ai",
    assetType: "solution",
    limit: 12,
    offset: 24,
  });

  expect(query).toBe("?q=agent&cloud=aws&industry=banking&tech=ai&asset_type=solution&limit=12&offset=24");
});
```

- [ ] **Step 2: 实现 helper 与类型**

```ts
// src/lib/public-assets.ts
export type PublicAssetQuery = {
  q?: string;
  cloud?: string;
  industry?: string;
  tech?: string;
  assetType?: string;
  limit?: number;
  offset?: number;
};

export type PublicAssetSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string;
  cloud_providers: string[];
  industries: string[];
  technologies: string[];
  asset_type: string;
  status: string;
};

export type PublicAssetListResponse = {
  items: PublicAssetSummary[];
  total: number;
  limit: number;
  offset: number;
};
```

- [ ] **Step 3: 在 `assets-client.tsx` 写失败 UI 测试**

```tsx
it("renders empty state when no items exist", async () => {
  render(
    <AssetsClient
      initialResponse={{ items: [], total: 0, limit: 12, offset: 0 }}
      initialQuery={{}}
    />
  );

  expect(screen.getByText("No assets found.")).toBeInTheDocument();
});
```

- [ ] **Step 4: 实现客户端资产库容器**

```tsx
// src/app/assets/assets-client.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export function AssetsClient({
  initialResponse,
  initialQuery,
}: {
  initialResponse: PublicAssetListResponse;
  initialQuery: PublicAssetQuery;
}) {
  const [query, setQuery] = useState(initialQuery);
  const assets = initialResponse.items;

  return (
    <div className="w-full max-w-6xl space-y-8">
      <div className="grid gap-3 md:grid-cols-5">
        <input value={query.q ?? ""} placeholder="Search assets" />
      </div>
      <div className="text-sm text-[var(--color-text-secondary)]">
        {initialResponse.total} results
      </div>
      {assets.length === 0 ? <div>No assets found.</div> : null}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <Link key={asset.id} href={`/assets/${asset.slug}`}>
            {asset.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 将 `app/assets/page.tsx` 改为服务端取首屏 + 客户端交互**

```tsx
// src/app/assets/page.tsx
import { AssetsClient } from "./assets-client";
import { fetchPublicAssets, parseAssetQueryFromSearchParams } from "@/lib/public-assets";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const initialQuery = parseAssetQueryFromSearchParams(resolved);
  const initialResponse = await fetchPublicAssets(initialQuery);

  return (
    <div className="flex flex-1 justify-center px-6 py-14">
      <AssetsClient initialResponse={initialResponse} initialQuery={initialQuery} />
    </div>
  );
}
```

- [ ] **Step 6: 运行公开资产测试**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run test -- src/lib/public-assets.test.ts src/app/assets/assets-client.test.tsx
```

Expected: PASS。

- [ ] **Step 7: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/lib/public-assets.ts web/src/lib/public-assets.test.ts web/src/app/assets/page.tsx web/src/app/assets/assets-client.tsx web/src/app/assets/assets-client.test.tsx
git commit -m "feat: add public asset catalog search and pagination"
```

---

## Task 4: 落地 Admin 鉴权与 401 token 失效处理

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/route-guard.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/hooks/use-auth.ts`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/admin.ts`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/users/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/roles/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/policies/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/matrix/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/simulator/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/templates/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/policies/wizard/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/new/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/[id]/edit/page.tsx`

- [ ] **Step 1: 写 RouteGuard 重定向测试**

```tsx
it("redirects unauthenticated users to auth login", async () => {
  vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false });
  render(<RouteGuard><div>secret</div></RouteGuard>);
  expect(mockPush).toHaveBeenCalledWith("/auth/login");
});
```

- [ ] **Step 2: 修正 guard 与 token 清理 helper**

```ts
// src/lib/admin.ts
export function clearStoredAdminToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

export async function adminRequest<T>(...) {
  ...
  if (!res.ok) {
    if (res.status === 401) clearStoredAdminToken();
    return { ... };
  }
}
```

- [ ] **Step 3: 修正 `RouteGuard` 到 `/auth/login`**

```tsx
useEffect(() => {
  if (!isLoading && requireAuth && !user) {
    router.push("/auth/login");
  }
}, [isLoading, user, requireAuth, router]);
```

- [ ] **Step 4: 接入 admin 页面**

```tsx
export default function AdminUsersPage() {
  return (
    <RouteGuard>
      <AdminUsersPageInner />
    </RouteGuard>
  );
}
```

- [ ] **Step 5: 运行相关测试**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run test -- src/components/route-guard.test.tsx
npm run lint
```

Expected: PASS，且不存在 `/login` 残留跳转。

- [ ] **Step 6: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/components/route-guard.tsx web/src/hooks/use-auth.ts web/src/lib/admin.ts web/src/app/admin/
git commit -m "feat: harden admin auth and route protection"
```

---

## Task 5: 接入 admin 资产状态动作与 batch-delete 合同

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/admin.ts`
- Test: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/page.test.tsx` (create if absent)

- [ ] **Step 1: 为 batch-delete helper 写失败测试**

```ts
it("posts ids to batch-delete endpoint once", async () => {
  await batchDeleteAssets("token", ["a", "b"]);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/admin/assets/batch-delete"),
    expect.objectContaining({ method: "POST" }),
  );
});
```

- [ ] **Step 2: 在 `admin.ts` 添加 helper**

```ts
export async function batchDeleteAssets(token: string, ids: string[]) {
  return adminRequest<{ deleted: number; failed: Array<{ id: string; reason: string }> }>(
    "/api/v1/admin/assets/batch-delete",
    token,
    {
      method: "POST",
      body: JSON.stringify({ ids }),
    },
  );
}
```

- [ ] **Step 3: 在资产列表接入状态流转按钮**

```tsx
{a.status === "draft" ? (
  <button onClick={() => handleStatusAction(a.id, "publish")}>Publish</button>
) : null}
{a.status === "published" ? (
  <button onClick={() => handleStatusAction(a.id, "unpublish")}>Unpublish</button>
) : null}
<button onClick={() => handleStatusAction(a.id, "archive")}>Archive</button>
```

- [ ] **Step 4: 用 batch-delete 替换并发单删**

```tsx
async function handleBatchDelete() {
  if (!token || selectedIds.size === 0) return;
  const ids = Array.from(selectedIds);
  const result = await batchDeleteAssets(token, ids);
  if (!result.ok) {
    showMessage("error", result.message);
    return;
  }
  const { deleted, failed } = result.data;
  showMessage(
    failed.length > 0 ? "error" : "success",
    failed.length > 0 ? `已删除 ${deleted} 个资产，${failed.length} 个失败` : `已删除 ${deleted} 个资产`,
  );
}
```

- [ ] **Step 5: 展示发布失败的字段提示**

```tsx
if (!result.ok && result.status === 422 && isAdminRecord(result.data.detail)) {
  const fields = Array.isArray(result.data.detail.fields) ? result.data.detail.fields.join("、") : "";
  showMessage("error", `发布失败，请完善：${fields}`);
}
```

- [ ] **Step 6: 运行前端测试和构建**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run test
npm run build
```

Expected: PASS。

- [ ] **Step 7: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/admin/assets/page.tsx web/src/lib/admin.ts web/src/app/admin/assets/page.test.tsx
git commit -m "feat: add admin asset publish actions and batch delete"
```

---

## Task 6: 全量验证与回归

**Files:**
- Verify only

- [ ] **Step 1: 运行后端全量测试**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest -q
```

Expected: `61 passed` 以上，并包含新增 Phase 8 用例。

- [ ] **Step 2: 运行前端 lint + test + build**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run lint
npm run test
npm run build
```

Expected: 全部通过，无 errors、无 test failures、build 成功。

- [ ] **Step 3: 手工 smoke check**

Run the app and verify:

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
uvicorn app.main:app --reload

cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run dev
```

Manual checklist:

```text
1. Admin 未登录访问 /admin/assets 会跳到 /auth/login
2. Draft 资产不会出现在 /assets
3. Published + public 资产会出现在 /assets
4. /assets 筛选和分页会更新 URL
5. Admin 资产页批量删除只触发一个 batch 请求
6. Draft 资产点击 Publish 时，缺字段会出现明确提示
```

- [ ] **Step 4: Final commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/ web/
git commit -m "feat: complete phase 8 content operations hardening"
```

---

## Self-Review

- Spec coverage: 已覆盖发布治理、公开资产筛选分页、Admin 鉴权、batch-delete 四条主线。
- Placeholder scan: 无 TBD / TODO / “类似 Task N” 的占位描述。
- Type consistency: 统一使用 `status`、`visibility`、`items/total/limit/offset`、`/auth/login`、`/batch-delete`。
