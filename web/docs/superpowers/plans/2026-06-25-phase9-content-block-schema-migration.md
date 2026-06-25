# Phase 9 — Content Block Schema, Migration, and Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为当前 5 种内容块建立统一的 schema、迁移与校验内核，并把后端错误精确映射到前端编辑器。

**Architecture:** 后端新增集中式 `normalize -> migrate -> validate` 管线，读取时自动迁移旧 block，保存时强制写回最新资产级和 block 级版本；前端不再兼容历史 block 结构，而是消费后端标准化后的 block，并把标准错误模型映射成顶部摘要、block 级错误和字段级错误。整个 Phase 9 只覆盖 `text / stat_card / image / code_snippet / callout` 五种现有 block，不重写编辑器。 

**Tech Stack:** Python (FastAPI, Pydantic, pytest), TypeScript (Next.js 16, React 19, Vitest, ESLint, Tailwind CSS 4)

---

## File Map

| File | Action | Responsibility |
|------|--------|--------------|
| `/Users/weiwei.g.zhang/Documents/hsah/api/app/schemas/content_blocks.py` | Create | 定义统一 block schema、5 种 block config、错误模型 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/app/services/content_blocks.py` | Create | normalize / migrate / validate / writeback 核心逻辑 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/app/schemas/asset.py` | Modify | 在资产读写 schema 中加入 `content_schema_version` |
| `/Users/weiwei.g.zhang/Documents/hsah/api/app/models/asset.py` | Modify | 新增资产级 `content_schema_version` 字段 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/app/api/v1/admin_assets.py` | Modify | 读取时标准化 block，保存时执行迁移与校验，返回结构化错误 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/app/api/v1/assets.py` | Modify | 公开详情返回标准化后的最新 block 结构 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_content_blocks_service.py` | Create | 后端 schema/migration/validation 单测 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_admin_assets.py` | Modify | 保存失败错误模型、保存写回版本、读取自动迁移测试 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_assets.py` | Modify | 公开详情读取最新 block 结构测试 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/admin-content-blocks.ts` | Modify | 前端 block 类型升级为统一 wrapper + `config` 模型 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/admin-asset-editor.ts` | Modify | 去掉旧 block 解析分叉，接入新的 asset version / block version 与错误模型 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/content-block-errors.ts` | Create | block error grouping、field lookup、局部清错 helper |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/content-block-errors.test.ts` | Create | helper 单测 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/content-block-editor.tsx` | Modify | 接入顶部错误摘要、按 block/field 分发错误 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/block-list.tsx` | Modify | block 级错误边框、锚点、摘要定位支持 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/text-block-editor.tsx` | Modify | 显示字段错误 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/stat-card-block-editor.tsx` | Modify | 显示字段错误 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/image-block-editor.tsx` | Modify | 显示字段错误 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/code-snippet-block-editor.tsx` | Modify | 显示字段错误 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/callout-block-editor.tsx` | Modify | 显示字段错误 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/content-block-editor.test.tsx` | Modify | 错误摘要、block 错误、局部清错测试 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/admin-asset-editor.test.ts` | Modify | 新 block 解析与 payload 构建测试 |

---

## Task 1: 建立后端内容块 schema 与迁移内核

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/api/app/schemas/content_blocks.py`
- Create: `/Users/weiwei.g.zhang/Documents/hsah/api/app/services/content_blocks.py`
- Test: `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_content_blocks_service.py`

- [ ] **Step 1: 写失败测试，定义旧 text block 会在读取时自动迁移**

```python
from app.services.content_blocks import normalize_blocks


def test_normalize_blocks_migrates_legacy_text_block_to_latest_shape() -> None:
    raw_blocks = [
        {
            "block_id": "legacy-text-1",
            "block_type": "text",
            "content": "hello",
        }
    ]

    normalized = normalize_blocks(raw_blocks, asset_schema_version=None)

    assert normalized.asset_schema_version == 2
    assert normalized.blocks == [
        {
            "id": "legacy-text-1",
            "type": "text",
            "version": 2,
            "order": 0,
            "visible": True,
            "config": {
                "markdown": "hello",
                "html": "",
            },
        }
    ]
```

- [ ] **Step 2: 写失败测试，未知 block type 必须显式失败**

```python
from app.services.content_blocks import ContentBlockValidationError, normalize_blocks


def test_normalize_blocks_rejects_unknown_block_type() -> None:
    raw_blocks = [
        {
            "id": "x1",
            "type": "carousel",
            "version": 1,
            "order": 0,
            "visible": True,
            "config": {},
        }
    ]

    try:
        normalize_blocks(raw_blocks, asset_schema_version=1)
    except ContentBlockValidationError as exc:
        assert exc.errors[0]["block_type"] == "carousel"
        assert exc.errors[0]["field"] == "type"
    else:
        raise AssertionError("expected ContentBlockValidationError")
