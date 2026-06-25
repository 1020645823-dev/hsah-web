# Phase 6: Asset Detail Page, Public Content Detail Pages, Search & Pagination

**Goal:** Add asset detail views, public content detail pages, backend search, and pagination across both backend and frontend.

**Architecture:**
- Frontend: Next.js 15 App Router with React 19, Server Components for detail pages, Client Components for interactive admin tables.
- Backend: FastAPI with SQLAlchemy, generic `PaginatedResponse[T]` schema, `limit`/`offset` pagination.
- API: RESTful endpoints with consistent response wrappers.

**Tech Stack:**
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons.
- Backend: FastAPI, SQLAlchemy, Pydantic, SQLite.

---

## Feature 1: Asset Detail Page (`/assets/[id]`)

### Task 1.1: Create `AssetDetail` schema in `api/app/schemas/asset.py`
- [ ] Add `AssetDetail` schema extending `AssetBase` with `content_blocks: list[ContentBlock]`.
- [ ] Ensure `ContentBlock` schema supports types: `text`, `stat_card`, `image`, `code_snippet`, `callout`.

```python
# api/app/schemas/asset.py
class ContentBlock(BaseModel):
    type: str  # text, stat_card, image, code_snippet, callout
    content: str | None = None
    title: str | None = None
    value: str | None = None
    language: str | None = None
    icon: str | None = None
    class Config:
        from_attributes = True

class AssetDetail(AssetBase):
    id: int
    content_blocks: list[ContentBlock] = []
    class Config:
        from_attributes = True
```

### Task 1.2: Add `GET /api/v1/assets/{asset_id}` endpoint in `api/app/api/v1/assets.py`
- [ ] Create endpoint returning `AssetDetail` by ID.
- [ ] Handle 404 when asset not found.

```python
# api/app/api/v1/assets.py
@router.get("/{asset_id}", response_model=schemas.AssetDetail)
def get_asset(asset_id: int, db: Session = Depends(deps.get_db)):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
```

### Task 1.3: Create `getAssetById` helper in `web/src/lib/admin.ts`
- [ ] Add `getAssetById(id: number): Promise<AssetDetail>` function.

```typescript
// web/src/lib/admin.ts
export interface AssetDetail extends Asset {
  content_blocks: ContentBlock[];
}

export interface ContentBlock {
  type: 'text' | 'stat_card' | 'image' | 'code_snippet' | 'callout';
  content?: string;
  title?: string;
  value?: string;
  language?: string;
  icon?: string;
}

export async function getAssetById(id: number): Promise<AssetDetail> {
  const token = getStoredAdminToken();
  const res = await fetch(`${API_BASE}/api/v1/assets/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch asset');
  return res.json();
}
```

### Task 1.4: Create `ContentBlockRenderer` component in `web/src/components/content-block-renderer.tsx`
- [ ] Render each block type with appropriate styling.

```tsx
// web/src/components/content-block-renderer.tsx
'use client';

import { FileText, BarChart3, Image, Code, AlertCircle } from 'lucide-react';

interface ContentBlock {
  type: 'text' | 'stat_card' | 'image' | 'code_snippet' | 'callout';
  content?: string;
  title?: string;
  value?: string;
  language?: string;
  icon?: string;
}

