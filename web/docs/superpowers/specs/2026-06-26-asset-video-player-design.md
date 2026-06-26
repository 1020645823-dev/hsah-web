# Asset 多视频内嵌播放器与管理设计稿

Date: 2026-06-26
Scope: Hyperscaler Asset Hub (`web` + `api`)
Status: draft

---

## 1. 概述

当前 Asset 详情页已经支持展示 `introduction`、`use_cases`、`live_demo_url`，但视频能力仍停留在单个 `demo_video_url` 跳转链接，无法满足以下需求：

1. 详情页直接内嵌播放视频，而不是只跳转到外部链接
2. 一个 asset 支持维护多个视频内容
3. Admin 资产编辑页支持视频条目的新增、删除和基础信息修改
4. 明确设置主视频，决定详情页默认播放内容

本设计将视频能力升级为 `shared_fields.videos` 的结构化数组模型，在不新增独立数据表的前提下，完成前后台一致的视频管理和播放器体验。

---

## 2. 目标

1. 在公开 Asset 详情页提供真正的内嵌视频播放器
2. 每个 asset 支持维护多个视频条目
3. 每条视频支持管理 `标题 + 链接 + 封面 + 简介`
4. 支持在 Admin 页面中增加、删除、编辑视频，并单独指定主视频
5. 保持对旧 `demo_video_url` 数据的兼容，避免历史 asset 立即失效

---

## 3. 范围

### 3.1 In Scope

**前台详情页**

- 在 `AssetDetailView` 中增加主视频播放器区域
- 展示视频标题、简介、封面
- 展示视频列表，支持切换当前播放视频
- 默认播放被标记为主视频的条目
- 若无新视频列表但存在旧 `demo_video_url`，回退到单视频模式

**Admin 资产编辑**

- 在 `AssetEditorForm` 的 `Shared Detail` 区域增加视频管理器
- 支持新增视频条目
- 支持删除视频条目
- 支持编辑视频基础信息：标题、视频链接、封面链接、简介
- 支持设定主视频，并保证唯一

**数据与接口**

- 扩展 `shared_fields` 结构，增加 `videos` 数组
- 扩展前端 draft / payload / parse 逻辑
- 扩展 API schema 返回与接收结构
- 补充 seed 数据中的视频样例
- 为兼容旧数据保留 `demo_video_url` 读取逻辑

**测试**

- 前端播放器渲染与视频切换测试
- Admin 视频管理交互测试
- 后端 schema / 兼容逻辑测试

### 3.2 Out of Scope

- 独立视频资源中心或跨 asset 复用视频库
- 视频上传到本地存储或对象存储
- 视频转码、字幕、播放统计
- 拖拽排序和复杂视频运营能力
- 非 asset 内容类型（scenarios / architecture / insights / community）的播放器改造

---

## 4. 用户决策

基于本轮确认，设计采用以下固定约束：

1. 一个 asset 支持 **多个视频**
2. 每条视频包含 **标题、链接、封面、简介**
3. 详情页默认播放逻辑采用 **单独设置主视频**

---

## 5. 数据模型设计

### 5.1 Shared Fields 扩展

当前：

```json
{
  "introduction": "string",
  "use_cases": ["string"],
  "demo_video_url": "string | null",
  "live_demo_url": "string | null"
}
```

升级后：

```json
{
  "introduction": "string",
  "use_cases": ["string"],
  "demo_video_url": "string | null",
  "live_demo_url": "string | null",
  "videos": [
    {
      "id": "string",
      "title": "string",
      "video_url": "string",
      "poster_url": "string | null",
      "description": "string",
      "is_primary": true
    }
  ]
}
```

### 5.2 Video Item 结构

每条视频定义如下：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 前端编辑稳定标识，建议使用 uuid 或本地随机 id |
| `title` | string | 是 | 视频标题 |
| `video_url` | string | 是 | 视频播放地址 |
| `poster_url` | string \| null | 否 | 封面图 URL |
| `description` | string | 否 | 视频简介 |
| `is_primary` | boolean | 是 | 是否为主视频 |

### 5.3 数据约束

1. `videos` 允许为空数组
2. 同一 asset 最多只能有一个 `is_primary = true`
3. 存在多个视频但未设置主视频时，保存阶段自动将第一条设为主视频
4. 删除主视频后，如果列表仍有剩余条目，则自动将第一条剩余视频提升为主视频
5. `poster_url` 可为空，但填写后必须是合法 URL
6. `video_url` 必须是合法 URL

### 5.4 兼容策略

为了兼容当前数据库中的旧结构：

1. `shared_fields.demo_video_url` 暂时保留，不立刻删除
2. 当 `videos` 为空但 `demo_video_url` 有值时：
   - 详情页可回退渲染为一个默认视频对象
   - Admin 编辑页加载时可将其映射为一个临时视频条目
3. 用户保存一次 asset 后，以新 `videos` 结构为准

---

## 6. 后端设计

### 6.1 Schema 扩展

需要在 `api/app/schemas/asset.py` 中新增视频模型：

