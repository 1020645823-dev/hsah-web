# Phase 6: Detail Pages, Search, Pagination & Batch Operations UI/UX

Date: 2026-06-25
Scope: Hyperscaler Asset Hub (web)
Status: draft

---

## 1. Design Token Reference

所有 UI 实现必须严格使用以下设计 token，禁止硬编码颜色值。

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-void-black` | `#0a0a0f` | 页面背景 |
| `--color-surface-dark` | `#12121a` | 卡片背景 |
| `--color-surface-mid` | `#1e1e2e` |  elevated 表面 |
| `--color-border-subtle` | `#2a2a3c` | 边框 |
| `--color-text-primary` | `#f0f0f5` | 主标题、正文 |
| `--color-text-secondary` | `#8b8ba3` | 副标题、描述 |
| `--color-text-tertiary` | `#5a5a72` | 辅助文字、禁用状态 |
| `--color-electric-purple` | `#7b3ff2` | 主强调色、链接、eyebrow |
| `--color-periwinkle` | `#d4daf5` | 标签、浅色强调 |
| `--color-deep-indigo` | `#1c1967` | 深色渐变起点 |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `font-sans` | system sans | 正文、UI 元素 |
| `font-mono` | system mono | 代码块 |
| `text-xs` | 0.75rem | 标签、元数据 |
| `text-sm` | 0.875rem | 正文、描述 |
| `text-base` | 1rem | 标准正文 |
| `text-lg` | 1.125rem | 副标题 |
| `text-xl` | 1.25rem | 小标题 |
| `text-3xl` | 1.875rem | 区块标题 |
| `text-4xl` | 2.25rem | 页面主标题 |

### Spacing & Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | 1.25rem | 全局圆角基准 |
| `rounded-2xl` | 1.25rem | 卡片圆角 |
| `rounded-full` | 9999px | 标签、按钮 |
| `px-6` | 1.5rem | 页面水平内边距 |
| `py-12` | 3rem | 页面垂直内边距 |
| `max-w-5xl` | 64rem | 内容最大宽度 |

### Glass Surface

```css
.glass-card {
  background: rgb(18 18 26 / 70%);
  border: 1px solid rgb(212 218 245 / 12%);
  backdrop-filter: blur(24px) saturate(180%);
  border-radius: 1.25rem;
}
```

---

## 2. Asset Detail Page Layout

### 2.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Asset Library          STATUS: PUBLISHED        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ASSET TYPE (eyebrow, electric-purple, tracking-wide)       │
│                                                             │
│  Asset Title (text-4xl, font-semibold, text-primary)       │
│                                                             │
│  Subtitle (text-lg, text-secondary)                         │
│                                                             │
│  Short description paragraph (text-base, leading-7,           │
│  text-secondary, max-w-3xl)                                  │
│                                                             │
│  [Tag1] [Tag2] [Tag3] ... (rounded-full badges)            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Content Block 1 (text)                              │   │
│  │  ─────────────────────────────────────────────────   │   │
│  │  Rich text content rendered from Tiptap HTML...      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Stat 1   │ │ Stat 2   │ │ Stat 3   │  (stat_card)      │
│  │ 3.2x     │ │ -28%     │ │ +17 pts  │                   │
│  │ Label    │ │ Label    │ │ Label    │                   │
│  └──────────┘ └──────────┘ └──────────┘                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Image with caption]                                │   │
│  │  (responsive, width controlled by config)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  language | 42 lines                                 │   │
│  │  ─────────────────────────────────────────────────   │   │
│  │  1  const foo = "bar";                               │   │
│  │  2  console.log(foo);                               │   │
│  │  ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⚠ Warning title                                     │   │
│  │  Warning message content...                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Hero Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SOLUTION (eyebrow)                                         │
│                                                             │
│  Intelligent Customer Operations                            │
│  (text-4xl, font-semibold, color-text-primary)              │
│                                                             │
│  Reduce handling time while raising first-contact           │
│  resolution across digital and voice channels.              │
│  (text-lg, color-text-secondary)                            │
│                                                             │
│  A comprehensive solution for telecom operators...        │
│  (text-base, leading-7, color-text-secondary, max-w-3xl)    │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Contact  │ │ Agent    │ │ Knowledge│  (technology tags)  │
│  │ Center   │ │ Assist   │ │ Grounding│                   │
│  └──────────┘ └──────────┘ └──────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Eyebrow**: `text-xs tracking-[0.18em] text-[var(--color-electric-purple)] uppercase`

