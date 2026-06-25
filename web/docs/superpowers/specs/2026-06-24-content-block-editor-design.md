# Content Block Editor Design Spec

**Date**: 2026-06-24  
**Phase**: Phase 2 (Content Block Editing)  
**Status**: Draft

---

## Overview

为资产编辑器添加内容块（content_blocks）编辑功能，支持 `text` 和 `stat_card` 两种类型的可视化编辑。

**核心设计决策**：
- 混合模式编辑器：列表视图 + 内联编辑 + 实时预览
- 集成到现有编辑页：在 `/admin/assets/[id]/edit` 添加第 5 个 Card
- 混合排序：拖拽（@dnd-kit）+ 按钮（↑↓）
- 只支持现有类型：`text` 和 `stat_card`（不扩展新类型）

---

## Goals

1. **可视化编辑**：提供直观的内容块编辑体验
2. **灵活排序**：支持拖拽和按钮两种排序方式
3. **实时预览**：编辑时即时看到渲染效果
4. **向后兼容**：保持现有数据结构不变

---

## Scope

### In Scope (Phase 2)

**前端**：
- 新增 `ContentBlockEditor` 组件（受控组件）
- 新增 `BlockList` 组件（DnD 列表）
- 新增 `SortableBlockItem` 组件（可拖拽 block）
- 新增 `BlockPreview` 组件（缩略预览）
- 新增 `BlockEditorPanel` 组件（展开编辑面板）
- 新增 `TextBlockEditor` 组件（Markdown 编辑器）
- 新增 `StatCardBlockEditor` 组件（统计卡片编辑器）
- 新增 `admin-content-blocks.ts`（类型定义 + helper 函数）
- 修改 `AssetEditorForm`（添加第 5 个 Card）
- 修改 `admin-asset-editor.ts`（扩展 draft 类型）

**依赖**：
- 安装 `@dnd-kit/core` 和 `@dnd-kit/sortable`

**数据结构**：
```typescript
type ContentBlock = {
  id: string;
  type: "text" | "stat_card";
  order: number;
  visible: boolean;
  config: {
    // text: { markdown: string }
    // stat_card: { items: Array<{ label: string, value: string }> }
  };
};
```

### Out of Scope

- 新增 block 类型（如 `image`、`code_snippet`、`callout`）
- Markdown 富文本编辑器（使用 textarea + 预览）
- 图片上传功能
- 块模板系统
- 块复制/粘贴功能

---

## Component Architecture

### 组件树

```
AssetEditorForm (已有，添加第5个Card)
  └─ ContentBlockEditor (新)
       ├─ BlockList (新)
       │    ├─ SortableBlockItem (新，dnd-kit 包裹)
       │    │    └─ BlockPreview (新，缩略预览)
       │    └─ AddBlockButton (新，选择类型插入)
       └─ BlockEditorPanel (新，展开的编辑面板)
            ├─ TextBlockEditor (新，Markdown textarea + 预览)
            └─ StatCardBlockEditor (新，items 列表编辑)
```

### 文件结构

```
web/src/
├─ components/admin/content-blocks/
│  ├─ content-block-editor.tsx     # 容器组件，管理 blocks 状态
│  ├─ block-list.tsx               # DnD 列表，渲染 SortableBlockItem
│  ├─ sortable-block-item.tsx      # 单个可拖拽 block 项
│  ├─ block-preview.tsx            # block 缩略预览
│  ├─ block-editor-panel.tsx       # 展开编辑面板
│  ├─ text-block-editor.tsx        # text 类型编辑器
│  └─ stat-card-block-editor.tsx   # stat_card 类型编辑器
└─ lib/
   └─ admin-content-blocks.ts      # 纯函数：类型定义、helper、校验
```

### 集成方式

`ContentBlockEditor` 作为受控组件嵌入 `AssetEditorForm` 第 5 个 Card：

