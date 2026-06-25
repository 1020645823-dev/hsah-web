# Phase 6: Detail Pages, Search, Pagination & Batch Operations Architecture

Date: 2026-06-25
Scope: Hyperscaler Asset Hub (web + api)
Status: draft

---

## 1. Overview

本文档定义 Phase 6 五个功能的技术架构：Asset Detail Page、Public Content Detail Pages、Backend Search API、Pagination、Batch Operations。涵盖后端 schema、API 变更、前端组件架构、数据流和模块依赖关系。

---

## 2. Backend Architecture

### 2.1 新增/修改文件

```
api/
├── app/
│   ├── schemas/
│   │   ├── common.py          # 新增: PaginationParams, PaginatedResponse
│   │   └── asset.py           # 修改: 确认 AssetDetail 包含 content_blocks
│   ├── core/
│   │   └── pagination.py      # 新增: paginate_query 通用分页 helper
│   ├── api/v1/
│   │   ├── admin.py           # 修改: 所有 list 端点添加 offset/limit
│   │   └── admin_assets.py    # 修改: search-blocks 添加 offset 参数（可选）
│   └── models/
│       └── asset.py           # 不变: 已有 content_blocks JSON 字段
```

### 2.2 Pagination Schema

```python
# app/schemas/common.py
from typing import Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class PaginationParams(BaseModel):
    offset: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
```

### 2.3 Paginate Query Helper

```python
# app/core/pagination.py
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import Select

async def paginate_query(
    session: Session,
    stmt: Select,
    offset: int,
    limit: int,
) -> tuple[list, int]:
    """Execute paginated query and return (items, total_count)."""
    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = session.scalar(count_stmt) or 0
    
    # Fetch page
    items = list(session.scalars(stmt.offset(offset).limit(limit)).all())
    return items, total
```

### 2.4 Admin List Endpoints 变更

所有 list 端点从返回 `list[T]` 改为返回 `PaginatedResponse[T]`：

#### Users (`GET /admin/users`)

```python
from app.schemas.common import PaginationParams, PaginatedResponse
from app.core.pagination import paginate_query

@router.get("/users", response_model=PaginatedResponse[UserSummary])
def list_users(
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[UserSummary]:
    stmt = select(User).order_by(User.created_at.desc())
    rows, total = paginate_query(db, stmt, params.offset, params.limit)
    items = [
        UserSummary(
            id=str(u.id),
            email=u.email,
            is_active=u.is_active,
            two_factor_enabled=u.two_factor_enabled,
        )
        for u in rows
    ]
    return PaginatedResponse(
        items=items, total=total, limit=params.limit, offset=params.offset
    )
```

#### Assets (`GET /admin/assets`)

```python
@router.get("/assets", response_model=PaginatedResponse[AssetSummary])
def list_assets_admin(
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[AssetSummary]:
    stmt = select(Asset).order_by(Asset.created_at.desc())
    rows, total = paginate_query(db, stmt, params.offset, params.limit)
    items = [
        AssetSummary(
            id=str(a.id),
            slug=a.slug,
            title=a.title,
            subtitle=a.subtitle,
            short_description=a.short_description,
            cloud_providers=a.cloud_providers,
            industries=a.industries,
            technologies=a.technologies,
            asset_type=a.asset_type,
            status=a.status,
        )
        for a in rows
    ]
    return PaginatedResponse(
        items=items, total=total, limit=params.limit, offset=params.offset
    )
```

#### Roles (`GET /admin/roles`)

```python
@router.get("/roles", response_model=PaginatedResponse[RoleResponse])
def list_roles(
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[RoleResponse]:
    stmt = select(Role).options(selectinload(Role.users)).order_by(Role.created_at.desc())
    rows, total = paginate_query(db, stmt, params.offset, params.limit)
    return PaginatedResponse(
        items=[_serialize_role(role) for role in rows],
        total=total,
        limit=params.limit,
        offset=params.offset,
    )
```

#### Policies (`GET /admin/policies`)

```python
@router.get("/policies", response_model=PaginatedResponse[PolicyResponse])
def list_policies(
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> PaginatedResponse[PolicyResponse]:
    stmt = select(AccessPolicy).order_by(AccessPolicy.created_at.desc())
    rows, total = paginate_query(db, stmt, params.offset, params.limit)
    return PaginatedResponse(
        items=[_serialize_policy(policy) for policy in rows],
        total=total,
        limit=params.limit,
        offset=params.offset,
    )
```

### 2.5 Search API 架构

现有 `admin_assets.py` 中的 `search_blocks` 端点已满足基本需求。Phase 6 可选增强：

```python
@router.get("/search-blocks")
async def search_blocks(
    q: str = Query(..., min_length=1),
    type: Optional[str] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Search across all assets' content_blocks with pagination."""
```