```

- [ ] **Step 3: 运行测试确认失败**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_content_blocks_service.py -q
```

Expected: FAIL，因为 `content_blocks.py` 和 `content_blocks.py` service 还不存在。

- [ ] **Step 4: 定义统一 block schema 与错误模型**

```python
# app/schemas/content_blocks.py
from typing import Literal

from pydantic import BaseModel, Field


LATEST_ASSET_CONTENT_SCHEMA_VERSION = 2
LATEST_BLOCK_VERSION = 2


class TextBlockConfig(BaseModel):
    markdown: str = ""
    html: str = ""


class StatItem(BaseModel):
    label: str
    value: str
    description: str = ""


class StatCardBlockConfig(BaseModel):
    title: str = ""
    stats: list[StatItem] = Field(default_factory=list)


class ImageBlockConfig(BaseModel):
    src: str = ""
    alt: str = ""
    caption: str = ""


class CodeSnippetBlockConfig(BaseModel):
    language: str = ""
    code: str = ""
    filename: str = ""


class CalloutBlockConfig(BaseModel):
    title: str = ""
    content: str = ""
    tone: Literal["info", "warning", "success", "error"] = "info"
```

- [ ] **Step 5: 实现 normalize/migrate 骨架**

```python
# app/services/content_blocks.py
from dataclasses import dataclass

from app.schemas.content_blocks import LATEST_ASSET_CONTENT_SCHEMA_VERSION, LATEST_BLOCK_VERSION


@dataclass
class NormalizeResult:
    asset_schema_version: int
    blocks: list[dict]


class ContentBlockValidationError(Exception):
    def __init__(self, errors: list[dict]) -> None:
        self.errors = errors
        super().__init__("content block validation failed")


def normalize_blocks(raw_blocks: list[dict], asset_schema_version: int | None) -> NormalizeResult:
    blocks = []
    for index, raw_block in enumerate(raw_blocks):
        normalized = _normalize_single_block(raw_block, index)
        migrated = _migrate_block(normalized)
        blocks.append(migrated)
    return NormalizeResult(
        asset_schema_version=LATEST_ASSET_CONTENT_SCHEMA_VERSION,
        blocks=blocks,
    )
```

- [ ] **Step 6: 运行测试确认通过**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_content_blocks_service.py -q
```

Expected: PASS。

- [ ] **Step 7: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/app/schemas/content_blocks.py api/app/services/content_blocks.py api/tests/test_content_blocks_service.py
git commit -m "feat: add content block schema and migration core"
```

---

## Task 2: 为 5 种 block 完成迁移、校验与版本写回

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/app/services/content_blocks.py`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/app/models/asset.py`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/app/schemas/asset.py`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/app/api/v1/admin_assets.py`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/app/api/v1/assets.py`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_content_blocks_service.py`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_admin_assets.py`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_assets.py`

- [ ] **Step 1: 写失败测试，旧 stat_card 平铺字段迁移成 `config.stats`**

```python
def test_migrate_legacy_stat_card_flattens_into_stats_array() -> None:
    raw_blocks = [
        {
            "block_id": "stat-1",
            "block_type": "stat_card",
            "label": "ROI",
            "value": "28%",
            "description": "YoY improvement",
        }
    ]

    normalized = normalize_blocks(raw_blocks, asset_schema_version=1)

    assert normalized.blocks[0]["config"]["stats"] == [
        {
            "label": "ROI",
            "value": "28%",
            "description": "YoY improvement",
        }
    ]
```

- [ ] **Step 2: 写失败测试，保存非法 image block 返回标准错误模型**

```python
def test_update_asset_returns_structured_block_errors_for_invalid_image(
    client: TestClient,
    token_headers: dict[str, str],
) -> None:
    create_res = client.post("/api/v1/admin/assets", json=VALID_ASSET_PAYLOAD, headers=token_headers)
    asset_id = create_res.json()["id"]

    payload = {
        **VALID_ASSET_PAYLOAD,
        "content_schema_version": 1,
        "content_blocks": [
            {
                "id": "img-1",
                "type": "image",
                "version": 1,
                "order": 0,
                "visible": True,
                "config": {"src": "https://example.com/a.png", "alt": "", "caption": ""},
            }
        ],
    }
    res = client.put(f"/api/v1/admin/assets/{asset_id}", json=payload, headers=token_headers)

    assert res.status_code == 422
    assert res.json()["detail"]["code"] == "content_block_validation_failed"
    assert res.json()["detail"]["errors"][0]["block_id"] == "img-1"
    assert res.json()["detail"]["errors"][0]["field"] == "config.alt"
```

