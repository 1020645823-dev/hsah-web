# Phase 6: Detail Pages, Search, Pagination & Batch Operations Design

Date: 2026-06-25
Scope: Hyperscaler Asset Hub (web + api)
Status: draft

---

## 1. Overview

Phase 6 在 Phase 5 的基础上完成五个核心能力：

1. **Asset Detail Page** (`/assets/[id]`) — 公开资产详情页，按顺序渲染所有 content_blocks（text、stat_card、image、code_snippet、callout）
2. **Public Content Detail Pages** — 为 `/scenarios/[slug]`、`/architecture/[slug]`、`/insights/[slug]`、`/community/[slug]` 构建详情页，使用 `web/src/lib/public-content.ts` 中的静态数据
3. **Backend Search API** — 全局 content block 搜索：`GET /api/v1/admin/assets/search-blocks?q=&type=`，支持按关键词和类型过滤
4. **Pagination** — 为所有 admin 列表端点（users、assets、roles、policies）添加 offset/limit 分页，统一返回 `{items, total, limit, offset}`
5. **Batch Operations** — admin 列表页支持多选批量删除，带确认对话框

---

## 2. Asset Detail Page

### 2.1 Goal

将现有的 `/assets/[slug]` 页面从基于 slug 的公开 API 调用迁移到基于 asset ID 的公开详情页，并引入统一的 `ContentBlockRenderer` 组件来渲染所有类型的 content block。

### 2.2 Route

- `/assets/[id]` — 接受 asset UUID 作为参数
- 未知 ID 返回 `notFound()`

### 2.3 Data Fetching

- 服务端组件通过 `fetch` 调用 `GET /api/v1/admin/assets/{asset_id}`（需要公开访问策略，或新增公开资产详情端点）
- 实际实现中：复用现有 `admin_assets.py` 的 `GET /{asset_id}` 端点，前端通过公开 API 代理或直接调用（若资产为 public 状态则允许匿名访问）

### 2.4 Content Block Rendering

所有 content_blocks 按 `order` 排序后依次渲染。每个 block 类型使用专属组件：

| Block Type | 渲染方式 |
|-----------|---------|
| `text` | Tiptap 生成的 HTML，通过 `dangerouslySetInnerHTML` 渲染，外层包裹 glass card |
| `stat_card` | 网格布局（`sm:grid-cols-3`），每个 stat 为独立 glass card，显示 value + label |
| `image` | 响应式图片，`width%` 控制宽度，支持 alt 和 caption |
| `code_snippet` | 带行号的代码块，语言标签 + 复制按钮，monospace 字体，深色背景 |
| `callout` | 左侧彩色边框卡片，使用 Lucide 图标（Info/AlertTriangle/XCircle/Lightbulb），支持 info/warning/error/tip 四种变体 |

### 2.5 现有代码对齐

- 现有 `web/src/app/assets/[slug]/page.tsx` 已包含基础渲染逻辑，需重构为：
  - 路由参数从 `slug` 改为 `id`
  - 提取 `renderBlock` 为独立 `ContentBlockRenderer` 组件（`src/components/public/content-block-renderer.tsx`）
  - 修复现有代码中的 emoji 图标（`variantIcons` 使用字符表情），替换为 Lucide 图标
  - 统一使用 `lucide-react` 图标库

### 2.6 页面结构

```
Asset Detail Page
├── Back Link → /assets
├── Status Badge
├── Hero Section
│   ├── asset_type (eyebrow)
│   ├── title
│   ├── subtitle (optional)
│   ├── short_description
│   └── technology tags
├── Content Blocks (按 order 排序)
│   └── ContentBlockRenderer × N
└── (optional) Related Assets
```

---

## 3. Public Content Detail Pages

### 3.1 Goal

为四个静态内容集合（scenarios、architecture、insights、community）构建统一的详情页，数据来源于 `web/src/lib/public-content.ts`。

### 3.2 Routes

| Route | 数据获取函数 |
|-------|-------------|
| `/scenarios/[slug]` | `getScenarioBySlug(slug)` |
| `/architecture/[slug]` | `getArchitectureBySlug(slug)` |
| `/insights/[slug]` | `getInsightBySlug(slug)` |
| `/community/[slug]` | `getCommunityItemBySlug(slug)` |