```typescript
// AssetEditorForm 新增：
<Card>
  <div className="mb-4">
    <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
      CONTENT BLOCKS
    </div>
    <div className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
      内容块
    </div>
  </div>
  <ContentBlockEditor
    blocks={draft.contentBlocks}
    onChange={(blocks) => updateField("contentBlocks", blocks)}
  />
</Card>
```

`AssetEditorDraft` 新增 `contentBlocks: ContentBlock[]` 字段：

```typescript
export type AssetEditorDraft = {
  // ... 现有字段
  contentBlocks: ContentBlock[];
};

export const INITIAL_DRAFT: AssetEditorDraft = {
  // ... 现有字段
  contentBlocks: [],
};
```

`buildPayload` 和 `parseAssetToDraft` 相应更新：

```typescript
// buildPayload
export function buildPayload(draft: AssetEditorDraft) {
  return {
    // ... 现有字段
    content_blocks: draft.contentBlocks.map((block, index) => ({
      ...block,
      order: index, // 自动根据数组顺序设置 order
    })),
  };
}

// parseAssetToDraft
export function parseAssetToDraft(asset: Record<string, any>): AssetEditorDraft {
  return {
    // ... 现有字段
    contentBlocks: Array.isArray(asset.content_blocks)
      ? asset.content_blocks
          .filter(isContentBlock)
          .sort((a, b) => a.order - b.order)
      : [],
  };
}
```

---

## Data Flow & Interaction Model

### 数据流

```
ContentBlockEditor (受控组件)
  │
  ├─ props: blocks: ContentBlock[], onChange: (blocks) => void
  │
  ├─ 内部状态:
  │   ├─ editingBlockId: string | null  (当前展开编辑的 block)
  │   └─ (拖拽状态由 dnd-kit 管理)
  │
  └─ 操作 → 生成新 blocks 数组 → onChange(newBlocks)
```

### 交互流程

1. **查看列表**：显示所有 block 的预览卡片，左侧拖拽手柄，右侧操作按钮（编辑、可见性切换、删除）
2. **添加 block**：点击底部的 "+ 添加内容块" 按钮，弹出类型选择（text / stat_card），插入到列表末尾
3. **编辑 block**：点击编辑按钮，block 展开成编辑面板（内联展开）
4. **拖拽排序**：拖拽手柄上下拖动，实时显示排序效果
5. **按钮排序**：每个 block 有 ↑↓ 箭头按钮，点击上移/下移
6. **可见性切换**：点击眼睛图标切换 `visible: true/false`
7. **删除 block**：点击 × 按钮，弹出确认对话框，确认后删除

### Block 编辑器

**TextBlockEditor：**
- 左侧：Markdown textarea（大文本框，等宽字体）
- 右侧：实时预览（简单的 markdown 渲染，支持标题、列表、粗体、链接）
- 布局：2 列网格，左侧编辑，右侧预览

**StatCardBlockEditor：**
- items 列表，每行：label 输入框 + value 输入框 + 删除按钮
- "+ 添加统计项" 按钮（插入到列表末尾）
- 建议 3-6 个统计项最佳（超过 6 个显示警告但不阻塞）

### 状态同步

- `AssetEditorForm` 持有 `draft.contentBlocks`
- `ContentBlockEditor` 通过 `onChange` 回调更新
- 保存时 `buildPayload` 将 `contentBlocks` 转为 `content_blocks` 格式（自动设置 order）
- 编辑时 `parseAssetToDraft` 将 `content_blocks` 转为 `contentBlocks` 格式（按 order 排序）

---

## UI Layout

### Block 列表项

```
┌─────────────────────────────────────────────────────────┐
│ ⋮⋮  Text                              ↑  ↓  👁  ✕      │
├─────────────────────────────────────────────────────────┤
│  预览区域（未编辑时显示）                                  │
│  或                                                      │
│  编辑面板（点击编辑后展开）                                │
└─────────────────────────────────────────────────────────┘
```

**状态样式**：
- 默认：`border-[rgb(255_255_255_/10%)]` + `bg-[rgb(255_255_255_/2%)]`
- Hover：`bg-[rgb(255_255_255_/4%)]`
- 编辑中：`border-[var(--color-electric-purple)]` + `bg-[rgb(124_58_237_/5%)]`
- 已隐藏：`opacity-60`