```python
class AssetVideoItem(BaseModel):
    id: str
    title: str = Field(..., min_length=1, max_length=160)
    video_url: str = Field(..., min_length=1, max_length=1000)
    poster_url: str | None = Field(None, max_length=1000)
    description: str = Field(default="", max_length=500)
    is_primary: bool = False
```

并将 `SharedAssetFields` 扩展为：

```python
class SharedAssetFields(BaseModel):
    introduction: str = ""
    use_cases: list[str] = Field(default_factory=list)
    demo_video_url: str | None = None
    live_demo_url: str | None = None
    videos: list[AssetVideoItem] = Field(default_factory=list)
```

### 6.2 写入校验

在 Asset 创建和更新时增加以下后端校验：

1. `videos` 中必须至少有一个合法 `video_url` 才能视为有效视频条目
2. `is_primary = true` 的条目最多只能有一个
3. 若提交中有多个主视频，返回 422
4. 若提交中存在视频但没有主视频，服务端自动修正第一条为主视频

### 6.3 读取兼容

公开详情接口和 admin 详情接口都应保证 `shared_fields.videos` 始终存在：

- 新数据：直接返回 `videos`
- 旧数据：若只有 `demo_video_url`，则读取层构造一个兼容视频对象供前端渲染

兼容对象建议如下：

```json
{
  "id": "legacy-demo-video",
  "title": "Demo video",
  "video_url": "<demo_video_url>",
  "poster_url": null,
  "description": "",
  "is_primary": true
}
```

### 6.4 数据库存储

- 不新增数据表
- 继续使用 `assets.shared_fields` JSON 字段承载视频列表
- 不需要新增 Alembic 列

---

## 7. Admin 前端设计

### 7.1 编辑器结构

在 `AssetEditorForm` 的 `Shared Detail` 区块中，将当前单个 `Demo 视频链接` 输入框升级为 `视频内容管理器`。

结构如下：

```text
Shared Detail
├─ 介绍文字
├─ 适用业务
├─ Live Demo 链接
└─ 视频内容管理
   ├─ 视频卡片 #1
   │  ├─ 标题
   │  ├─ 视频链接
   │  ├─ 封面链接
   │  ├─ 简介
   │  ├─ 设为主视频
   │  └─ 删除
   ├─ 视频卡片 #2
   └─ 新增视频按钮
```

### 7.2 交互规则

1. 点击“新增视频”后追加一条空白视频卡片
2. 点击“设为主视频”时：
   - 当前视频 `is_primary = true`
   - 其他视频自动变为 `false`
3. 点击“删除”时：
   - 直接移除当前视频
   - 若删除的是主视频，且仍有剩余视频，则自动把第一条剩余视频设为主视频
4. 若当前没有视频：
   - 详情页不渲染视频播放器
   - Admin 页面只显示“新增视频”入口

### 7.3 Draft 结构扩展

`web/src/lib/admin-asset-editor.ts` 中的 `AssetEditorDraft` 需要新增：

```ts
type AssetVideoDraft = {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl: string;
  description: string;
  isPrimary: boolean;
};
```

并将：

```ts
sharedFields: {
  introduction: string;
  useCases: string[];
  demoVideoUrl: string;
  liveDemoUrl: string;
}
```

升级为：

```ts
sharedFields: {
  introduction: string;
  useCases: string[];
  demoVideoUrl: string;
  liveDemoUrl: string;
  videos: AssetVideoDraft[];
}
```

### 7.4 Admin 表单校验

客户端校验增加以下规则：

1. 视频标题不能为空
2. 视频链接不能为空且必须是合法 URL
3. 封面链接若存在则必须是合法 URL
4. 只能有一个主视频
5. 若存在视频列表但没有主视频，则在构造 payload 前自动修正

### 7.5 Payload 构造

`buildPayload()` 应输出：

```json
{
  "shared_fields": {
    "introduction": "string",
    "use_cases": ["string"],
    "demo_video_url": null,
    "live_demo_url": "string | null",
    "videos": [
      {
        "id": "string",
        "title": "string",
        "video_url": "string",
        "poster_url": "string | null",
        "description": "string",
        "is_primary": true
      }
    ]
  }
}
```

说明：

- `demo_video_url` 在新写入结构中可以保留为 `null`
- 若为了兼容历史展示，需要也可同步写入主视频的 `video_url` 到 `demo_video_url`
- 推荐同步写入主视频链接到 `demo_video_url`，降低旧逻辑分支风险

---

## 8. 公开详情页设计

### 8.1 播放器区域

在 `AssetDetailView` 的 `SharedDetailPanel` 中，将当前纯链接区升级为播放器卡片。

建议结构：

```text
Shared context
├─ 介绍文字
├─ 适用业务
├─ 主播放器卡片
│  ├─ 视频播放器 / iframe / video 容器
│  ├─ 当前视频标题
│  ├─ 当前视频简介
│  └─ Open live demo 按钮（若存在）
└─ 视频切换列表
   ├─ 视频项 A
   ├─ 视频项 B
   └─ 视频项 C
```

### 8.2 播放器实现原则