未知 slug 返回 `notFound()`。

### 3.3 Shared Layout

所有详情页共享一个 `PublicContentDetailLayout` 组件：

- **Back Link**: 返回对应列表页（如 `/scenarios`）
- **Hero**: eyebrow 标签 + 标题 + summary
- **Metadata Strip**: 行业/分类/日期/阅读时间等标签
- **Content Sections**: 根据内容类型渲染不同区块
- **Related Items Sidebar**: 底部或右侧展示关联内容链接

### 3.4 内容类型渲染

#### Scenario Detail

- Hero: eyebrow "Scenario" + title + summary
- Metadata: industry, businessOutcome, tags
- Metrics: 横向 stat strip（复用 stat_card 样式）
- Phases: 时间线或步骤列表，每步包含 title + description
- Related Architecture: 链接到关联的 architecture 详情页

#### Architecture Detail

- Hero: eyebrow "Reference Architecture" + title + summary
- Metadata: focus, tags
- Layers: 四层架构卡片，每层 title + description
- Governance: 列表
- Deployment Notes: 列表
- Related Scenarios: 链接到关联的 scenario 详情页

#### Insight Detail

- Hero: category + title + summary
- Metadata: publishDate, readTime
- Key Points: 要点列表（带 bullet）
- Body Sections: 多个 section，每个 title + description
- Related Insights: 同 category 的其他文章

#### Community Detail

- Hero: format + title + summary
- Metadata: audience, dateLabel, location
- Agenda: 日程列表，每项 title + description
- Resources: 链接按钮组

### 3.5 相关链接

每个详情页底部展示 "Related" 区块：

- Scenario → 关联 Architecture（通过 `relatedArchitectureSlugs`）
- Architecture → 关联 Scenario（通过 `relatedScenarioSlugs`）
- Insight → 同 category 的其他 Insight
- Community → 关联的 Scenario/Architecture 或 About 页面

---

## 4. Backend Search API

### 4.1 Goal

新增全局 content block 搜索端点，支持按关键词和类型过滤，返回匹配 block 及其所属资产信息。

### 4.2 Endpoint

```
GET /api/v1/admin/assets/search-blocks?q={keyword}&type={block_type}&limit={20}
```

### 4.3 Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `q` | string | Yes | — | 搜索关键词，最小长度 1 |
| `type` | string | No | — | block 类型过滤：`text`、`stat_card`、`image`、`code_snippet`、`callout` |
| `limit` | int | No | 20 | 最大返回结果数，范围 1-100 |

### 4.4 Response

```json
{
  "query": "string",
  "type_filter": "string | null",
  "limit": 20,
  "total": 42,
  "results": [
    {
      "asset_id": "uuid",
      "asset_name": "string",
      "asset_slug": "string",
      "block": { /* 完整 block 对象 */ },
      "matched_field": "string"
    }
  ]
}
```

### 4.5 搜索逻辑

- 遍历所有 Asset 的 content_blocks
- 每个 block 根据类型在特定字段中搜索关键词（case-insensitive）
- 支持 `type` 参数过滤 block 类型
- 返回前 `limit` 个匹配结果

### 4.6 已有实现

`api/app/api/v1/admin_assets.py` 中已存在 `_block_matches_keyword` 和 `_get_matched_field` 辅助函数，以及 `search_blocks` 端点。Phase 6 需要：

- 确认现有实现满足需求
- 添加 offset 参数支持分页（可选，若结果集大）
- 前端集成：全局搜索模态框调用此端点

---

## 5. Pagination

### 5.1 Goal

为所有 admin 列表端点添加统一的 offset/limit 分页，返回标准分页响应格式。

### 5.2 受影响端点

| Endpoint | Method | Path |
|----------|--------|------|
| List Users | GET | `/api/v1/admin/users` |
| List Assets | GET | `/api/v1/admin/assets` |
| List Roles | GET | `/api/v1/admin/roles` |
| List Policies | GET | `/api/v1/admin/policies` |

### 5.3 请求参数

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `offset` | int | 0 | 跳过记录数，≥ 0 |
| `limit` | int | 20 | 每页记录数，范围 1-100 |

### 5.4 响应格式