**拖拽手柄**：
- 左侧 32px 宽区域
- 显示 `⋮⋮` 图标
- Cursor: `grab`（拖拽中：`grabbing`）

**操作按钮**：
- 右上角，4 个按钮：↑ ↓ 👁 ✕
- 尺寸：28x28px
- Hover：`bg-[rgb(255_255_255_/10%)]`
- 禁用状态（如第一个 block 的 ↑ 按钮）：`opacity-30` + `cursor-not-allowed`

**添加按钮**：
- 虚线边框：`border-2 border-dashed border-[rgb(255_255_255_/10%)]`
- Hover：`border-[rgb(255_255_255_/20%)]` + `bg-[rgb(255_255_255_/2%)]`
- 点击后弹出类型选择菜单

### TextBlockEditor 布局

```
┌─────────────────────────────┬─────────────────────────────┐
│  Markdown 内容               │  预览                        │
├─────────────────────────────┼─────────────────────────────┤
│  ## 解决方案概述              │  ## 解决方案概述              │
│                              │                              │
│  这是一个**企业级**的...      │  这是一个**企业级**的...      │
│                              │                              │
│  - 高可用性架构               │  • 高可用性架构               │
│  - 自动扩缩容                 │  • 自动扩缩容                 │
│  - 多区域部署                 │  • 多区域部署                 │
│                              │                              │
│  (textarea, 等宽字体)         │  (渲染后的 markdown)          │
└─────────────────────────────┴─────────────────────────────┘
```

### StatCardBlockEditor 布局

```
┌─────────────────────────────────────────────────────────┐
│  Label          Value                          ✕        │
├─────────────────────────────────────────────────────────┤
│  [可用性      ] [99.9%       ]                    ✕      │
│  [响应时间    ] [50ms        ]                    ✕      │
│  [用户数      ] [10M+        ]                    ✕      │
├─────────────────────────────────────────────────────────┤
│  + 添加统计项                                             │
└─────────────────────────────────────────────────────────┘
```

---

## Error Handling & Edge Cases

### 错误处理策略

**1. Block 类型验证**
- 添加 block 时：必须选择有效类型（text / stat_card）
- 加载现有数据时：遇到未知类型，显示警告但不阻塞，标记为 "未知类型"

**2. 数据完整性**
- Block 缺少必要字段（id/type/config）：自动补全默认值
- Text block 的 markdown 为空：允许保存，显示空预览
- Stat card 的 items 为空：显示"暂无统计数据"提示

**3. 拖拽排序错误**
- 拖拽失败：保持原顺序，不显示错误
- 拖拽到无效位置：自动回弹到原位

**4. 删除确认**
- 点击删除：弹出确认对话框"确定删除此内容块？"
- 确认后从列表移除，触发 onChange

### 边界情况处理

| 场景 | 处理方式 |
|------|---------|
| 空列表（无 block） | 显示"暂无内容块，点击添加"提示 |
| 只有一个 block | 禁用 ↑↓ 按钮 |
| Block ID 重复 | 前端生成新 ID（使用 crypto.randomUUID） |
| 编辑时切换资产 | 重置 editingBlockId 为 null |
| Markdown 语法错误 | 渲染时容错，显示原始文本 |
| Stat card items 超过 6 个 | 允许，但建议 3-6 个最佳 |

### 数据结构校验

```typescript
function validateBlock(block: unknown): ContentBlock {
  if (!isContentBlock(block)) {
    return createDefaultBlock('text');
  }
  return block;
}

function isContentBlock(value: unknown): value is ContentBlock {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    (value.type === 'text' || value.type === 'stat_card')
  );
}

function createDefaultBlock(type: 'text' | 'stat_card'): ContentBlock {
  return {
    id: crypto.randomUUID(),
    type,
    order: 0,
    visible: true,
    config: type === 'text' ? { markdown: '' } : { items: [] },
  };
}
```