考虑当前需求与风险，播放器实现采用“URL 驱动的可嵌入播放器容器”：

1. 优先支持可直接嵌入的视频地址
2. 若链接无法安全嵌入，则保留“在新窗口打开视频”的回退入口
3. 对于常见公开视频平台，可通过 URL 规则转换为 embed 地址

本阶段不引入复杂第三方播放器 SDK，优先采用原生 `iframe` / `video` 封装策略。

### 8.3 默认播放逻辑

详情页加载时：

1. 先读取 `shared_fields.videos`
2. 找到 `is_primary = true` 的视频作为默认视频
3. 若没有主视频，则使用第一条
4. 若 `videos` 为空但 `demo_video_url` 存在，则构造 legacy 单视频播放

### 8.4 交互逻辑

1. 用户点击视频列表项时，切换当前播放视频
2. 当前选中视频的标题、简介、封面同步更新
3. `live_demo_url` 与视频切换无关，保持为 asset 级 CTA

### 8.5 可见性

视频属于 `shared_fields`，因此：

- 对匿名用户可见
- 对 Sales / Delivery 双模式都可见
- 不受 Delivery 权限门控影响

---

## 9. 兼容迁移策略

### 9.1 历史数据读取

历史数据可能存在以下情况：

1. 只有 `demo_video_url`
2. 同时有 `demo_video_url` 和新 `videos`
3. 两者都没有

处理规则：

- 若存在 `videos` 且非空，以 `videos` 为准
- 若 `videos` 为空且 `demo_video_url` 存在，走 legacy 映射
- 若两者都没有，不展示视频模块

### 9.2 Seed 数据

`api/app/scripts/seed_assets.py` 应补充至少 2 条视频样例：

1. 主视频：有标题、视频链接、封面、简介
2. 次视频：有标题、视频链接、封面、简介

这样可以直接验证：

- 默认播放主视频
- 点击视频列表可切换
- Admin 页面加载时能看到多视频条目

---

## 10. 错误处理

### 10.1 Admin

- URL 非法：字段级错误提示
- 多个主视频：提交前拦截并提示
- 主视频缺失：提交时自动修正，不要求用户手动排查
- 后端返回 422：定位到视频列表对应字段错误

### 10.2 详情页

- 视频链接不可嵌入：显示回退提示和“Open video”按钮
- 封面缺失：使用通用视频占位样式，不使用外部占位图
- 当前视频数据不完整：跳过损坏条目，回退到下一条可用视频

---

## 11. 测试设计

### 11.1 前端测试

**`asset-detail-view.test.tsx`**

- 有多个视频时默认渲染主视频
- 点击视频列表项后切换当前视频标题和简介
- 无 `videos` 但有旧 `demo_video_url` 时仍显示播放器或回退入口
- 无视频时不渲染播放器区

**`asset-editor-form.test.tsx`**

- 可以新增视频条目
- 可以删除视频条目
- 设为主视频时其他条目自动取消主视频
- 删除主视频后自动选择新的主视频
- 提交 payload 包含 `shared_fields.videos`

**`admin-asset-editor.test.ts`**

- `parseAssetToDraft()` 能兼容旧 `demo_video_url`
- `buildPayload()` 输出唯一主视频
- 自动修正缺失主视频的情况

### 11.2 后端测试

**`test_assets.py` / `test_admin_assets.py`**

- 创建 asset 时允许提交 `shared_fields.videos`
- 读取 asset 时返回 `videos`
- 旧结构回退时能够构造默认视频
- 多主视频请求返回 422

**`test_seed_assets.py`**

- 样例资产包含多个视频
- 恰好存在一个主视频

---

## 12. 实施顺序

推荐按以下顺序实现：

1. 扩展后端 schema 与兼容读取逻辑
2. 扩展 `seed_assets`，让本地联调立即可见
3. 扩展 `admin-asset-editor.ts` draft / parse / payload / validation
4. 在 `AssetEditorForm` 中加入视频管理器 UI
5. 在 `AssetDetailView` 中加入主播放器与视频切换列表
6. 补齐前后端测试并做本地运行验证

---

## 13. 风险与取舍

### 13.1 不新建独立表

优点：

- 与当前 JSON 结构一致
- 改动更小，落地更快

代价：

- 视频无法跨 asset 复用
- 后续高级视频管理能力扩展性一般

### 13.2 保留 `demo_video_url`

优点：

- 历史兼容成本低
- 现有逻辑不会一次性断裂

代价：

- 过渡期内存在双字段语义

本阶段接受这个折中，等视频列表稳定后再考虑完全收敛到 `videos`

---

## 14. 验收标准

满足以下条件视为完成：

1. 公开 asset 详情页出现内嵌播放器，而不是只有外链按钮
2. 一个 asset 至少可维护两条视频并在前台切换播放
3. Admin 资产编辑页支持新增、删除、编辑视频基本信息
4. Admin 能明确设置主视频，详情页默认播放主视频
5. 旧 `demo_video_url` 数据不会导致详情页空白
6. 相关自动化测试通过，且本地 `3100` / `8000` 联调可见