**Title**: `text-4xl font-semibold text-[var(--color-text-primary)]`

**Subtitle**: `text-lg text-[var(--color-text-secondary)]`

**Description**: `text-base leading-7 text-[var(--color-text-secondary)] max-w-3xl`

**Tags**: `rounded-full border border-[rgb(123_63_242_/35%)] bg-[rgb(123_63_242_/12%)] px-2.5 py-1 text-xs text-[var(--color-periwinkle)]`

### 2.3 Back Link

```
← Back to Asset Library
```

- 位置：页面左上角，与 status badge 同行
- 样式：`text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]`
- 交互：hover 时颜色变亮，transition 150ms

### 2.4 Status Badge

```
PUBLISHED
```

- 位置：页面右上角，与 back link 同行
- 样式：`text-xs tracking-[0.12em] text-[var(--color-text-tertiary)] uppercase`

---

## 3. Content Block Rendering

### 3.1 Text Block

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Rich text content rendered from Tiptap HTML.              │
│                                                             │
│  Supports paragraphs, lists, bold, italic, and links.      │
│                                                             │
│  • Bullet point one                                        │
│  • Bullet point two                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **容器**: `rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/60%)] p-6`
- **内容**: `text-sm leading-7 text-[var(--color-text-secondary)]`
- **HTML 渲染**: 使用 `dangerouslySetInnerHTML`，需确保后端已做 HTML 净化
- **Fallback**: 若 html 为空，显示 markdown 纯文本