---

## Testing Strategy

### 单元测试

**1. `admin-content-blocks.ts` 测试**
- `validateBlock`: 测试有效 block、无效 block、缺失字段
- `createDefaultBlock`: 测试 text 和 stat_card 默认值
- `isContentBlock`: 测试类型守卫

**2. `ContentBlockEditor` 组件测试**
- 渲染空列表：显示"暂无内容块"提示
- 添加 text block：点击添加按钮，选择 text，验证 onChange 被调用
- 添加 stat_card block：同上
- 编辑 block：点击编辑按钮，验证展开编辑面板
- 删除 block：点击删除按钮，确认对话框，验证 onChange 被调用
- 切换可见性：点击眼睛图标，验证 block.visible 更新
- 拖拽排序：模拟拖拽事件，验证 order 更新
- 按钮排序：点击 ↑↓ 按钮，验证 order 更新

**3. `TextBlockEditor` 组件测试**
- 渲染 markdown textarea
- 输入文本：验证 onChange 被调用
- 预览渲染：验证 markdown 渲染正确

**4. `StatCardBlockEditor` 组件测试**
- 渲染 items 列表
- 添加 item：点击"添加统计项"，验证 items 数组更新
- 删除 item：点击删除按钮，验证 items 数组更新
- 编辑 item：修改 label/value，验证 items 数组更新

### 集成测试

**1. 完整编辑流程**
- 打开编辑页
- 添加 text block
- 输入 markdown
- 添加 stat_card block
- 添加 3 个统计项
- 拖拽排序
- 保存
- 验证 API 请求包含正确的 content_blocks

**2. 编辑现有 blocks**
- 加载已有资产
- 编辑 text block
- 修改 stat_card items
- 保存
- 验证更新成功

---

## Implementation Plan

### Task 1: 安装依赖 + 类型定义
- 安装 `@dnd-kit/core` 和 `@dnd-kit/sortable`
- 创建 `admin-content-blocks.ts`（类型定义 + helper 函数）
- 编写单元测试

### Task 2: ContentBlockEditor 容器组件
- 实现受控组件接口（props + state）
- 实现添加/删除/可见性切换逻辑
- 实现排序逻辑（拖拽 + 按钮）

### Task 3: BlockList + SortableBlockItem
- 使用 `@dnd-kit` 实现拖拽列表
- 实现 BlockPreview 组件
- 实现操作按钮（↑↓ 👁 ✕）

### Task 4: TextBlockEditor
- 实现 Markdown textarea + 实时预览
- 简单的 markdown 渲染（标题、列表、粗体、链接）

### Task 5: StatCardBlockEditor
- 实现 items 列表编辑
- 添加/删除/编辑统计项

### Task 6: 集成到 AssetEditorForm
- 修改 `admin-asset-editor.ts`（扩展 draft 类型）
- 修改 `AssetEditorForm`（添加第 5 个 Card）
- 更新 `buildPayload` 和 `parseAssetToDraft`

### Task 7: 集成测试 + 手动验证
- 运行所有测试
- 手动测试完整编辑流程
- 验证拖拽排序
- 验证保存/加载

---

## Success Criteria

1. ✅ 可以添加 text 和 stat_card block
2. ✅ 可以编辑 block 内容（Markdown / 统计项）
3. ✅ 可以拖拽排序
4. ✅ 可以使用按钮排序
5. ✅ 可以切换可见性
6. ✅ 可以删除 block
7. ✅ 编辑页第 5 个 Card 显示内容块编辑器
8. ✅ 保存时 content_blocks 正确提交到 API
9. ✅ 加载时 content_blocks 正确回填
10. ✅ 所有测试通过

---

## Future Work (Phase 3+)

- 新增 block 类型（image、code_snippet、callout）
- Markdown 富文本编辑器（Tiptap / ProseMirror）
- 图片上传功能（S3 / Cloudinary）
- 块模板系统（预设常用内容块组合）
- 块复制/粘贴功能
- 块搜索/过滤（按类型、内容）
