# Phase 3A: Extended Block Types Design Spec

**Date**: 2026-06-24  
**Phase**: Phase 3A (Extended Block Types)  
**Status**: Draft

---

## Overview

为内容块编辑器新增 3 种 block 类型：`image`、`code_snippet`、`callout`。同时实现图片上传后端接口和资产详情页的渲染支持。

---

## Goals

1. **扩展 block 类型**：新增 image、code_snippet、callout 三种类型
2. **图片上传**：后端提供文件上传接口，前端支持 URL 输入 + 本地上传
3. **编辑器组件**：每种类型提供专用编辑器
4. **详情页渲染**：资产详情页支持渲染新类型

---

## Scope

### In Scope

**后端**：
- `POST /api/v1/admin/assets/images` — 图片上传接口
- 静态文件服务（`/uploads` 路径）
- 内容块校验扩展（3 种新类型）

**前端**：
- 扩展 `admin-content-blocks.ts`（新类型定义 + helper）
- 新增 `ImageBlockEditor` 组件
- 新增 `CodeSnippetBlockEditor` 组件
- 新增 `CalloutBlockEditor` 组件
- 扩展 `ContentBlockEditor`（添加菜单 + renderEditor）
- 扩展 `block-preview.tsx`（新类型预览）
- 扩展资产详情页 `BlockRenderer`（新类型渲染）

### Out of Scope

- 语法高亮库集成（code_snippet 使用纯文本显示）
- 图片裁剪/压缩
- 云存储迁移
- Markdown 富文本编辑器（Phase 3B）

---

## Data Structures

### Image Block

```typescript
type ImageBlockConfig = {
  url: string;           // 图片 URL（手动输入或上传后自动生成）
  alt: string;           // 替代文本（无障碍）
  caption?: string;      // 图片说明
  width?: number;        // 宽度百分比 (1-100)
};
```

### Code Snippet Block

```typescript
type CodeSnippetBlockConfig = {
  language: string;      // 编程语言
  code: string;          // 代码内容
  showLineNumbers: boolean; // 是否显示行号
};
```

### Callout Block

```typescript
type CalloutBlockConfig = {
  variant: "info" | "warning" | "error" | "tip";
  title?: string;        // 可选标题
  content: string;       // 提示内容
};
```

### Extended Block Type Enum

```typescript
type BlockType = "text" | "stat_card" | "image" | "code_snippet" | "callout";
```

---

## Backend API

### POST /api/v1/admin/assets/images

**请求**：`multipart/form-data`
- `file`：图片文件（jpg/png/gif/webp，最大 5MB）

**响应**：
```json
// 201
{ "url": "/uploads/images/{uuid}.{ext}" }

// 400
{ "detail": { "code": "invalid_file_type", "message": "仅支持 jpg/png/gif/webp 格式" } }

// 413
{ "detail": { "code": "file_too_large", "message": "文件大小不能超过 5MB" } }
```

**存储**：`uploads/images/{uuid}.{ext}`

**静态文件服务**：FastAPI `StaticFiles` 挂载 `/uploads`

---

## Frontend Components

### ImageBlockEditor

- URL 输入框
- "上传图片" 按钮（触发文件选择）
- alt 文本输入
- caption 输入（可选）
- 宽度滑块（1-100%）
- 图片预览（实时显示）

### CodeSnippetBlockEditor

- 语言下拉选择（javascript, typescript, python, java, go, rust, html, css, sql, bash, plaintext）
- 代码 textarea（等宽字体，monospace）
- 行号开关（toggle）
- 代码预览

### CalloutBlockEditor

- variant 选择（4 个选项卡：info/warning/error/tip）
- 标题输入（可选）
- 内容 textarea
- 实时预览（带颜色条和 icon）

### ContentBlockEditor 扩展

"添加内容块" 菜单新增 3 个选项：
- 📷 图片
- 💻 代码片段
- 💡 提示框

### BlockPreview 扩展

| 类型 | 预览样式 |
|------|---------|
| image | 缩略图 + caption |
| code_snippet | 代码片段（带语言标签，最多 5 行） |
| callout | 带颜色条 + icon 的提示框（最多 2 行） |

---

## Asset Detail Page Rendering

### BlockRenderer 扩展

**Image 渲染**：
```html
<figure style="width: {width}%">
  <img src="{url}" alt="{alt}" loading="lazy" />
  <figcaption>{caption}</figcaption>
</figure>
```

**Code Snippet 渲染**：
```html
<div class="code-block">
  <div class="code-header">{language}</div>
  <pre><code>{code}</code></pre>
</div>
```

**Callout 渲染**：
```html
<div class="callout callout-{variant}">
  <div class="callout-icon">{icon}</div>
  <div class="callout-content">
    <div class="callout-title">{title}</div>
    <div class="callout-text">{content}</div>
  </div>
</div>
```

### Callout 样式映射

| variant | 颜色 | icon |
|---------|------|------|
| info | 蓝色 | ℹ️ |
| warning | 琥珀色 | ⚠️ |
| error | 红色 | ❌ |
| tip | 绿色 | 💡 |

---

## Error Handling

| 场景 | 处理 |
|------|------|
| 图片 URL 加载失败 | 显示占位图 + "图片加载失败" |
| 上传文件类型非法 | 前端拦截 + 提示 |
| 上传文件超过 5MB | 前端拦截 + 提示 |
| 上传网络失败 | 显示错误 + "重试" 按钮 |
| code_snippet 语言为空 | 默认 "plaintext" |
| callout variant 非法 | 默认 "info" |

---

## Testing Strategy

### 后端测试
- 图片上传成功（返回 URL）
- 图片上传失败（类型非法、超过 5MB）
- 静态文件可访问

### 前端测试
- 各编辑器组件的渲染和交互
- block-preview 新类型预览
- ContentBlockEditor 添加菜单扩展
- 图片上传流程（mock API）

---

## Implementation Plan

### Task 1: 后端图片上传 API
- 创建上传端点
- 配置静态文件服务
- 编写测试

### Task 2: 扩展类型定义
- 扩展 admin-content-blocks.ts
- 扩展 admin-content-blocks.test.ts

### Task 3: ImageBlockEditor 组件
- 实现编辑器组件
- 集成上传功能
- 编写测试

### Task 4: CodeSnippetBlockEditor 组件
- 实现编辑器组件
- 编写测试

### Task 5: CalloutBlockEditor 组件
- 实现编辑器组件
- 编写测试

### Task 6: 扩展 ContentBlockEditor + BlockPreview
- 扩展添加菜单
- 扩展 renderEditor
- 扩展 block-preview

### Task 7: 扩展资产详情页渲染
- 扩展 BlockRenderer
- 新类型样式

### Task 8: 集成测试
- 全量测试
- Lint + Build