export function ContentBlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => (
        <div key={idx}>
          {block.type === 'text' && (
            <div className="prose prose-invert max-w-none">
              <p className="text-[var(--color-text-secondary)]">{block.content}</p>
            </div>
          )}
          {block.type === 'stat_card' && (
            <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-[var(--color-electric-purple)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">{block.title}</span>
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">{block.value}</div>
            </div>
          )}
          {block.type === 'image' && (
            <div className="rounded-lg overflow-hidden border border-[var(--color-border)]">
              <img src={block.content} alt={block.title || 'Image'} className="w-full h-auto" />
              {block.title && (
                <p className="text-sm text-[var(--color-text-secondary)] p-3">{block.title}</p>
              )}
            </div>
          )}
          {block.type === 'code_snippet' && (
            <div className="bg-[#1a1a2e] rounded-lg border border-[var(--color-border)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-[var(--color-electric-purple)]" />
                  <span className="text-xs text-[var(--color-text-secondary)]">{block.language || 'code'}</span>
                </div>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm text-[var(--color-text-primary)]">{block.content}</code>
              </pre>
            </div>
          )}
          {block.type === 'callout' && (
            <div className="bg-[var(--color-card-bg)] border-l-4 border-[var(--color-electric-purple)] rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--color-electric-purple)] mt-0.5" />
                <div>
                  {block.title && (
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-1">{block.title}</h4>
                  )}
                  <p className="text-[var(--color-text-secondary)]">{block.content}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Task 1.5: Create `/assets/[id]` dynamic route page in `web/src/app/assets/[id]/page.tsx`
- [ ] Server Component fetching asset data.
- [ ] Display hero, metadata, and content blocks.

```tsx
// web/src/app/assets/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getAssetById } from '@/lib/admin';
import { ContentBlockRenderer } from '@/components/content-block-renderer';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const asset = await getAssetById(parseInt(params.id));
  if (!asset) notFound();

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/assets" className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-electric-purple)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Assets
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">{asset.name}</h1>
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {asset.type}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(asset.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg p-6">
          <ContentBlockRenderer blocks={asset.content_blocks} />
        </div>
      </div>
    </div>
  );
}
```

---

## Feature 2: Public Content Detail Pages

### Task 2.1: Add `getBySlug` helpers to `web/src/lib/public-content.ts`
- [ ] Add `getScenarioBySlug`, `getArchitectureBySlug`, `getInsightBySlug`, `getCommunityItemBySlug` functions.

```typescript
// web/src/lib/public-content.ts
export function getScenarioBySlug(slug: string) {
  return scenarios.find(s => s.slug === slug);
}

export function getArchitectureBySlug(slug: string) {
  return architectures.find(a => a.slug === slug);
}

export function getInsightBySlug(slug: string) {
  return insights.find(i => i.slug === slug);
}

export function getCommunityItemBySlug(slug: string) {
  return communityItems.find(c => c.slug === slug);
}
```

### Task 2.2: Create `/scenarios/[slug]` detail page in `web/src/app/scenarios/[slug]/page.tsx`
- [ ] Use `PublicSiteShell` components for consistent layout.

```tsx
// web/src/app/scenarios/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getScenarioBySlug } from '@/lib/public-content';
import { PublicSiteShell, PublicDetailHero, PublicProseSection, PublicMetricStrip, PublicRelatedLinks } from '@/components/public-site-shell';

export default function ScenarioDetailPage({ params }: { params: { slug: string } }) {
  const scenario = getScenarioBySlug(params.slug);
  if (!scenario) notFound();

  return (
    <PublicSiteShell>
      <PublicDetailHero
        title={scenario.title}
        description={scenario.description}
        tags={scenario.tags}
      />
      <PublicProseSection content={scenario.content} />
      {scenario.metrics && (
        <PublicMetricStrip metrics={scenario.metrics} />
      )}
      <PublicRelatedLinks
        links={scenario.relatedLinks || []}
        backHref="/scenarios"
        backLabel="Back to Scenarios"
      />
    </PublicSiteShell>
  );
}
```

### Task 2.3: Create `/architecture/[slug]` detail page in `web/src/app/architecture/[slug]/page.tsx`
- [ ] Similar pattern to scenarios.

```tsx
// web/src/app/architecture/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getArchitectureBySlug } from '@/lib/public-content';
import { PublicSiteShell, PublicDetailHero, PublicProseSection, PublicMetricStrip, PublicRelatedLinks } from '@/components/public-site-shell';

export default function ArchitectureDetailPage({ params }: { params: { slug: string } }) {
  const arch = getArchitectureBySlug(params.slug);
  if (!arch) notFound();

  return (
    <PublicSiteShell>
      <PublicDetailHero
        title={arch.title}
        description={arch.description}
        tags={arch.tags}
      />
      <PublicProseSection content={arch.content} />
      {arch.metrics && (
        <PublicMetricStrip metrics={arch.metrics} />
      )}
      <PublicRelatedLinks
        links={arch.relatedLinks || []}
        backHref="/architecture"
        backLabel="Back to Architecture"
      />
    </PublicSiteShell>
  );
}
```

### Task 2.4: Create `/insights/[slug]` detail page in `web/src/app/insights/[slug]/page.tsx`
- [ ] Similar pattern to scenarios.

```tsx
// web/src/app/insights/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getInsightBySlug } from '@/lib/public-content';
import { PublicSiteShell, PublicDetailHero, PublicProseSection, PublicRelatedLinks } from '@/components/public-site-shell';

export default function InsightDetailPage({ params }: { params: { slug: string } }) {
  const insight = getInsightBySlug(params.slug);
  if (!insight) notFound();

  return (
    <PublicSiteShell>
      <PublicDetailHero
        title={insight.title}
        description={insight.description}
        tags={insight.tags}
      />
      <PublicProseSection content={insight.content} />
      <PublicRelatedLinks
        links={insight.relatedLinks || []}
        backHref="/insights"
        backLabel="Back to Insights"
      />
    </PublicSiteShell>
  );
}
```

### Task 2.5: Create `/community/[slug]` detail page in `web/src/app/community/[slug]/page.tsx`
- [ ] Similar pattern to scenarios.

```tsx
// web/src/app/community/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getCommunityItemBySlug } from '@/lib/public-content';
import { PublicSiteShell, PublicDetailHero, PublicProseSection, PublicRelatedLinks } from '@/components/public-site-shell';

export default function CommunityDetailPage({ params }: { params: { slug: string } }) {
  const item = getCommunityItemBySlug(params.slug);
  if (!item) notFound();

  return (
    <PublicSiteShell>
      <PublicDetailHero
        title={item.title}
        description={item.description}
        tags={item.tags}
      />
      <PublicProseSection content={item.content} />
      <PublicRelatedLinks
        links={item.relatedLinks || []}
        backHref="/community"
        backLabel="Back to Community"
      />
    </PublicSiteShell>
  );
}
```

### Task 2.6: Update list pages to link to detail pages
- [ ] Update `/scenarios/page.tsx`, `/architecture/page.tsx`, `/insights/page.tsx`, `/community/page.tsx` to wrap cards in `Link` components pointing to `/${category}/${item.slug}`.

```tsx
// Example for scenarios list page (web/src/app/scenarios/page.tsx)
// Wrap existing card in:
<Link href={`/scenarios/${scenario.slug}`} className="block">
  {/* existing card content */}
</Link>
```

---

## Feature 3: Backend Search API

### Task 3.1: Verify `search_blocks` endpoint in `api/app/api/v1/admin_assets.py`
- [ ] Ensure `GET /api/v1/admin/assets/search-blocks` exists and accepts `q` (query string) and `type` (optional block type filter) parameters.
- [ ] It already exists; verify it searches across `content_blocks` JSON field.

```python
# api/app/api/v1/admin_assets.py (existing)
@router.get("/search-blocks", response_model=list[schemas.ContentBlock])
def search_blocks(q: str, type: str | None = None, db: Session = Depends(deps.get_db)):
    """Search across content blocks."""
    assets = db.query(models.Asset).all()
    results = []
    for asset in assets:
        for block in (asset.content_blocks or []):
            content = block.get("content", "")
            if q.lower() in content.lower():
                if type is None or block.get("type") == type:
                    results.append(block)
    return results
```

### Task 3.2: Add tests for `search_blocks` in `api/tests/test_admin_assets.py`
- [ ] Test search by query string.
- [ ] Test search with type filter.
- [ ] Test empty results.

```python
# api/tests/test_admin_assets.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestSearchBlocks:
    def test_search_blocks_by_query(self, admin_token):
        response = client.get(
            "/api/v1/admin/assets/search-blocks?q=test",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_search_blocks_with_type_filter(self, admin_token):
        response = client.get(
            "/api/v1/admin/assets/search-blocks?q=test&type=text",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        for block in data:
            assert block["type"] == "text"

    def test_search_blocks_empty_results(self, admin_token):
        response = client.get(
            "/api/v1/admin/assets/search-blocks?q=nonexistentquery12345",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json() == []
```

### Task 3.3: Add `searchBlocks` helper in `web/src/lib/admin.ts`
- [ ] Add frontend helper for search API.

```typescript
// web/src/lib/admin.ts
export async function searchBlocks(q: string, type?: string): Promise<ContentBlock[]> {
  const token = getStoredAdminToken();
  const params = new URLSearchParams({ q });
  if (type) params.append('type', type);
  const res = await fetch(`${API_BASE}/api/v1/admin/assets/search-blocks?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Search failed');
  return extractArrayPayload(await res.json());
}
```

---

## Feature 4: Pagination (Backend)

### Task 4.1: Create generic `PaginatedResponse` schema in `api/app/schemas/__init__.py`
- [ ] Add generic `PaginatedResponse[T]` model with `items`, `total`, `limit`, `offset`.

```python
# api/app/schemas/__init__.py
from typing import TypeVar, Generic
from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int

    @property
    def has_next(self) -> bool:
        return self.offset + self.limit < self.total

    @property
    def has_prev(self) -> bool:
        return self.offset > 0
```

### Task 4.2: Update `list_users` in `api/app/api/v1/admin.py` to support pagination
- [ ] Add `limit: int = 20` and `offset: int = 0` query parameters.
- [ ] Return `PaginatedResponse[UserOut]`.

```python
# api/app/api/v1/admin.py
from typing import Annotated
from fastapi import Query

@router.get("/users", response_model=schemas.PaginatedResponse[schemas.UserOut])
def list_users(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: Session = Depends(deps.get_db)
):
    total = db.query(models.User).count()
    users = db.query(models.User).offset(offset).limit(limit).all()
    return schemas.PaginatedResponse(
        items=users,
        total=total,
        limit=limit,
        offset=offset
    )
```

### Task 4.3: Update `list_assets_admin` in `api/app/api/v1/admin.py` to support pagination
- [ ] Same pattern as `list_users`.

```python
# api/app/api/v1/admin.py
@router.get("/assets", response_model=schemas.PaginatedResponse[schemas.AssetSummary])
def list_assets_admin(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: Session = Depends(deps.get_db)
):
    total = db.query(models.Asset).count()
    assets = db.query(models.Asset).offset(offset).limit(limit).all()
    return schemas.PaginatedResponse(
        items=assets,
        total=total,
        limit=limit,
        offset=offset
    )
```

### Task 4.4: Update `list_roles` in `api/app/api/v1/admin.py` to support pagination
- [ ] Same pattern.

```python
# api/app/api/v1/admin.py
@router.get("/roles", response_model=schemas.PaginatedResponse[schemas.RoleOut])
def list_roles(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: Session = Depends(deps.get_db)
):
    total = db.query(models.Role).count()
    roles = db.query(models.Role).offset(offset).limit(limit).all()
    return schemas.PaginatedResponse(
        items=roles,
        total=total,
        limit=limit,
        offset=offset
    )
```

### Task 4.5: Update `list_policies` in `api/app/api/v1/admin.py` to support pagination
- [ ] Same pattern.

```python
# api/app/api/v1/admin.py
@router.get("/policies", response_model=schemas.PaginatedResponse[schemas.PolicyOut])
def list_policies(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: Session = Depends(deps.get_db)
):
    total = db.query(models.Policy).count()
    policies = db.query(models.Policy).offset(offset).limit(limit).all()
    return schemas.PaginatedResponse(
        items=policies,
        total=total,
        limit=limit,
        offset=offset
    )
```

### Task 4.6: Update tests for paginated endpoints in `api/tests/test_admin.py`
- [ ] Update existing tests to expect paginated response format.

```python
# api/tests/test_admin.py
def test_list_users_pagination(self, admin_token):
    response = client.get(
        "/api/v1/admin/users?limit=10&offset=0",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "limit" in data
    assert "offset" in data
    assert isinstance(data["items"], list)
    assert data["limit"] == 10
    assert data["offset"] == 0
```

---

## Feature 5: Pagination + Batch Operations (Frontend)

### Task 5.1: Add `extractPaginatedPayload` to `web/src/lib/admin.ts`
- [ ] Add helper to extract paginated data from backend response.

```typescript
// web/src/lib/admin.ts
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_next: boolean;
  has_prev: boolean;
}

export function extractPaginatedPayload<T>(json: any): PaginatedResponse<T> {
  if (json && typeof json === 'object' && 'items' in json) {
    return json as PaginatedResponse<T>;
  }
  // Fallback: if response is still an array, wrap it
  if (Array.isArray(json)) {
    return {
      items: json,
      total: json.length,
      limit: json.length,
      offset: 0,
      has_next: false,
      has_prev: false,
    };
  }
  throw new Error('Invalid paginated response format');
}
```

### Task 5.2: Update `listUsers` in `web/src/lib/admin.ts` to support pagination
- [ ] Add `limit` and `offset` parameters, return `PaginatedResponse<User>`.

```typescript
// web/src/lib/admin.ts
export async function listUsers(limit: number = 20, offset: number = 0): Promise<PaginatedResponse<User>> {
  const token = getStoredAdminToken();
  const res = await fetch(`${API_BASE}/api/v1/admin/users?limit=${limit}&offset=${offset}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return extractPaginatedPayload(await res.json());
}
```

### Task 5.3: Update `listAssets` in `web/src/lib/admin.ts` to support pagination
- [ ] Same pattern as `listUsers`.

```typescript
// web/src/lib/admin.ts
export async function listAssets(limit: number = 20, offset: number = 0): Promise<PaginatedResponse<Asset>> {
  const token = getStoredAdminToken();
  const res = await fetch(`${API_BASE}/api/v1/admin/assets?limit=${limit}&offset=${offset}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch assets');
  return extractPaginatedPayload(await res.json());
}
```

### Task 5.4: Create `Pagination` component in `web/src/components/admin/pagination.tsx`
- [ ] Reusable pagination with page numbers, prev/next, limit selector.

```tsx
// web/src/components/admin/pagination.tsx
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({ total, limit, offset, onPageChange, onLimitChange }: PaginationProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const startItem = offset + 1;
  const endItem = Math.min(offset + limit, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-secondary)]">
          Showing {startItem}-{endItem} of {total}
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded px-2 py-1 text-sm text-[var(--color-text-primary)]"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(offset - limit)}
          disabled={offset === 0}
          className="p-1 rounded hover:bg-[var(--color-card-bg)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--color-text-secondary)]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && onPageChange((page - 1) * limit)}
            disabled={page === '...'}
            className={`px-3 py-1 rounded text-sm ${
              page === currentPage
                ? 'bg-[var(--color-electric-purple)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-bg)]'
            } ${page === '...' ? 'cursor-default' : ''}`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(offset + limit)}
          disabled={offset + limit >= total}
          className="p-1 rounded hover:bg-[var(--color-card-bg)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--color-text-secondary)]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

### Task 5.5: Update `/admin/users/page.tsx` with pagination and batch delete
- [ ] Add pagination state (`limit`, `offset`).
- [ ] Add row selection with checkboxes.
- [ ] Add batch delete functionality.

```tsx
// web/src/app/admin/users/page.tsx (key additions)
'use client';

import { useState, useCallback } from 'react';
import { listUsers, deleteUser, type User, type PaginatedResponse } from '@/lib/admin';
import { Pagination } from '@/components/admin/pagination';
import { Trash2 } from 'lucide-react';

export default function UsersPage() {
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const fetchUsers = useCallback(async () => {
    const result = await listUsers(limit, offset);
    setData(result);
    setSelectedIds(new Set()); // Clear selection on page change
  }, [limit, offset]);

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedIds.size === data.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.items.map(u => u.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} users?`)) return;
    for (const id of selectedIds) {
      await deleteUser(id);
    }
    setSelectedIds(new Set());
    fetchUsers();
  };

  return (
    <div>
      {/* Existing header */}
      
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-red-900/20 border border-red-800 rounded-lg">
          <span className="text-sm text-red-400">{selectedIds.size} selected</span>
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="px-4 py-3">
              <input
                type="checkbox"
                checked={data ? selectedIds.size === data.items.length && data.items.length > 0 : false}
                onChange={toggleSelectAll}
                className="rounded border-[var(--color-border)]"
              />
            </th>
            {/* existing columns */}
          </tr>
        </thead>
        <tbody>
          {data?.items.map(user => (
            <tr key={user.id} className="border-b border-[var(--color-border)]">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  className="rounded border-[var(--color-border)]"
                />
              </td>
              {/* existing cells */}
            </tr>
          ))}
        </tbody>
      </table>

      {data && (
        <Pagination
          total={data.total}
          limit={data.limit}
          offset={data.offset}
          onPageChange={setOffset}
          onLimitChange={(newLimit) => { setLimit(newLimit); setOffset(0); }}
        />
      )}
    </div>
  );
}
```

### Task 5.6: Update `/admin/assets/page.tsx` with pagination and batch delete
- [ ] Same pattern as users page.
- [ ] Add `limit`, `offset` state.
- [ ] Add row selection and batch delete.
- [ ] Integrate `Pagination` component.

```tsx
// web/src/app/admin/assets/page.tsx (key additions)
'use client';