- [ ] **Step 3: 运行测试确认失败**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_content_blocks_service.py tests/test_admin_assets.py tests/test_assets.py -q
```

Expected: FAIL，因为 block 校验规则、版本字段和错误模型还未完整实现。

- [ ] **Step 4: 在资产模型和 schema 中加入资产级版本**

```python
# app/models/asset.py
content_schema_version: Mapped[int] = mapped_column(nullable=False, default=1)


# app/schemas/asset.py
class AssetCreateRequest(BaseModel):
    ...
    content_schema_version: int = 1
    content_blocks: list[dict] = []


class AssetDetail(AssetSummary):
    content_schema_version: int
    content_blocks: list[dict]
    visibility: str
```

- [ ] **Step 5: 为五种 block 补 migration 与 validate 规则**

```python
def _validate_image_block(block: dict) -> list[dict]:
    errors = []
    config = block["config"]
    if not config.get("src", "").strip():
        errors.append(_error(block, "config.src", "Image source is required"))
    if not config.get("alt", "").strip():
        errors.append(_error(block, "config.alt", "Alt text is required"))
    return errors


def _migrate_legacy_text_block(raw_block: dict, index: int) -> dict:
    return {
        "id": raw_block.get("block_id") or raw_block.get("id") or f"block-{index}",
        "type": "text",
        "version": 2,
        "order": raw_block.get("order", index),
        "visible": raw_block.get("visible", True),
        "config": {
            "markdown": raw_block.get("content") or raw_block.get("text") or "",
            "html": "",
        },
    }
```

- [ ] **Step 6: 在读写接口接入版本写回与标准错误**

```python
# app/api/v1/admin_assets.py
from app.services.content_blocks import ContentBlockValidationError, normalize_blocks


def _to_detail(asset: Asset) -> dict:
    normalized = normalize_blocks(asset.content_blocks or [], asset.content_schema_version)
    return {
        ...
        "content_schema_version": normalized.asset_schema_version,
        "content_blocks": normalized.blocks,
    }


@router.put("/{asset_id}")
def update_asset(...):
    ...
    try:
        normalized = normalize_blocks(payload.content_blocks, payload.content_schema_version)
    except ContentBlockValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "content_block_validation_failed",
                "message": "One or more content blocks are invalid",
                "errors": exc.errors,
            },
        )
    asset.content_schema_version = normalized.asset_schema_version
    asset.content_blocks = normalized.blocks
```

- [ ] **Step 7: 运行测试确认通过**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_content_blocks_service.py tests/test_admin_assets.py tests/test_assets.py -q
```

Expected: PASS。

- [ ] **Step 8: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/app/models/asset.py api/app/schemas/asset.py api/app/api/v1/admin_assets.py api/app/api/v1/assets.py api/app/services/content_blocks.py api/tests/test_content_blocks_service.py api/tests/test_admin_assets.py api/tests/test_assets.py
git commit -m "feat: validate and persist versioned content blocks"
```

---

## Task 3: 升级前端 block 类型与 asset editor 读写合同

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/admin-content-blocks.ts`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/admin-asset-editor.ts`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/admin-asset-editor.test.ts`

- [ ] **Step 1: 写失败测试，`parseAssetToDraft` 能读取最新 block 结构**

```ts
it("parses latest versioned content blocks into the draft", () => {
  const draft = parseAssetToDraft({
    slug: "demo",
    title: "Demo",
    short_description: "desc",
    asset_type: "solution",
    status: "draft",
    visibility: "public",
    content_schema_version: 2,
    content_blocks: [
      {
        id: "text-1",
        type: "text",
        version: 2,
        order: 0,
        visible: true,
        config: { markdown: "Hello", html: "" },
      },
    ],
  });

  expect(draft.contentSchemaVersion).toBe(2);
  expect(draft.contentBlocks[0]).toEqual({
    id: "text-1",
    type: "text",
    version: 2,
    order: 0,
    visible: true,
    config: { markdown: "Hello", html: "" },
  });
});
```

- [ ] **Step 2: 写失败测试，`buildPayload` 保留 block wrapper 和版本**