### 2.6 数据模型关系

```
┌─────────────┐         ┌─────────────────┐
│   User      │         │     Asset       │
├─────────────┤         ├─────────────────┤
│ id (PK)     │         │ id (PK)         │
│ email       │         │ slug            │
│ ...         │         │ title           │
└─────────────┘         │ content_blocks  │ ← JSON array
                        │   [block1,      │
                        │    block2, ...] │
                        └─────────────────┘
                                  │
                        ┌─────────┴─────────┐
                        │   ContentBlock    │
                        │   (JSON schema)   │
                        ├───────────────────┤
                        │ id, type, order   │
                        │ visible, config   │
                        └───────────────────┘
```

---

## 3. Frontend Architecture

### 3.1 新增/修改文件

```
web/src/
├── app/
│   ├── assets/
│   │   └── [id]/
│   │       └── page.tsx              # 修改: 路由改为 [id], 使用 ContentBlockRenderer
│   ├── scenarios/
│   │   └── [slug]/
│   │       └── page.tsx              # 新增
│   ├── architecture/
│   │   └── [slug]/
│   │       └── page.tsx              # 新增
│   ├── insights/
│   │   └── [slug]/
│   │       └── page.tsx              # 新增
│   ├── community/
│   │   └── [slug]/
│   │       └── page.tsx              # 新增
│   └── admin/
│       ├── users/
│       │   └── page.tsx              # 修改: 添加分页 + 批量操作
│       ├── assets/
│       │   └── page.tsx              # 修改: 添加分页 + 批量操作
│       ├── roles/
│       │   └── page.tsx              # 修改: 添加分页 + 批量操作
│       └── policies/
│           └── page.tsx              # 修改: 添加分页 + 批量操作
├── components/
│   ├── public/
│   │   ├── content-block-renderer.tsx    # 新增: 统一 content block 渲染
│   │   ├── public-content-layout.tsx     # 新增: 公开内容详情页共享布局
│   │   └── related-links.tsx             # 新增: 相关链接组件
│   ├── admin/
│   │   ├── pagination.tsx                # 新增: 分页组件
│   │   ├── batch-action-bar.tsx          # 新增: 批量操作栏
│   │   └── batch-delete-dialog.tsx       # 新增: 批量删除确认对话框
│   └── ui/                               # shadcn 组件已有
├── lib/
│   └── admin.ts                          # 修改: 添加分页参数支持
└── hooks/
    └── use-batch-selection.ts            # 新增: 批量选择逻辑 hook
```

### 3.2 ContentBlockRenderer 组件

```typescript
// components/public/content-block-renderer.tsx
"use client";

import { Info, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import type { ContentBlock } from "@/lib/admin-content-blocks";

const calloutIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  tip: Lightbulb,
} as const;

const calloutStyles = {
  info: "border-l-blue-500 bg-blue-500/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  error: "border-l-red-500 bg-red-500/5",
  tip: "border-l-green-500 bg-green-500/5",
} as const;

interface ContentBlockRendererProps {
  block: ContentBlock;
}

export function ContentBlockRenderer({ block }: ContentBlockRendererProps) {
  if (!block.visible) return null;
  
  switch (block.type) {
    case "text": return <TextBlock block={block} />;
    case "stat_card": return <StatCardBlock block={block} />;
    case "image": return <ImageBlock block={block} />;
    case "code_snippet": return <CodeSnippetBlock block={block} />;
    case "callout": return <CalloutBlock block={block} />;
    default: return null;
  }
}

// 各子组件实现略...
```

### 3.3 PublicContentDetailPage 组件

```typescript
// 伪代码展示组件结构
interface PublicContentDetailPageProps {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  summary: string;
  metadata: React.ReactNode;
  content: React.ReactNode;
  relatedItems: { label: string; href: string }[];
}

export function PublicContentDetailPage({ ... }) {
  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-5xl space-y-10">
        <BackLink href={backHref}>{backLabel}</BackLink>
        <Hero eyebrow={eyebrow} title={title} summary={summary} />
        <MetadataStrip>{metadata}</MetadataStrip>
        <ContentSections>{content}</ContentSections>
        <RelatedLinks items={relatedItems} />
      </div>
    </div>
  );
}
```

### 3.4 Pagination 组件

```typescript
// components/admin/pagination.tsx
interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (limit: number) => void;
}

// 功能：
// - 上一页/下一页按钮
// - 页码数字（最多显示 5 个页码 + 首尾）
// - 当前页高亮
// - 每页条数选择器（10/20/50）
// - 总记录数显示
// - 移动端简化视图
```

### 3.5 BatchActionBar 组件