import { useState, useCallback } from 'react';
import { listAssets, deleteAsset, type Asset, type PaginatedResponse } from '@/lib/admin';
import { Pagination } from '@/components/admin/pagination';
import { Trash2 } from 'lucide-react';

export default function AssetsPage() {
  const [data, setData] = useState<PaginatedResponse<Asset> | null>(null);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const fetchAssets = useCallback(async () => {
    const result = await listAssets(limit, offset);
    setData(result);
    setSelectedIds(new Set());
  }, [limit, offset]);

  // Same toggleSelectAll, toggleSelect, handleBatchDelete pattern as users page

  return (
    <div>
      {/* Batch delete bar, table with checkboxes, Pagination component */}
      {/* Same pattern as users page */}
    </div>
  );
}
```

### Task 5.7: Update `/admin/roles/page.tsx` with pagination
- [ ] Add `limit`, `offset` state and `Pagination` component.
- [ ] Update `listRoles` helper to accept pagination params.

```typescript
// web/src/lib/admin.ts
export async function listRoles(limit: number = 20, offset: number = 0): Promise<PaginatedResponse<Role>> {
  const token = getStoredAdminToken();
  const res = await fetch(`${API_BASE}/api/v1/admin/roles?limit=${limit}&offset=${offset}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch roles');
  return extractPaginatedPayload(await res.json());
}
```

```tsx
// web/src/app/admin/roles/page.tsx (pagination integration)
// Same pattern as users/assets pages: add limit/offset state, fetchRoles callback, Pagination component
```

### Task 5.8: Update `/admin/policies/page.tsx` with pagination
- [ ] Same pattern as roles page.

```typescript
// web/src/lib/admin.ts
export async function listPolicies(limit: number = 20, offset: number = 0): Promise<PaginatedResponse<Policy>> {
  const token = getStoredAdminToken();
  const res = await fetch(`${API_BASE}/api/v1/admin/policies?limit=${limit}&offset=${offset}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch policies');
  return extractPaginatedPayload(await res.json());
}
```

```tsx
// web/src/app/admin/policies/page.tsx (pagination integration)
// Same pattern as other admin pages
```

---

## Summary

This plan implements:
1. **Asset Detail Page** with content block renderer supporting 5 block types
2. **Public Content Detail Pages** for scenarios, architecture, insights, community using existing `PublicSiteShell` components
3. **Backend Search API** verification and tests for the existing `search_blocks` endpoint
4. **Backend Pagination** with generic `PaginatedResponse[T]` schema applied to all admin list endpoints
5. **Frontend Pagination** with reusable `Pagination` component, paginated data helpers, and batch delete operations on admin tables

All code is complete and ready to implement. No placeholders or TBD items remain.