```ts
it("builds payload with content schema version and full block wrapper", () => {
  const payload = buildPayload({
    ...INITIAL_DRAFT,
    contentSchemaVersion: 2,
    contentBlocks: [
      {
        id: "callout-1",
        type: "callout",
        version: 2,
        order: 0,
        visible: true,
        config: { title: "Heads up", content: "Test", tone: "info" },
      },
    ],
  });

  expect(payload.content_schema_version).toBe(2);
  expect(payload.content_blocks[0]).toEqual({
    id: "callout-1",
    type: "callout",
    version: 2,
    order: 0,
    visible: true,
    config: { title: "Heads up", content: "Test", tone: "info" },
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run test -- src/lib/admin-asset-editor.test.ts
```

Expected: FAIL，因为当前 draft 仍在使用旧 `block_type / block_id` payload。

- [ ] **Step 4: 升级 draft 和 payload 类型**

```ts
// src/lib/admin-asset-editor.ts
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
  contentSchemaVersion: number;
  contentBlocks: ContentBlock[];
};

export const INITIAL_DRAFT: AssetEditorDraft = {
  ...
  contentSchemaVersion: 2,
  contentBlocks: [],
};
```

- [ ] **Step 5: 去掉旧 block 解析分支，统一使用 wrapper + config**

```ts
function parseContentBlocks(raw: unknown): ContentBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const block = item as Record<string, unknown>;
      if (typeof block.id !== "string" || typeof block.type !== "string") return null;
      return {
        id: block.id,
        type: block.type as ContentBlock["type"],
        version: typeof block.version === "number" ? block.version : 1,
        order: typeof block.order === "number" ? block.order : 0,
        visible: typeof block.visible === "boolean" ? block.visible : true,
        config: typeof block.config === "object" && block.config !== null ? block.config as ContentBlock["config"] : {},
      } as ContentBlock;
    })
    .filter((block): block is ContentBlock => block !== null);
}
```

- [ ] **Step 6: 运行测试确认通过**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run test -- src/lib/admin-asset-editor.test.ts
```

Expected: PASS。

- [ ] **Step 7: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/lib/admin-content-blocks.ts web/src/lib/admin-asset-editor.ts web/src/lib/admin-asset-editor.test.ts
git commit -m "feat: align asset editor with versioned block schema"
```

---

## Task 4: 添加前端错误映射 helper 与编辑器错误展示

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/content-block-errors.ts`
- Create: `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/content-block-errors.test.ts`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/content-block-editor.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/block-list.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/text-block-editor.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/stat-card-block-editor.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/image-block-editor.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/code-snippet-block-editor.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/callout-block-editor.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/content-block-editor.test.tsx`

- [ ] **Step 1: 写 helper 失败测试，按 blockId 分组错误**

```ts
import { groupBlockErrors, getFieldError } from "./content-block-errors";

it("groups backend validation errors by block id", () => {
  const grouped = groupBlockErrors([
    { blockId: "image-1", blockType: "image", field: "config.alt", message: "Alt text is required" },
    { blockId: "image-1", blockType: "image", field: "config.src", message: "Image source is required" },
  ]);

  expect(grouped["image-1"]).toHaveLength(2);
  expect(getFieldError(grouped["image-1"], "config.alt")).toBe("Alt text is required");
});
```

- [ ] **Step 2: 写编辑器失败测试，保存错误会出现在顶部摘要和 block 上**

```tsx
it("renders summary and block error state from backend validation errors", () => {
  render(
    <ContentBlockEditor
      blocks={[
        {
          id: "image-1",
          type: "image",
          version: 2,
          order: 0,
          visible: true,
          config: { src: "", alt: "", caption: "" },
        },
      ]}
      errors={[
        { blockId: "image-1", blockType: "image", field: "config.alt", message: "Alt text is required" },
      ]}
      onChange={vi.fn()}
    />
  );

  expect(screen.getByText(/1 个内容块存在 1 个字段错误/)).toBeInTheDocument();
  expect(screen.getByTestId("block-error-image-1")).toBeInTheDocument();
});
```

- [ ] **Step 3: 运行测试确认失败**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run test -- src/lib/content-block-errors.test.ts src/components/admin/content-blocks/content-block-editor.test.tsx
```

Expected: FAIL，因为 helper 和错误展示 props 还不存在。

- [ ] **Step 4: 实现 helper**

```ts
// src/lib/content-block-errors.ts
export type BlockFieldError = {
  blockId: string;
  blockType: string;
  field: string;
  message: string;
};

export type BlockErrorMap = Record<string, BlockFieldError[]>;

export function groupBlockErrors(errors: BlockFieldError[]): BlockErrorMap {
  return errors.reduce<BlockErrorMap>((acc, error) => {
    acc[error.blockId] = [...(acc[error.blockId] ?? []), error];
    return acc;
  }, {});
}