```typescript
// components/admin/batch-action-bar.tsx
interface BatchActionBarProps {
  selectedCount: number;
  totalCount: number;
  onDelete: () => void;
  onClear: () => void;
  isDeleting: boolean;
}

// 功能：
// - 固定在列表底部或顶部
// - 显示 "已选择 X 项"
// - 删除按钮（红色）
// - 清除选择按钮
// - 删除时显示 loading spinner
```

### 3.6 useBatchSelection Hook

```typescript
// hooks/use-batch-selection.ts
export function useBatchSelection(itemIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const toggle = (id: string) => { /* ... */ };
  const toggleAll = () => { /* ... */ };
  const clear = () => setSelectedIds(new Set());
  const isSelected = (id: string) => selectedIds.has(id);
  const isAllSelected = selectedIds.size === itemIds.length && itemIds.length > 0;
  
  return { selectedIds, toggle, toggleAll, clear, isSelected, isAllSelected };
}
```

---

## 4. Data Flow

### 4.1 Asset Detail Page Data Flow

```
User navigates to /assets/{id}
        │
        ▼
┌─────────────────────┐
│  Next.js Server     │
│  (async page.tsx)   │
└─────────────────────┘
        │
        ▼ fetchAsset(id)
┌─────────────────────┐
│  GET /admin/assets/ │
│  {asset_id}         │
│  (FastAPI)          │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  AssetDetail        │
│  (JSON response)    │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Sort blocks by     │
│  order              │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  ContentBlockRenderer│
│  × N (per block)    │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  HTML Output        │
│  (SSR rendered)     │
└─────────────────────┘
```

### 4.2 Public Content Detail Data Flow

```
User navigates to /scenarios/{slug}
        │
        ▼
┌─────────────────────┐
│  Next.js Server     │
│  (async page.tsx)    │
└─────────────────────┘
        │
        ▼ getScenarioBySlug(slug)
┌─────────────────────┐
│  Static TypeScript  │
│  Data (in-memory)   │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  notFound() if null │
│  else render page   │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  PublicContentDetail│
│  Layout             │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Related Links      │
│  (resolve by slug)  │
└─────────────────────┘
```

### 4.3 Search API Data Flow

```
User opens Global Search Modal
        │
        ▼ types keyword
┌─────────────────────┐
│  Debounced Input    │
│  (300ms)            │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  GET /admin/assets/ │
│  search-blocks?q=...│
│  &type=...          │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Backend iterates   │
│  all assets' blocks │
│  and filters        │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  SearchResults      │
│  (grouped by asset) │
└─────────────────────┘
```

### 4.4 Pagination Data Flow

```
Admin List Page (users/assets/roles/policies)
        │
        ▼
┌─────────────────────┐
│  URL: ?page=1&      │
│  pageSize=20        │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Compute:           │
│  offset=(page-1)*  │
│  pageSize           │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  GET /admin/{res}?  │
│  offset=0&limit=20  │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  PaginatedResponse  │
│  {items,total,      │
│  limit,offset}      │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Render Table +     │
│  Pagination         │
└─────────────────────┘
```

### 4.5 Batch Operations Data Flow

```
Admin List Page
        │
        ▼ user checks rows
┌─────────────────────┐
│  selectedIds: Set   │
│  (useBatchSelection)│
└─────────────────────┘
        │
        ▼ clicks Delete
┌─────────────────────┐
│  Confirm Dialog     │
│  opens              │
└─────────────────────┘
        │
        ▼ confirms
┌─────────────────────┐
│  Promise.allSettled │
│  DELETE × N         │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Refresh list       │
│  (re-fetch current  │
│  page)              │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Toast notification │
│  (success/partial/   │
│  fail)              │
└─────────────────────┘
```

---

## 5. API Changes Summary

### 5.1 响应格式变更（Breaking Change）

所有 admin list 端点从 `list[T]` 变为 `PaginatedResponse[T]`：

| Endpoint | Before | After |
|----------|--------|-------|
| `GET /admin/users` | `UserSummary[]` | `{items,total,limit,offset}` |
| `GET /admin/assets` | `AssetSummary[]` | `{items,total,limit,offset}` |
| `GET /admin/roles` | `RoleResponse[]` | `{items,total,limit,offset}` |
| `GET /admin/policies` | `PolicyResponse[]` | `{items,total,limit,offset}` |

### 5.2 新增查询参数

所有上述端点新增：

- `offset` (int, default=0, ≥0)
- `limit` (int, default=20, 1-100)

### 5.3 Search 端点增强（可选）

`GET /admin/assets/search-blocks` 可选新增：

- `offset` (int, default=0)

---