### 3.2 Stat Card Block

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  3.2x    │  │  -28%    │  │ +17 pts  │
│          │  │          │  │          │
│  Label   │  │  Label   │  │  Label   │
└──────────┘  └──────────┘  └──────────┘
```

- **布局**: `grid gap-4 sm:grid-cols-3`
- **卡片**: `rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] p-5 shadow-[var(--shadow-card)] backdrop-blur-[24px]`
- **Value**: `text-3xl font-semibold text-[var(--color-text-primary)]`
- **Label**: `mt-2 text-sm text-[var(--color-text-secondary)]`
- **Hover**: `shadow-[var(--shadow-card-hover)]` (transition 300ms)

### 3.3 Image Block

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              [Responsive Image]                              │
│                                                             │
│              Image caption text                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **容器**: `figure` 元素，宽度由 `config.width` 控制（百分比）
- **图片**: `w-full h-auto rounded-lg`
- **Caption**: `text-xs text-[var(--color-text-tertiary)] mt-2 text-center`
- **Alt**: 必须提供，用于可访问性
- **Lazy loading**: `loading="lazy"`

### 3.4 Code Snippet Block

```
┌─────────────────────────────────────────────────────────────┐
│  plaintext                              42 行                │
├─────────────────────────────────────────────────────────────┤
│  1  │ const foo = "bar";                                      │
│  2  │ console.log(foo);                                       │
│  3  │                                                       │
│  4  │ function greet() {                                      │
│  ...│ ...                                                     │
└─────────────────────────────────────────────────────────────┘
```

- **容器**: `rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/60%)] overflow-hidden`
- **Header**: `flex items-center justify-between px-4 py-2 bg-[rgb(255_255_255_/5%)] text-xs text-[var(--color-text-tertiary)]`
- **行号栏**: `py-3 px-3 text-right text-xs text-[var(--color-text-tertiary)] select-none border-r border-[rgb(255_255_255_/5%)]`
- **代码区**: `p-3 text-sm font-mono overflow-x-auto flex-1`
- **行号**: 每行一个 `div`，行高 `leading-6`
- **复制按钮**: header 右侧添加复制按钮（可选，Phase 6 基础版可省略）

### 3.5 Callout Block

```
┌─────────────────────────────────────────────────────────────┐
│  │ ⚠  Warning title                                         │
│  │ Warning message content...                               │
│  │ Multiple lines supported.                                │
└─────────────────────────────────────────────────────────────┘
```

- **布局**: `border-l-4 rounded-2xl p-5` + 变体样式
- **变体样式**:
  - `info`: `border-l-blue-500 bg-blue-500/5`
  - `warning`: `border-l-amber-500 bg-amber-500/5`
  - `error`: `border-l-red-500 bg-red-500/5`
  - `tip`: `border-l-green-500 bg-green-500/5`
- **图标**: Lucide 图标（Info, AlertTriangle, XCircle, Lightbulb），`h-5 w-5`
- **图标颜色**: 与边框同色
- **标题**: `font-medium text-sm text-[var(--color-text-primary)] mb-1`
- **内容**: `text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap`
- **布局**: `flex items-start gap-3`

**重要**: 禁止使用 emoji 作为图标。必须使用 `lucide-react` 的图标组件。

---

## 4. Public Content Detail Pages

### 4.1 Shared Layout

所有四个公开内容详情页共享以下布局结构：

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to [Section]                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  EYEBROW (category/format)                                  │
│                                                             │
│  Content Title                                              │
│                                                             │
│  Summary description...                                    │
│                                                             │
│  [Metadata 1]  [Metadata 2]  [Metadata 3]                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Content Sections                                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Section 1 Title                                      │   │
│  │ Section 1 description...                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Section 2 Title                                      │   │
│  │ Section 2 description...                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Related [Section]                                          │
│  ┌──────────┐ ┌──────────┐                                 │
│  │ Related 1│ │ Related 2│                                 │
│  └──────────┘ └──────────┘                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Scenario Detail

**Hero**:
- Eyebrow: "Scenario" (`text-xs tracking-[0.18em] text-[var(--color-electric-purple)]`)
- Title: `text-4xl font-semibold text-[var(--color-text-primary)]`
- Summary: `text-lg text-[var(--color-text-secondary)] max-w-3xl`

**Metadata Strip**:
- Industry: `rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(212_218_245_/5%)] px-3 py-1 text-xs text-[var(--color-text-secondary)]`
- Business Outcome: 同上样式
- Tags: 紫色标签样式

**Metrics**:
- 横向排列，复用 Asset Detail 的 stat_card 样式
- 3 个指标等宽分布

**Phases**:
- 垂直列表，每个 phase 为独立卡片
- Phase 标题: `text-xl font-medium text-[var(--color-text-primary)]`
- Phase 描述: `text-sm text-[var(--color-text-secondary)] leading-6`
- 左侧可选步骤序号（圆形 badge）

**Related Architecture**:
- 标题: "Related Architecture" (`text-lg font-medium text-[var(--color-text-primary)]`)
- 卡片列表，每张卡片显示 title + summary（截断）
- 链接: `/architecture/{slug}`

### 4.3 Architecture Detail

**Hero**: 同 Scenario，eyebrow 为 "Reference Architecture"

**Metadata**:
- Focus: 标签样式
- Tags: 紫色标签

**Layers**:
- 四层卡片垂直排列
- 每层: `rounded-2xl glass-card p-6`
- 层标题: `text-xl font-medium text-[var(--color-text-primary)]`
- 层描述: `text-sm text-[var(--color-text-secondary)] leading-6`
- 左侧可选层序号（1-4）

**Governance**:
- 标题: "Governance Principles"
- 列表项，每项带左侧竖线装饰

**Deployment Notes**:
- 标题: "Deployment Notes"
- 列表项，同上样式

**Related Scenarios**:
- 卡片列表，链接到 `/scenarios/{slug}`

### 4.4 Insight Detail

**Hero**:
- Eyebrow: Category 名称
- Title + Summary

**Metadata**:
- Publish Date: `text-sm text-[var(--color-text-secondary)]`
- Read Time: 同上
- 格式: "June 10, 2026 · 6 min read"

**Key Points**:
- 标题: "Key Points"
- 列表项，每项带 `•` bullet + `text-sm text-[var(--color-text-secondary)]`

**Body Sections**:
- 多个 section，每个 `rounded-2xl glass-card p-6`
- Section 标题: `text-xl font-medium text-[var(--color-text-primary)]`
- Section 内容: `text-sm text-[var(--color-text-secondary)] leading-6`

**Related Insights**:
- 同 category 的其他文章
- 最多显示 3 个

### 4.5 Community Detail

**Hero**:
- Eyebrow: Format 名称（如 "Roundtable"）
- Title + Summary

**Metadata**:
- Audience: 标签样式
- Date: `text-sm text-[var(--color-text-secondary)]`
- Location: 同上

**Agenda**:
- 标题: "Agenda"
- 时间线样式，每项包含 title + description
- 可选：左侧时间线竖线 + 圆点

**Resources**:
- 标题: "Resources"
- 按钮链接组，使用 `lucide-react` 的 `ExternalLink` 或 `Link` 图标
- 按钮样式: `rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(212_218_245_/5%)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[rgb(123_63_242_/35%)]`

---

## 5. Pagination UI

### 5.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Showing 1-20 of 150 items                                  │
│                                                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│  │ <  │ │ 1  │ │ 2  │ │ 3  │ │... │ │ 8  │ │ >  │        │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘        │
│                                                             │
│  Rows per page: [20 ▼]                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Mobile Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1-20 of 150                                                │
│                                                             │
│  ┌──────────┐  ┌────┐  ┌──────────┐                      │
│  │ Previous │  │ 1  │  │  Next    │                      │
│  └──────────┘  └────┘  └──────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Component Specs

**Total Count Display**:
- 文本: "Showing {start}-{end} of {total} items"
- 样式: `text-sm text-[var(--color-text-secondary)]`
- 位置: 分页控件上方左侧

**Page Numbers**:
- 当前页: `bg-[var(--color-electric-purple)] text-white rounded-lg px-3 py-1`
- 其他页: `text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgb(212_218_245_/5%)] rounded-lg px-3 py-1`
- 省略号: `text-[var(--color-text-tertiary)] px-2`
- 最大显示: 5 个页码 + 首尾 + 省略号

**Prev/Next Buttons**:
- 使用 Lucide `ChevronLeft` / `ChevronRight` 图标
- 禁用状态: `opacity-50 cursor-not-allowed`
- 样式: `rounded-lg border border-[rgb(212_218_245_/12%)] px-3 py-1`

**Page Size Selector**:
- 选项: 10, 20, 50
- 样式: shadcn Select 组件，或自定义 `rounded-lg border border-[rgb(212_218_245_/12%)] bg-transparent px-3 py-1 text-sm`
- 位置: 分页控件右侧（desktop）或下方（mobile）

**Hover States**:
- 页码 hover: `bg-[rgb(212_218_245_/5%)]`, transition 150ms
- 按钮 hover: `border-[rgb(123_63_242_/35%)]`, transition 150ms

**Focus States**:
- 所有可交互元素: `focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-purple)] focus:ring-offset-2 focus:ring-offset-[var(--color-void-black)]`

---

## 6. Batch Operations UI

### 6.1 Table with Selection

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌────┐ Name          Email              Status   Actions  │
│  │ ☑  │                                              │
│  ├────┼───────────────┼──────────────────┼────────┼────────┤
│  │ ☑  │ User 1        │ user1@email.com  │ Active │ ✏ 🗑  │
│  ├────┼───────────────┼──────────────────┼────────┼────────┤
│  │ ☐  │ User 2        │ user2@email.com  │ Active │ ✏ 🗑  │
│  ├────┼───────────────┼──────────────────┼────────┼────────┤
│  │ ☐  │ User 3        │ user3@email.com  │ Inact. │ ✏ 🗑  │
│  └────┴───────────────┴──────────────────┴────────┴────────┘
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2 selected                    [Delete Selected]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Row Checkbox

- 位置: 每行首列
- 样式: shadcn Checkbox 组件
- `aria-label`: "Select {item name}"
- 状态: 与 `selectedIds` Set 同步

### 6.3 Select All Checkbox

- 位置: 表头首列
- 行为:
  - 未选中 → 点击选中当前页所有可见项
  - 部分选中 → 点击选中当前页所有可见项
  - 全选中 → 点击取消全选
- 样式: shadcn Checkbox，indeterminate 状态显示横线

### 6.4 Batch Action Bar

**Position**:
- Desktop: 表格底部固定，或表格上方
- Mobile: 屏幕底部固定浮动条

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  3 selected                              [Clear] [Delete]  │
└─────────────────────────────────────────────────────────────┘
```