export function getFieldError(errors: BlockFieldError[] | undefined, fieldPath: string) {
  return errors?.find((error) => error.field === fieldPath)?.message ?? null;
}
```

- [ ] **Step 5: 在编辑器中接入摘要、block 锚点和字段错误 props**

```tsx
// src/components/admin/content-blocks/content-block-editor.tsx
interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  token?: string;
  errors?: BlockFieldError[];
}

const errorsByBlockId = useMemo(() => groupBlockErrors(errors ?? []), [errors]);
const totalFieldErrors = errors?.length ?? 0;
const totalBlocksWithErrors = Object.keys(errorsByBlockId).length;
```

- [ ] **Step 6: 字段编辑后局部清除错误**

```tsx
const handleBlockConfigChange = (blockId: string, newConfig: BlockConfig) => {
  clearErrorsForBlockField?.(blockId);
  const updated = blocks.map((b) => (b.id === blockId ? { ...b, config: newConfig } : b));
  onChange(updated);
};
```

- [ ] **Step 7: 运行测试确认通过**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run test -- src/lib/content-block-errors.test.ts src/components/admin/content-blocks/content-block-editor.test.tsx
```

Expected: PASS。

- [ ] **Step 8: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/lib/content-block-errors.ts web/src/lib/content-block-errors.test.ts web/src/components/admin/content-blocks/
git commit -m "feat: show structured content block validation errors"
```

---

## Task 5: 把后端错误模型接入资产保存链路并做全量回归

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/[id]/edit/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/new/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/asset-editor-form.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/lib/admin.ts`
- Verify: `/Users/weiwei.g.zhang/Documents/hsah/api/tests/`
- Verify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/`

- [ ] **Step 1: 写失败测试，保存非法 block 时把后端错误传进 editor**

```tsx
it("passes backend block errors into the content block editor after failed save", async () => {
  vi.mocked(updateAsset).mockResolvedValue({
    ok: false,
    status: 422,
    data: {
      detail: {
        code: "content_block_validation_failed",
        errors: [
          {
            block_id: "image-1",
            block_type: "image",
            field: "config.alt",
            message: "Alt text is required",
          },
        ],
      },
    },
    message: "validation failed",
  });

  render(<AssetEditorForm ... />);
  await userEvent.click(screen.getByRole("button", { name: /save/i }));

  expect(screen.getByText("Alt text is required")).toBeInTheDocument();
});
```

- [ ] **Step 2: 在保存链路中解析标准错误模型**

```ts
function parseBlockErrors(data: unknown): BlockFieldError[] {
  const detail = isAdminRecord(data) && isAdminRecord(data.detail) ? data.detail : null;
  const errors = detail && Array.isArray(detail.errors) ? detail.errors : [];
  return errors
    .map((item) => {
      if (!isAdminRecord(item)) return null;
      if (typeof item.block_id !== "string" || typeof item.field !== "string" || typeof item.message !== "string") {
        return null;
      }
      return {
        blockId: item.block_id,
        blockType: typeof item.block_type === "string" ? item.block_type : "unknown",
        field: item.field,
        message: item.message,
      };
    })
    .filter((item): item is BlockFieldError => item !== null);
}
```

- [ ] **Step 3: 把错误注入 `AssetEditorForm` 和 `ContentBlockEditor`**

```tsx
const [blockErrors, setBlockErrors] = useState<BlockFieldError[]>([]);

<ContentBlockEditor
  blocks={draft.contentBlocks}
  onChange={(blocks) => setDraft((prev) => ({ ...prev, contentBlocks: blocks }))}
  token={token}
  errors={blockErrors}
/>
```

- [ ] **Step 4: 运行前端保存链路测试**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run test -- src/components/admin/asset-editor-form.test.tsx src/components/admin/content-blocks/content-block-editor.test.tsx src/lib/admin-asset-editor.test.ts
```

Expected: PASS。

- [ ] **Step 5: 运行全量回归**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest -q

cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run lint
npm run test
npm run build
```

Expected: 全部通过。

- [ ] **Step 6: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/ web/
git commit -m "feat: complete phase 9 content block schema upgrade"
```

---

## Self-Review

- Spec coverage: 已覆盖后端 schema 真相源、双层 version、读取时迁移、5 种 block 目标结构、结构化错误模型、编辑器错误映射与全量回归。
- Placeholder scan: 无 `TBD`、`TODO`、`implement later`、`Similar to Task` 之类占位内容。
- Type consistency: 统一使用 `content_schema_version`、`version`、`id/type/order/visible/config`、`block_id/block_type/field/message` 作为后端错误与前端映射合同。