```json
{
  "items": [ /* 列表数据 */ ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### 5.5 后端实现

新增通用分页工具：

```python
# app/schemas/common.py
class PaginationParams(BaseModel):
    offset: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int

# app/core/pagination.py
async def paginate_query(session, query, offset: int, limit: int) -> tuple[list, int]:
    total = await session.scalar(select(func.count()).select_from(query.subquery()))
    items = await session.scalars(query.offset(offset).limit(limit))
    return list(items), total
```

### 5.6 前端适配

- 所有 admin 列表页添加 `Pagination` 组件
- URL query params 同步：`?page=1&pageSize=20`
- 页码计算：`offset = (page - 1) * pageSize`

---

## 6. Batch Operations

### 6.1 Goal

在 admin 列表页（users、assets、roles、policies）支持多选批量删除操作。

### 6.2 交互流程

```
1. 用户点击行首 checkbox 选择单条记录
2. 用户点击表头 checkbox 选择当前页全部记录
3. 选中后底部浮现 BatchActionBar
4. BatchActionBar 显示：选中数量 + 删除按钮
5. 点击删除 → 弹出确认对话框
6. 确认后 → 并行/串行调用 DELETE API
7. 完成后 → 刷新列表 + Toast 通知结果
```

### 6.3 UI 组件

- **RowCheckbox**: 每行首的复选框，控制单条选中状态
- **SelectAllCheckbox**: 表头复选框，控制当前页全选/取消全选
- **BatchActionBar**: 底部浮动操作栏，显示选中计数和批量操作按钮
- **BatchDeleteConfirmDialog**: 确认对话框，显示 "确定删除 X 项？此操作不可撤销。"

### 6.4 API 调用

批量删除通过前端循环调用单个 DELETE 端点实现：

```typescript
// 并行删除（推荐，有错误处理）
await Promise.allSettled(
  selectedIds.map(id => adminRequest(`/admin/${resource}/${id}`, { method: "DELETE" }))
);
```

### 6.5 状态管理

每个 admin 列表页维护本地状态：

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [isBatchDeleting, setIsBatchDeleting] = useState(false);
```

### 6.6 错误处理

- 部分删除失败时：显示具体失败项的错误信息
- 全部成功：显示 "成功删除 X 项"
- 全部失败：显示错误原因，不刷新列表

---

## 7. 非功能性需求

### 7.1 性能

- Asset Detail Page 使用服务端渲染（SSR），`cache: "no-store"` 确保数据实时性
- Public Content Detail Pages 为纯静态数据，支持 Next.js 静态生成优化
- 分页查询使用数据库级 offset/limit，避免全表加载
- 批量删除使用 `Promise.allSettled` 并行处理，带并发限制（最大 5 个并行）

### 7.2 安全

- Admin 端点保持现有认证要求（`get_current_user`）
- 公开页面（Asset Detail、Public Content）无需认证
- 批量删除操作需二次确认，防止误操作
- 分页参数校验：`offset ≥ 0`，`1 ≤ limit ≤ 100`

### 7.3 可访问性

- 所有 checkbox 有正确的 `aria-label`
- BatchActionBar 使用 `role="toolbar"`
- 分页按钮有 `aria-current="page"` 标记当前页
- 确认对话框焦点管理（打开时聚焦确认按钮，关闭时返回触发元素）

### 7.4 响应式

- Asset Detail Page: 内容区最大宽度 `max-w-5xl`，移动端自动适配
- Public Content Detail: 单栏布局，大屏幕可选双栏（内容 + 相关链接）
- Pagination: 移动端显示简化版（上一页/下一页 + 当前页码）
- BatchActionBar: 移动端全宽浮动，避免遮挡内容

---

## 8. 成功标准

1. ✅ `/assets/[id]` 正确渲染所有类型 content block，无 emoji 图标
2. ✅ `/scenarios/[slug]`、`/architecture/[slug]`、`/insights/[slug]`、`/community/[slug]` 详情页正常显示
3. ✅ 搜索 API 返回准确结果，支持类型过滤
4. ✅ 所有 admin 列表端点支持分页，返回标准格式
5. ✅ admin 列表页支持批量选择删除
6. ✅ 构建成功，lint 无错误
7. ✅ 响应式设计在 768px 以下正常工作