**Styles**:
- 容器: `fixed bottom-0 left-0 right-0 bg-[var(--color-surface-dark)] border-t border-[var(--color-border-subtle)] px-6 py-3 flex items-center justify-between z-50`
- 或: `sticky bottom-0`（若在表格容器内）
- 选中计数: `text-sm text-[var(--color-text-primary)] font-medium`
- Clear 按钮: `text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]`
- Delete 按钮: `rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium`

**Animation**:
- 出现: `translateY(100%) → translateY(0)`, duration 300ms, ease-out-expo
- 消失: `translateY(0) → translateY(100%)`, duration 200ms

### 6.5 Batch Delete Confirm Dialog

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Are you sure?                                              │
│                                                             │
│  This will permanently delete 3 users.                      │
│  This action cannot be undone.                              │
│                                                             │
│                    [Cancel]  [Delete]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- 使用 shadcn AlertDialog 组件
- 标题: `text-lg font-semibold text-[var(--color-text-primary)]`
- 描述: `text-sm text-[var(--color-text-secondary)]`
- 删除按钮: `bg-red-600 hover:bg-red-700 text-white`
- 取消按钮: `border border-[rgb(212_218_245_/12%)] bg-transparent text-[var(--color-text-secondary)]`
- 焦点: 打开时聚焦 Cancel 按钮（安全默认）