## 6. 模块依赖图

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (web)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ AssetDetail  │  │ PublicContent│  │ Admin List Pages │  │
│  │ Page         │  │ Detail Pages │  │ (×4)             │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │            │
│         ▼                 ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ContentBlockRenderer                         │  │
│  │  (text | stat_card | image | code_snippet | callout) │  │
│  └──────────────────────────────────────────────────────┘  │
│         ▲                          ▲                        │
│         │                          │                        │
│  ┌──────┴──────┐            ┌──────┴──────┐                │
│  │ Pagination  │            │ BatchAction │                │
│  │ Component   │            │ Bar + Dialog│                │
│  └─────────────┘            └─────────────┘                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  useBatchSelection Hook  │  adminRequest (lib)     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend (api)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FastAPI Routers                                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│  │
│  │  │ /admin   │ │ /admin   │ │ /admin   │ │ /admin   ││  │
│  │  │ /users   │ │ /assets  │ │ /roles   │ │ /policies││  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘│  │
│  └───────┼────────────┼────────────┼────────────┼──────┘  │
│          │            │            │            │          │
│          ▼            ▼            ▼            ▼              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PaginationParams (schema)  │  paginate_query (core)│  │
│  └──────────────────────────────────────────────────────┘  │
│          ▲            ▲            ▲            ▲            │
│          │            │            │            │            │
│  ┌───────┴────────────┴────────────┴────────────┴──────┐  │
│  │              SQLAlchemy + PostgreSQL                    │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 技术决策

### 7.1 分页策略

- **选择 offset/limit 而非 cursor**：admin 列表数据量可控（通常 < 10k），offset/limit 实现简单，支持跳页
- **默认值**：offset=0, limit=20，兼顾性能与可用性
- **最大限制**：limit ≤ 100，防止过大请求

### 7.2 批量删除策略

- **前端串行/并行调用**：不新增批量删除后端端点，复用现有单条 DELETE
- **并发控制**：使用 `Promise.allSettled` 并限制最大并行数（5）
- **错误处理**：部分失败时显示具体失败项，成功项从列表移除

### 7.3 Content Block 渲染策略

- **服务端渲染**：Asset Detail Page 使用 Next.js async server component，SEO 友好
- **组件拆分**：每个 block 类型独立子组件，便于维护和扩展
- **图标统一**：全部使用 `lucide-react`，禁止 emoji

### 7.4 静态数据策略

- Public Content Detail Pages 使用 TypeScript 静态数据，无需后端 API
- 支持 Next.js 静态生成（SSG），构建时预渲染所有已知 slug 的页面
- 未知 slug 运行时返回 `notFound()`

---

## 8. 接口契约

### 8.1 Frontend → Backend (Pagination)

```
GET /api/v1/admin/users?offset=0&limit=20

Response:
{
  "items": [...],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### 8.2 Frontend → Backend (Search)

```
GET /api/v1/admin/assets/search-blocks?q=cloud&type=text&limit=20

Response:
{
  "query": "cloud",
  "type_filter": "text",
  "limit": 20,
  "total": 5,
  "results": [
    {
      "asset_id": "uuid",
      "asset_name": "Asset Title",
      "asset_slug": "asset-slug",
      "block": { ... },
      "matched_field": "text"
    }
  ]
}
```

### 8.3 Frontend → Backend (Batch Delete)

```
DELETE /api/v1/admin/users/{user_id}
DELETE /api/v1/admin/assets/{asset_id}
DELETE /api/v1/admin/roles/{role_id}
DELETE /api/v1/admin/policies/{policy_id}

// 前端循环调用，每次一个 ID
```

---

## 9. 测试策略

### 9.1 后端测试

- `test_pagination.py` — 测试 `paginate_query` helper 的正确性
- 更新 `test_admin.py` — 测试所有 list 端点返回 PaginatedResponse
- 更新 `test_admin_assets.py` — 测试 search-blocks 端点

### 9.2 前端测试

- `content-block-renderer.test.tsx` — 测试各 block 类型渲染
- `pagination.test.tsx` — 测试页码计算、交互
- `use-batch-selection.test.ts` — 测试选择逻辑
- 更新 admin page tests — 测试分页和批量操作集成

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 分页响应格式变更破坏现有前端 | 高 | 同步更新所有 admin 列表页，确保前后端一起部署 |
| 批量删除部分失败导致数据不一致 | 中 | 使用 `Promise.allSettled`，失败项显示错误，不刷新列表 |
| Asset Detail 路由从 slug 改为 id | 中 | 更新所有内部链接，添加旧 slug 重定向（可选） |
| 搜索遍历所有 asset 性能差 | 中 | 限制 limit ≤ 100，数据量大时考虑添加数据库索引或专用搜索表 |
| 静态数据页面构建体积增大 | 低 | 静态数据量小（< 50KB），影响可忽略 |