### 6.6 Toast Notifications

**Success**:
- "3 users deleted successfully"
- 样式: `bg-green-500/10 border border-green-500/20 text-green-400`
- 图标: Lucide `CheckCircle`

**Partial Failure**:
- "2 users deleted, 1 failed"
- 样式: `bg-amber-500/10 border border-amber-500/20 text-amber-400`
- 图标: Lucide `AlertTriangle`

**Error**:
- "Failed to delete users"
- 样式: `bg-red-500/10 border border-red-500/20 text-red-400`
- 图标: Lucide `XCircle`

---

## 7. Dark Theme Consistency

### 7.1 全局规则

- 所有页面使用 `.dark` 主题，背景为 `--color-void-black` (#0a0a0f)
- 卡片使用 glass surface（半透明 + backdrop-blur）
- 文字层级: primary (#f0f0f5) → secondary (#8b8ba3) → tertiary (#5a5a72)
- 边框统一使用 `rgb(212 218 245 / 12%)`

### 7.2 组件级规则

| 组件 | 背景 | 边框 | 文字 |
|------|------|------|------|
| 页面 | `#0a0a0f` | — | `#f0f0f5` |
| 卡片 | `rgb(18 18 26 / 70%)` | `rgb(212 218 245 / 12%)` | `#f0f0f5` |
| 输入框 | `rgb(212 218 245 / 5%)` | `rgb(212 218 245 / 12%)` | `#f0f0f5` |
| 按钮(primary) | `#7b3ff2` | — | `#ffffff` |
| 按钮(secondary) | `rgb(212 218 245 / 10%)` | `rgb(212 218 245 / 12%)` | `#f0f0f5` |
| 标签 | `rgb(123 63 242 / 12%)` | `rgb(123 63 242 / 35%)` | `#d4daf5` |

### 7.3 禁止项

- ❌ 禁止使用 emoji 作为功能图标
- ❌ 禁止使用紫色/粉色渐变作为页面背景
- ❌ 禁止使用默认系统字体（必须声明 font-sans）
- ❌ 禁止纯白色背景卡片
- ❌ 禁止无 hover/focus 状态的交互元素

---

## 8. Responsive Design

### 8.1 Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | 单栏，全宽元素 |
| Tablet | 768px - 1024px | 单栏/双栏混合 |
| Desktop | > 1024px | 最大宽度 64rem 居中 |

### 8.2 Asset Detail Responsive

**Mobile (< 768px)**:
- Hero title: `text-2xl` (缩小)
- Stat cards: `grid-cols-1` (单列堆叠)
- Code block: 横向滚动，行号可选隐藏
- Image: 宽度 100%，忽略 config.width
- Padding: `px-4 py-8`

**Tablet (768px - 1024px)**:
- Stat cards: `grid-cols-2`
- 其他同 desktop

### 8.3 Public Content Detail Responsive

**Mobile**:
- Related items: 垂直堆叠
- Metadata: 垂直排列
- Agenda timeline: 简化，无左侧时间线

### 8.4 Pagination Responsive

**Mobile**:
- 隐藏页码数字，仅显示 prev/current/next
- Page size selector 隐藏或移至底部
- 总记录数简化: "1-20 / 150"

### 8.5 Batch Operations Responsive

**Mobile**:
- BatchActionBar: 全宽浮动，高度增加
- Checkbox 触摸区域: 最小 44×44px
- Delete 按钮: 全宽

---

## 9. Hover & Focus States

### 9.1 Interactive Elements

| Element | Hover | Focus | Active |
|---------|-------|-------|--------|
| Link | `color: text-primary` | `ring-2 ring-purple` | `opacity-80` |
| Button (primary) | `bg: #6b2fe2` | `ring-2 ring-purple ring-offset-2` | `scale-0.98` |
| Button (secondary) | `bg: rgb(212 218 245 / 15%)` | `ring-2 ring-purple` | `scale-0.98` |
| Card | `shadow: shadow-card-hover` | `ring-2 ring-purple` | — |
| Table row | `bg: rgb(212 218 245 / 3%)` | `ring-1 ring-purple` | — |
| Checkbox | — | `ring-2 ring-purple` | — |
| Pagination item | `bg: rgb(212 218 245 / 5%)` | `ring-2 ring-purple` | — |

### 9.2 Transition Specs

```css
/* 统一过渡 */
--duration-fast: 150ms;
--duration-normal: 300ms;
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

transition: color var(--duration-fast) ease,
            background-color var(--duration-fast) ease,
            border-color var(--duration-fast) ease,
            box-shadow var(--duration-fast) ease,
            transform var(--duration-fast) ease;
```

### 9.3 Focus Visible

- 使用 `focus-visible` 而非 `focus`，避免鼠标点击时显示 focus ring
- Focus ring: `ring-2 ring-[var(--color-electric-purple)] ring-offset-2 ring-offset-[var(--color-void-black)]`

---

## 10. Animation Specs

### 10.1 Page Enter

- 内容区: `opacity: 0 → 1`, `translateY(20px) → translateY(0)`
- Duration: 500ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Stagger: 每个 content block 延迟 50ms

### 10.2 Content Block Enter

- 每个 block: `opacity: 0 → 1`, `translateY(10px) → translateY(0)`
- Duration: 400ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Stagger: 50ms between blocks

### 10.3 Batch Action Bar

- Enter: `translateY(100%) → translateY(0)`, 300ms, ease-out-expo
- Exit: `translateY(0) → translateY(100%)`, 200ms, ease-in

### 10.4 Modal/Dialog

- Overlay: `opacity: 0 → 0.5`, 200ms
- Content: `scale(0.95) opacity(0) → scale(1) opacity(1)`, 300ms, ease-out-expo

### 10.5 Toast

- Enter: `translateX(100%) → translateX(0)`, 400ms, ease-out-expo
- Exit: `opacity: 1 → 0`, 200ms, ease-in
- Auto-dismiss: 4000ms

---

## 11. Iconography

### 11.1 Icon Library

- **唯一来源**: `lucide-react`
- **禁止**: emoji、SVG 内联、其他图标库

### 11.2 Icon Mapping

| Usage | Icon | Size |
|-------|------|------|
| Back link | `ArrowLeft` | 16px |
| Callout info | `Info` | 20px |
| Callout warning | `AlertTriangle` | 20px |
| Callout error | `XCircle` | 20px |
| Callout tip | `Lightbulb` | 20px |
| Pagination prev | `ChevronLeft` | 16px |
| Pagination next | `ChevronRight` | 16px |
| Batch delete | `Trash2` | 16px |
| Batch clear | `X` | 16px |
| Toast success | `CheckCircle` | 16px |
| Toast warning | `AlertTriangle` | 16px |
| Toast error | `XCircle` | 16px |
| Related link | `ArrowRight` | 16px |
| Copy code | `Copy` | 14px |
| External link | `ExternalLink` | 14px |
| Checkbox | `Check` (内置) | — |

### 11.3 Icon Colors

- 默认: `text-[var(--color-text-secondary)]`
- Hover: `text-[var(--color-text-primary)]`
- Callout: 与变体边框同色（blue/amber/red/green）
- Toast: 与 toast 类型同色

---

## 12. Empty & Error States

### 12.1 Asset Detail — Asset Not Found

- Next.js `notFound()` 触发默认 404 页面
- 或自定义: "Asset not found" + 返回 Asset Library 链接

### 12.2 Public Content — Slug Not Found

- `notFound()` 触发 404
- 自定义消息: "This content is no longer available."

### 12.3 Search — No Results

- 图标: `Search` (Lucide)
- 消息: "No results found for '{query}'"
- 建议: "Try a different keyword or remove filters."

### 12.4 List — Empty State

- 图标: `Inbox` (Lucide)
- 消息: "No {items} found."
- 操作按钮: "Create {item}"（若适用）

---

## 13. Component Inventory

### 13.1 New Components

| Component | File | Type | Props |
|-------------|------|------|-------|
| ContentBlockRenderer | `components/public/content-block-renderer.tsx` | Client | `block: ContentBlock` |
| TextBlock | (inline) | Client | `config: TextBlockConfig` |
| StatCardBlock | (inline) | Client | `config: StatCardBlockConfig` |
| ImageBlock | (inline) | Client | `config: ImageBlockConfig` |
| CodeSnippetBlock | (inline) | Client | `config: CodeSnippetBlockConfig` |
| CalloutBlock | (inline) | Client | `config: CalloutBlockConfig` |
| PublicContentDetailLayout | `components/public/public-content-layout.tsx` | Server | `backHref, backLabel, eyebrow, title, summary, metadata, content, relatedItems` |
| RelatedLinks | `components/public/related-links.tsx` | Client | `items: {label, href}[]` |
| Pagination | `components/admin/pagination.tsx` | Client | `total, limit, offset, onChange, pageSizeOptions?, onPageSizeChange?` |
| BatchActionBar | `components/admin/batch-action-bar.tsx` | Client | `selectedCount, totalCount, onDelete, onClear, isDeleting` |
| BatchDeleteDialog | `components/admin/batch-delete-dialog.tsx` | Client | `open, count, onConfirm, onCancel, isDeleting` |

### 13.2 Modified Components

| Component | File | Changes |
|-----------|------|---------|
| AssetDetailPage | `app/assets/[id]/page.tsx` | Route param slug→id, use ContentBlockRenderer |
| AdminUsersPage | `app/admin/users/page.tsx` | Add Pagination, BatchActionBar, checkboxes |
| AdminAssetsPage | `app/admin/assets/page.tsx` | Add Pagination, BatchActionBar, checkboxes |
| AdminRolesPage | `app/admin/roles/page.tsx` | Add Pagination, BatchActionBar, checkboxes |
| AdminPoliciesPage | `app/admin/policies/page.tsx` | Add Pagination, BatchActionBar, checkboxes |

### 13.3 New Hooks

| Hook | File | Purpose |
|------|------|---------|
| useBatchSelection | `hooks/use-batch-selection.ts` | Manage selected item IDs |

---

## 14. File Structure

```
web/src/
├── app/
│   ├── assets/
│   │   └── [id]/
│   │       └── page.tsx
│   ├── scenarios/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── architecture/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── insights/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── community/
│   │   └── [slug]/
│   │       └── page.tsx
│   └── admin/
│       ├── users/
│       │   └── page.tsx
│       ├── assets/
│       │   └── page.tsx
│       ├── roles/
│       │   └── page.tsx
│       └── policies/
│           └── page.tsx
├── components/
│   ├── public/
│   │   ├── content-block-renderer.tsx
│   │   ├── public-content-layout.tsx
│   │   └── related-links.tsx
│   └── admin/
│       ├── pagination.tsx
│       ├── batch-action-bar.tsx
│       └── batch-delete-dialog.tsx
├── hooks/
│   └── use-batch-selection.ts
└── lib/
    └── public-content.ts      # 已有，不变
```
