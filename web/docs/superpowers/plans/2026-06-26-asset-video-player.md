# Asset 多视频内嵌播放器与管理实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将详情页视频能力从单一跳转链接升级为多视频结构化列表 + 内嵌播放器 + Admin 管理全链路。

**Architecture:** 沿用 `shared_fields` JSON 字段承载 `videos` 数组，不新增数据库表；前端新增独立 `AssetVideoManager` 管理组件和 `AssetVideoPlayer` 播放器组件，通过现有 `AssetEditorForm` 和 `AssetDetailView` 集成。

**Tech Stack:** TypeScript, React 19, Next.js App Router, Python 3.14, FastAPI, Pydantic v2, SQLAlchemy

---

## 文件结构

### 会新建的文件
| 路径 | 职责 |
|------|------|
| `web/src/components/admin/asset-video-manager.tsx` | Admin 视频条目管理器：列表卡片、新增/删除/设主视频/编辑字段 |
| `web/src/components/admin/asset-video-manager.test.tsx` | 视频管理器单元测试 |
| `web/src/components/asset-video-player.tsx` | 前台内嵌视频播放器：主播放区 + 视频列表切换 |
| `web/src/components/asset-video-player.test.tsx` | 视频播放器单元测试 |
| `api/tests/test_asset_videos_schema.py` | 后端视频 schema、写入校验、兼容返回测试 |

### 会修改的文件
| 路径 | 变更范围 |
|------|----------|
| `api/app/schemas/asset.py` | 新增 `AssetVideoItem`，扩展 `SharedAssetFields.videos`，扩展 `AssetCreateRequest.shared_fields` |
| `api/app/api/v1/assets.py` | `_normalize_shared_fields` 兼容旧 `demo_video_url` 生成 legacy 视频对象 |
| `api/app/api/v1/admin_assets.py` | `_to_detail` 返回包含 `videos`；写入校验主视频唯一性 |
| `api/app/scripts/seed_assets.py` | `shared_fields` 新增 `videos` 数组样例数据 |
| `api/tests/test_seed_assets.py` | 补充 seed 视频字段断言 |
| `api/tests/test_assets.py` | 补充公开接口返回 `videos` 断言 |
| `api/tests/test_admin_assets.py` | 补充 admin 写入视频校验断言 |
| `web/src/lib/admin-asset-editor.ts` | `AssetEditorDraft` 扩展 `videos` 字段，`buildPayload` / `parseAssetToDraft` / `areDraftsEqual` / `INITIAL_DRAFT` 全链路更新 |
| `web/src/lib/admin-asset-editor.test.ts` | 补充视频相关 payload/parse/diff 测试 |
| `web/src/components/admin/asset-editor-form.tsx` | 引入 `AssetVideoManager` 替换单个 demo 视频输入框 |
| `web/src/components/admin/asset-editor-form.test.tsx` | 补充视频管理器集成测试 |
| `web/src/components/asset-detail-view.tsx` | `AssetDetailViewProps` 新增 `videos`，引入 `AssetVideoPlayer` 渲染 |
| `web/src/components/asset-detail-view.test.tsx` | 补充视频播放器渲染测试 |
| `web/src/components/public-asset-detail-client.tsx` | 传递 `videos` 到 `AssetDetailView` |
| `web/src/components/public-asset-detail-client.test.tsx` | 补充 videos 传递测试 |
| `web/src/lib/public-assets.ts` | `PublicAssetDetail.shared_fields` 类型新增 `videos` |
| `web/src/lib/public-assets.test.ts` | 补充 videos 类型测试 |

---

## Task 1: 后端 — 新增 `AssetVideoItem` Schema 并扩展 `SharedAssetFields`

**Files:**
- Modify: `api/app/schemas/asset.py`
- Create: `api/tests/test_asset_videos_schema.py`

- [ ] **Step 1: 编写后端视频 schema 测试**

```python
# api/tests/test_asset_videos_schema.py
from app.schemas.asset import AssetVideoItem, SharedAssetFields, AssetCreateRequest


def test_asset_video_item_defaults():
    item = AssetVideoItem(id="v1", title="Demo", video_url="https://example.com/v.mp4")
    assert item.poster_url is None
    assert item.description == ""
    assert item.is_primary is False


def test_asset_video_item_with_all_fields():
    item = AssetVideoItem(
        id="v1",
        title="Architecture Walkthrough",
        video_url="https://example.com/v.mp4",
        poster_url="https://example.com/poster.jpg",
        description="High-level overview of the mesh architecture.",
        is_primary=True,
    )
    assert item.is_primary is True
    assert item.poster_url == "https://example.com/poster.jpg"


def test_shared_asset_fields_includes_videos():
    data = {
        "introduction": "Intro",
        "use_cases": ["uc1"],
        "demo_video_url": "https://example.com/old.mp4",
        "live_demo_url": "https://example.com/live",
        "videos": [
            {"id": "v1", "title": "Main", "video_url": "https://example.com/v1.mp4", "is_primary": True},
            {"id": "v2", "title": "Alt", "video_url": "https://example.com/v2.mp4", "is_primary": False},
        ],
    }
    parsed = SharedAssetFields.model_validate(data)
    assert len(parsed.videos) == 2
    assert parsed.videos[0].is_primary is True
    assert parsed.videos[1].title == "Alt"


def test_shared_asset_fields_videos_default_empty():
    parsed = SharedAssetFields.model_validate({"introduction": "x"})
    assert parsed.videos == []


def test_asset_create_request_accepts_videos_in_shared_fields():
    payload = AssetCreateRequest(
        slug="test-slug",
        title="Test",
        short_description="desc",
        asset_type="solution",
        status="draft",
        visibility="public",
        shared_fields={
            "videos": [{"id": "v1", "title": "T", "video_url": "https://example.com/v.mp4"}],
        },
    )
    assert len(payload.shared_fields.videos) == 1
    assert payload.shared_fields.videos[0].id == "v1"
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/test_asset_videos_schema.py -v
```

预期：`FAIL` — `AssetVideoItem` 未定义。

- [ ] **Step 3: 在 `api/app/schemas/asset.py` 中实现 `AssetVideoItem` 并扩展 `SharedAssetFields`**

在 `SharedAssetFields` 类定义之前新增：

```python
class AssetVideoItem(BaseModel):
    id: str
    title: str = Field(..., min_length=1, max_length=160)
    video_url: str = Field(..., min_length=1, max_length=1000)
    poster_url: str | None = Field(None, max_length=1000)
    description: str = Field(default="", max_length=500)
    is_primary: bool = False
```

将 `SharedAssetFields` 修改为：

```python
class SharedAssetFields(BaseModel):
    introduction: str = ""
    use_cases: list[str] = Field(default_factory=list)
    demo_video_url: str | None = None
    live_demo_url: str | None = None
    videos: list[AssetVideoItem] = Field(default_factory=list)
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/test_asset_videos_schema.py -v
```

预期：`4 passed`。

- [ ] **Step 5: 运行全量后端测试确认无回归**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/ -x -q
```

预期：全部通过。

- [ ] **Step 6: 提交**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/app/schemas/asset.py api/tests/test_asset_videos_schema.py
git commit -m "feat(api): add AssetVideoItem schema and extend SharedAssetFields with videos"
```

---

## Task 2: 后端 — 写入校验与兼容返回

**Files:**
- Modify: `api/app/api/v1/assets.py`
- Modify: `api/app/api/v1/admin_assets.py`
- Modify: `api/tests/test_assets.py`
- Modify: `api/tests/test_admin_assets.py`

- [ ] **Step 1: 编写兼容返回测试**

在 `api/tests/test_assets.py` 末尾追加：

```python
def test_get_asset_returns_videos_in_shared_fields(client, published_public_asset):
    """公开详情接口在 shared_fields 中返回 videos 数组。"""
    resp = client.get(f"/api/v1/assets/{published_public_asset.slug}")
    assert resp.status_code == 200
    body = resp.json()
    assert "videos" in body["shared_fields"]
    assert isinstance(body["shared_fields"]["videos"], list)


def test_get_asset_legacy_demo_video_becomes_videos(client, published_public_asset):
    """当 assets 只有 demo_video_url 且无 videos 时，接口自动构造兼容视频对象。"""
    import sqlalchemy.orm as orm

    from app.core.db import SessionLocal
    from app.models.asset import Asset

    with SessionLocal() as db:
        asset = db.scalar(select(Asset).where(Asset.slug == published_public_asset.slug))
        sf = dict(asset.shared_fields or {})
        sf.pop("videos", None)
        sf["demo_video_url"] = "https://example.com/legacy.mp4"
        asset.shared_fields = sf
        db.commit()

    resp = client.get(f"/api/v1/assets/{published_public_asset.slug}")
    assert resp.status_code == 200
    videos = resp.json()["shared_fields"]["videos"]
    assert len(videos) == 1
    assert videos[0]["video_url"] == "https://example.com/legacy.mp4"
    assert videos[0]["is_primary"] is True
    assert videos[0]["id"] == "legacy-demo-video"
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/test_assets.py -v -k "videos"
```

预期：`FAIL` — `shared_fields` 中无 `videos`。

- [ ] **Step 3: 修改 `api/app/api/v1/assets.py` 的 `_normalize_shared_fields` 增加兼容逻辑**

将 `_normalize_shared_fields` 函数替换为：

```python
def _normalize_shared_fields(asset: Asset) -> dict:
    validated = SharedAssetFields.model_validate(asset.shared_fields or {})
    data = validated.model_dump(exclude_defaults=True, exclude_none=True)
    videos = data.get("videos") or []
    if not videos and data.get("demo_video_url"):
        videos = [
            {
                "id": "legacy-demo-video",
                "title": "Demo video",
                "video_url": data["demo_video_url"],
                "poster_url": None,
                "description": "",
                "is_primary": True,
            }
        ]
    data["videos"] = videos
    return data
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/test_assets.py -v -k "videos"
```

预期：通过。

- [ ] **Step 5: 编写写入校验测试**

在 `api/tests/test_admin_assets.py` 末尾追加：

```python
def test_create_asset_with_multiple_primary_videos_returns_422(admin_client):
    """同一 asset 不允许有多个主视频。"""
    resp = admin_client.post(
        "/api/v1/admin/assets",
        json={
            "slug": "multi-primary-test",
            "title": "Multi Primary",
            "short_description": "desc",
            "asset_type": "solution",
            "status": "draft",
            "visibility": "public",
            "shared_fields": {
                "videos": [
                    {"id": "v1", "title": "A", "video_url": "https://example.com/a.mp4", "is_primary": True},
                    {"id": "v2", "title": "B", "video_url": "https://example.com/b.mp4", "is_primary": True},
                ],
            },
        },
    )
    assert resp.status_code == 422


def test_create_asset_with_videos_auto_sets_primary(admin_client):
    """当提交的视频列表无主视频时，服务端自动将第一条设为主视频。"""
    resp = admin_client.post(
        "/api/v1/admin/assets",
        json={
            "slug": "auto-primary-test",
            "title": "Auto Primary",
            "short_description": "desc",
            "asset_type": "solution",
            "status": "draft",
            "visibility": "public",
            "shared_fields": {
                "videos": [
                    {"id": "v1", "title": "A", "video_url": "https://example.com/a.mp4", "is_primary": False},
                    {"id": "v2", "title": "B", "video_url": "https://example.com/b.mp4", "is_primary": False},
                ],
            },
        },
    )
    assert resp.status_code in (200, 201)
    videos = resp.json()["shared_fields"]["videos"]
    primaries = [v for v in videos if v["is_primary"]]
    assert len(primaries) == 1
    assert primaries[0]["id"] == "v1"
```

- [ ] **Step 6: 运行测试验证失败**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/test_admin_assets.py -v -k "videos"
```

预期：`FAIL` — 无主视频校验逻辑。

- [ ] **Step 7: 在 `admin_assets.py` 的 `create_asset` 和 `update_asset` 中增加主视频校验**

在 `api/app/api/v1/admin_assets.py` 文件顶部（`router = ...` 之后）新增辅助函数：

```python
def _validate_and_normalize_videos(shared_fields: dict) -> None:
    videos = shared_fields.get("videos") or []
    if not videos:
        return
    primaries = [v for v in videos if v.get("is_primary")]
    if len(primaries) > 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "multiple_primary_videos", "message": "Only one video can be marked as primary"},
        )
    if len(primaries) == 0:
        videos[0]["is_primary"] = True
```

在 `create_asset` 函数的 `asset_data = payload.model_dump()` 之前插入：

```python
    _validate_and_normalize_videos(payload.shared_fields.model_dump())
```

在 `update_asset` 函数的 `payload_data = payload.model_dump()` 之前插入：

```python
    _validate_and_normalize_videos(payload.shared_fields.model_dump())
```

- [ ] **Step 8: 运行写入校验测试**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/test_admin_assets.py -v -k "videos"
```

预期：通过。

- [ ] **Step 9: 运行全量后端测试**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/ -x -q
```

预期：全部通过。

- [ ] **Step 10: 提交**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/app/api/v1/assets.py api/app/api/v1/admin_assets.py api/tests/test_assets.py api/tests/test_admin_assets.py
git commit -m "feat(api): add video validation, primary enforcement, and legacy demo_video_url compatibility"
```

---

## Task 3: 后端 — Seed 数据补充视频样例

**Files:**
- Modify: `api/app/scripts/seed_assets.py`
- Modify: `api/tests/test_seed_assets.py`

- [ ] **Step 1: 编写 seed 视频断言**

在 `api/tests/test_seed_assets.py` 的 `test_seed_assets_upserts_complete_public_sample_asset` 函数末尾追加：

```python
    assert "videos" in asset.shared_fields
    assert len(asset.shared_fields["videos"]) >= 2
    primaries = [v for v in asset.shared_fields["videos"] if v.get("is_primary")]
    assert len(primaries) == 1
    assert primaries[0]["title"] == "Agentic Service Mesh Overview"
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/test_seed_assets.py -v
```

预期：`FAIL` — `shared_fields` 中无 `videos`。

- [ ] **Step 3: 在 `api/app/scripts/seed_assets.py` 的 `SAMPLE_ASSET["shared_fields"]` 中新增 `videos`**

将 `shared_fields` 字典替换为：

```python
    "shared_fields": {
        "introduction": "A productized reference asset that helps client teams evaluate, demo, and deliver a governed AI agent runtime on Kubernetes.",
        "use_cases": ["customer-service copilots", "field-ops assistants", "knowledge-grounded agents"],
        "demo_video_url": "https://example.com/videos/agentic-service-mesh-demo.mp4",
        "live_demo_url": "https://example.com/demos/agentic-service-mesh",
        "videos": [
            {
                "id": "overview-video",
                "title": "Agentic Service Mesh Overview",
                "video_url": "https://example.com/videos/agentic-service-mesh-demo.mp4",
                "poster_url": "https://example.com/images/agentic-service-mesh-poster.jpg",
                "description": "A 5-minute walkthrough of the reference architecture, including mesh routing, policy guardrails, and observability.",
                "is_primary": True,
            },
            {
                "id": "deep-dive-video",
                "title": "Deployment Deep Dive",
                "video_url": "https://example.com/videos/agentic-service-mesh-deployment.mp4",
                "poster_url": None,
                "description": "Step-by-step deployment guide for provisioning the agent runtime across EKS, AKS, and GKE.",
                "is_primary": False,
            },
        ],
    },
```

- [ ] **Step 4: 运行 seed 测试验证通过**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/test_seed_assets.py -v
```

预期：通过。

- [ ] **Step 5: 运行全量后端测试**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/ -x -q
```

预期：全部通过。

- [ ] **Step 6: 提交**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/app/scripts/seed_assets.py api/tests/test_seed_assets.py
git commit -m "feat(api): add sample videos to seed data"
```

---

## Task 4: 前端 — 扩展 Admin Editor Draft 全链路

**Files:**
- Modify: `web/src/lib/admin-asset-editor.ts`
- Modify: `web/src/lib/admin-asset-editor.test.ts`

- [ ] **Step 1: 编写 Draft 视频相关测试**

在 `web/src/lib/admin-asset-editor.test.ts` 末尾追加：

```typescript
describe("asset videos in draft", () => {
  it("buildPayload includes videos in shared_fields", () => {
    const draft: AssetEditorDraft = {
      ...INITIAL_DRAFT,
      slug: "test-slug",
      title: "Test",
      shortDescription: "desc",
      sharedFields: {
        ...INITIAL_DRAFT.sharedFields,
        videos: [
          {
            id: "v1",
            title: "Overview",
            videoUrl: "https://example.com/v.mp4",
            posterUrl: "https://example.com/poster.jpg",
            description: "desc text",
            isPrimary: true,
          },
        ],
      },
    };
    const payload = buildPayload(draft);
    expect(payload.shared_fields.videos).toHaveLength(1);
    expect(payload.shared_fields.videos[0].id).toBe("v1");
    expect(payload.shared_fields.videos[0].is_primary).toBe(true);
  });

  it("parseAssetToDraft maps shared_fields.videos correctly", () => {
    const raw = {
      slug: "s",
      title: "t",
      short_description: "d",
      asset_type: "solution",
      status: "draft",
      visibility: "public",
      shared_fields: {
        videos: [
          {
            id: "v1",
            title: "V",
            video_url: "https://example.com/v.mp4",
            poster_url: null,
            description: "",
            is_primary: true,
          },
        ],
      },
    };
    const draft = parseAssetToDraft(raw);
    expect(draft.sharedFields.videos).toHaveLength(1);
    expect(draft.sharedFields.videos[0].videoUrl).toBe("https://example.com/v.mp4");
    expect(draft.sharedFields.videos[0].isPrimary).toBe(true);
  });

  it("parseAssetToDraft defaults videos to empty array when missing", () => {
    const raw = {
      slug: "s",
      title: "t",
      short_description: "d",
      asset_type: "solution",
      status: "draft",
      visibility: "public",
    };
    const draft = parseAssetToDraft(raw);
    expect(draft.sharedFields.videos).toEqual([]);
  });

  it("areDraftsEqual detects video list changes", () => {
    const a: AssetEditorDraft = {
      ...INITIAL_DRAFT,
      sharedFields: {
        ...INITIAL_DRAFT.sharedFields,
        videos: [{ id: "v1", title: "T", videoUrl: "https://example.com/v.mp4", posterUrl: "", description: "", isPrimary: true }],
      },
    };
    const b: AssetEditorDraft = {
      ...INITIAL_DRAFT,
      sharedFields: {
        ...INITIAL_DRAFT.sharedFields,
        videos: [],
      },
    };
    expect(areDraftsEqual(a, b)).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npx vitest run src/lib/admin-asset-editor.test.ts
```

预期：`FAIL` — `videos` 字段不在类型中。

- [ ] **Step 3: 修改 `web/src/lib/admin-asset-editor.ts`**

**3a. 新增 `AssetVideoDraft` 类型：** 在 `AssetEditorDraft` 类型定义之前新增：

```typescript
export type AssetVideoDraft = {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl: string;
  description: string;
  isPrimary: boolean;
};
```

**3b. 在 `AssetEditorDraft.sharedFields` 中新增 `videos`：**

```typescript
  sharedFields: {
    introduction: string;
    useCases: string[];
    demoVideoUrl: string;
    liveDemoUrl: string;
    videos: AssetVideoDraft[];
  };
```

**3c. 在 `INITIAL_DRAFT.sharedFields` 中新增 `videos: []`：**

```typescript
  sharedFields: {
    introduction: "",
    useCases: [],
    demoVideoUrl: "",
    liveDemoUrl: "",
    videos: [],
  },
```

**3d. 在 `buildPayload` 的 `shared_fields` 对象中新增 `videos`：** 在 `live_demo_url` 行之后新增：

```typescript
      videos: draft.sharedFields.videos.map((v) => ({
        id: v.id,
        title: v.title.trim(),
        video_url: v.videoUrl.trim(),
        poster_url: v.posterUrl.trim() || null,
        description: v.description.trim(),
        is_primary: v.isPrimary,
      })),
```

**3e. 在 `parseAssetToDraft` 的 `sharedFields` 中新增 `videos` 映射：** 在 `liveDemoUrl` 之后新增：

```typescript
      videos: Array.isArray(sharedFields.videos)
        ? (sharedFields.videos as Array<Record<string, unknown>>).map((v) => ({
            id: typeof v.id === "string" ? v.id : crypto.randomUUID(),
            title: typeof v.title === "string" ? v.title : "",
            videoUrl: typeof v.video_url === "string" ? v.video_url : "",
            posterUrl: typeof v.poster_url === "string" ? v.poster_url : "",
            description: typeof v.description === "string" ? v.description : "",
            isPrimary: Boolean(v.is_primary),
          }))
        : [],
```

**3f. 在 `areDraftsEqual` 中让 `videos` 走深度比较：** 将 `contentBlocks` 的深度比较分支扩展为同时覆盖 `videos`：

```typescript
      if (key === "contentBlocks" || key === "videos") {
        return JSON.stringify(va) === JSON.stringify(vb);
      }
```

（注意：`areDraftsEqual` 中现有的条件是 `if (key === "contentBlocks")`，改为 `if (key === "contentBlocks" || key === "videos")`）

- [ ] **Step 4: 运行测试验证通过**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npx vitest run src/lib/admin-asset-editor.test.ts
```

预期：全部通过。

- [ ] **Step 5: 提交**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/lib/admin-asset-editor.ts web/src/lib/admin-asset-editor.test.ts
git commit -m "feat(web): extend admin editor draft with videos field"
```

---

## Task 5: 前端 — 创建 Admin 视频管理器组件

**Files:**
- Create: `web/src/components/admin/asset-video-manager.tsx`
- Create: `web/src/components/admin/asset-video-manager.test.tsx`

- [ ] **Step 1: 编写视频管理器测试**

```tsx
// web/src/components/admin/asset-video-manager.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AssetVideoManager } from "./asset-video-manager";
import type { AssetVideoDraft } from "@/lib/admin-asset-editor";

const baseVideo: AssetVideoDraft = {
  id: "v1",
  title: "Overview",
  videoUrl: "https://example.com/v.mp4",
  posterUrl: "",
  description: "desc",
  isPrimary: true,
};

describe("AssetVideoManager", () => {
  it("renders empty state with add button when no videos", () => {
    const onChange = vi.fn();
    render(<AssetVideoManager videos={[]} onChange={onChange} />);
    expect(screen.getByText(/新增视频/)).toBeTruthy();
  });

  it("renders video cards with title and url", () => {
    const onChange = vi.fn();
    render(<AssetVideoManager videos={[baseVideo]} onChange={onChange} />);
    expect(screen.getByDisplayValue("Overview")).toBeTruthy();
    expect(screen.getByDisplayValue("https://example.com/v.mp4")).toBeTruthy();
  });

  it("calls onChange with new video when add is clicked", () => {
    const onChange = vi.fn();
    render(<AssetVideoManager videos={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText(/新增视频/));
    expect(onChange).toHaveBeenCalledTimes(1);
    const newVideos = onChange.mock.calls[0][0] as AssetVideoDraft[];
    expect(newVideos).toHaveLength(1);
    expect(newVideos[0].videoUrl).toBe("");
  });

  it("calls onChange without deleted video when remove is clicked", () => {
    const onChange = vi.fn();
    render(<AssetVideoManager videos={[baseVideo]} onChange={onChange} />);
    fireEvent.click(screen.getByText(/删除/));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("sets primary correctly when set-primary is clicked", () => {
    const video2: AssetVideoDraft = { ...baseVideo, id: "v2", title: "Alt", isPrimary: false };
    const onChange = vi.fn();
    const { rerender } = render(
      <AssetVideoManager videos={[baseVideo, video2]} onChange={onChange} />,
    );
    const setPrimaryButtons = screen.getAllByText(/设为主视频/);
    fireEvent.click(setPrimaryButtons[0]);
    const updated = onChange.mock.calls[0][0] as AssetVideoDraft[];
    expect(updated.find((v) => v.id === "v2")?.isPrimary).toBe(true);
    expect(updated.find((v) => v.id === "v1")?.isPrimary).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npx vitest run src/components/admin/asset-video-manager.test.tsx
```

预期：`FAIL` — 组件不存在。

- [ ] **Step 3: 实现 `web/src/components/admin/asset-video-manager.tsx`**

```tsx
"use client";

import { Plus, Trash2, Star } from "lucide-react";
import type { AssetVideoDraft } from "@/lib/admin-asset-editor";

type AssetVideoManagerProps = {
  videos: AssetVideoDraft[];
  onChange: (videos: AssetVideoDraft[]) => void;
};

const inputClass =
  "w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-electric-purple)] focus:outline-none";

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function createEmptyVideo(): AssetVideoDraft {
  return {
    id: randomId(),
    title: "",
    videoUrl: "",
    posterUrl: "",
    description: "",
    isPrimary: false,
  };
}

export function AssetVideoManager({ videos, onChange }: AssetVideoManagerProps) {
  function addVideo() {
    const newVideo = createEmptyVideo();
    if (videos.length === 0) {
      newVideo.isPrimary = true;
    }
    onChange([...videos, newVideo]);
  }

  function updateVideo(index: number, patch: Partial<AssetVideoDraft>) {
    const updated = videos.map((v, i) => (i === index ? { ...v, ...patch } : v));
    onChange(updated);
  }

  function removeVideo(index: number) {
    const removed = videos[index];
    const remaining = videos.filter((_, i) => i !== index);
    if (removed.isPrimary && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isPrimary: true };
    }
    onChange(remaining);
  }

  function setPrimary(index: number) {
    onChange(
      videos.map((v, i) => ({
        ...v,
        isPrimary: i === index,
      })),
    );
  }

  return (
    <div className="space-y-4">
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="rounded-xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/50%)] p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {video.isPrimary ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-electric-purple)]/20 px-2 py-0.5 text-xs font-medium text-[var(--color-electric-purple)]">
                  <Star className="size-3 fill-current" />
                  主视频
                </span>
              ) : (
                <span className="text-xs text-[var(--color-text-tertiary)]">视频 #{index + 1}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!video.isPrimary && (
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  className="rounded-md border border-[rgb(212_218_245_/12%)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-white/5"
                >
                  设为主视频
                </button>
              )}
              <button
                type="button"
                onClick={() => removeVideo(index)}
                className="rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="size-3 inline mr-1" />
                删除
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">标题</label>
              <input
                className={inputClass}
                value={video.title}
                onChange={(e) => updateVideo(index, { title: e.target.value })}
                placeholder="视频标题"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">视频链接</label>
              <input
                className={inputClass}
                value={video.videoUrl}
                onChange={(e) => updateVideo(index, { videoUrl: e.target.value })}
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">封面链接</label>
              <input
                className={inputClass}
                value={video.posterUrl}
                onChange={(e) => updateVideo(index, { posterUrl: e.target.value })}
                placeholder="https://example.com/poster.jpg（可选）"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">简介</label>
              <input
                className={inputClass}
                value={video.description}
                onChange={(e) => updateVideo(index, { description: e.target.value })}
                placeholder="简短描述（可选）"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addVideo}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[rgb(212_218_245_/20%)] py-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-electric-purple)] hover:text-[var(--color-text-primary)]"
      >
        <Plus className="size-4" />
        新增视频
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npx vitest run src/components/admin/asset-video-manager.test.tsx
```

预期：全部通过。

- [ ] **Step 5: 提交**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/components/admin/asset-video-manager.tsx web/src/components/admin/asset-video-manager.test.tsx
git commit -m "feat(web): add AssetVideoManager component for admin video management"
```

---

## Task 6: 前端 — 集成视频管理器到 AssetEditorForm

**Files:**
- Modify: `web/src/components/admin/asset-editor-form.tsx`

- [ ] **Step 1: 在 `asset-editor-form.tsx` 顶部添加 import**

在现有 imports 中（`ContentBlockEditor` import 之后）新增：

```typescript
import { AssetVideoManager } from "./asset-video-manager";
import type { AssetVideoDraft } from "@/lib/admin-asset-editor";
```

- [ ] **Step 2: 替换 Shared Detail 区块中的 Demo 视频链接输入框**

找到 `asset-editor-form.tsx` 中 "Shared Detail" 卡片里的 `Demo 视频链接` 输入框区块（约 L353-L381），将其替换为：

```tsx
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Live Demo 链接</Label>
              <input
                className={inputClass}
                value={draft.sharedFields.liveDemoUrl}
                onChange={(e) =>
                  updateField("sharedFields", {
                    ...draft.sharedFields,
                    liveDemoUrl: e.target.value,
                  })}
                placeholder="https://example.com/live"
              />
            </div>
          </div>
          <div>
            <Label>视频内容管理</Label>
            <div className="mt-2">
              <AssetVideoManager
                videos={draft.sharedFields.videos}
                onChange={(videos: AssetVideoDraft[]) =>
                  updateField("sharedFields", {
                    ...draft.sharedFields,
                    videos,
                  })}
              />
            </div>
          </div>
```

（即：删除单独的 `Demo 视频链接` `<input>`，保留 `Live Demo 链接`，在下方新增 `AssetVideoManager`。）

- [ ] **Step 3: 运行已有 admin 相关测试确认无回归**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npx vitest run src/components/admin/asset-editor-form.test.tsx src/lib/admin-asset-editor.test.ts
```

预期：全部通过。

- [ ] **Step 4: 提交**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/components/admin/asset-editor-form.tsx
git commit -m "feat(web): integrate AssetVideoManager into AssetEditorForm"
```

---

## Task 7: 前端 — 创建前台内嵌视频播放器组件

**Files:**
- Create: `web/src/components/asset-video-player.tsx`
- Create: `web/src/components/asset-video-player.test.tsx`

- [ ] **Step 1: 编写视频播放器测试**

```tsx
// web/src/components/asset-video-player.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AssetVideoPlayer } from "./asset-video-player";

const videos = [
  { id: "v1", title: "Overview", videoUrl: "https://example.com/v1.mp4", posterUrl: "https://example.com/poster.jpg", description: "Main walkthrough", isPrimary: true },
  { id: "v2", title: "Deep Dive", videoUrl: "https://example.com/v2.mp4", posterUrl: null, description: "Step by step", isPrimary: false },
];

describe("AssetVideoPlayer", () => {
  it("renders nothing when videos array is empty", () => {
    const { container } = render(<AssetVideoPlayer videos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the primary video by default", () => {
    render(<AssetVideoPlayer videos={videos} />);
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.getByText("Main walkthrough")).toBeTruthy();
  });

  it("falls back to first video when no primary is set", () => {
    const noPrimary = videos.map((v) => ({ ...v, isPrimary: false }));
    render(<AssetVideoPlayer videos={noPrimary} />);
    expect(screen.getByText("Overview")).toBeTruthy();
  });

  it("switches video when a different item is clicked", () => {
    render(<AssetVideoPlayer videos={videos} />);
    fireEvent.click(screen.getByText("Deep Dive"));
    expect(screen.getByText("Step by step")).toBeTruthy();
  });

  it("renders video element with correct src", () => {
    render(<AssetVideoPlayer videos={videos} />);
    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    expect(video?.getAttribute("src")).toBe("https://example.com/v1.mp4");
  });

  it("renders poster attribute when posterUrl is present", () => {
    render(<AssetVideoPlayer videos={videos} />);
    const video = document.querySelector("video");
    expect(video?.getAttribute("poster")).toBe("https://example.com/poster.jpg");
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npx vitest run src/components/asset-video-player.test.tsx
```

预期：`FAIL` — 组件不存在。

- [ ] **Step 3: 实现 `web/src/components/asset-video-player.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type VideoItem = {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl?: string | null;
  description?: string;
  isPrimary?: boolean;
};

type AssetVideoPlayerProps = {
  videos: VideoItem[];
};

export function AssetVideoPlayer({ videos }: AssetVideoPlayerProps) {
  const resolved = videos.length > 0 ? videos : [];
  const defaultIndex = Math.max(
    0,
    resolved.findIndex((v) => v.isPrimary),
  );
  const [activeIndex, setActiveIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);

  if (resolved.length === 0) return null;

  const active = resolved[activeIndex];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="space-y-5">
        <div>
          <div className="text-xs font-medium tracking-[0.14em] text-primary uppercase">Demo video</div>
          <h3 className="mt-2 text-xl font-semibold text-foreground">{active.title}</h3>
          {active.description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{active.description}</p>
          ) : null}
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
          <video
            key={active.id}
            src={active.videoUrl}
            poster={active.posterUrl ?? undefined}
            controls
            preload="metadata"
            className="size-full object-contain"
          />
        </div>

        {resolved.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">All videos</h4>
            <div className="flex flex-col gap-2">
              {resolved.map((video, index) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                    index === activeIndex
                      ? "border-primary bg-primary/8 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Play
                    className={cn(
                      "size-4 shrink-0",
                      index === activeIndex ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{video.title}</div>
                    {video.description ? (
                      <div className="text-xs text-muted-foreground truncate">{video.description}</div>
                    ) : null}
                  </div>
                  {video.isPrimary && (
                    <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary uppercase">
                      Primary
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npx vitest run src/components/asset-video-player.test.tsx
```

预期：全部通过。

- [ ] **Step 5: 提交**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/components/asset-video-player.tsx web/src/components/asset-video-player.test.tsx
git commit -m "feat(web): add AssetVideoPlayer component for inline video playback"
```

---

## Task 8: 前端 — 集成播放器到详情页

**Files:**
- Modify: `web/src/components/asset-detail-view.tsx`
- Modify: `web/src/components/asset-detail-view.test.tsx`
- Modify: `web/src/components/public-asset-detail-client.tsx`
- Modify: `web/src/components/public-asset-detail-client.test.tsx`
- Modify: `web/src/lib/public-assets.ts`
- Modify: `web/src/lib/public-assets.test.ts`

- [ ] **Step 1: 编写详情页视频播放器集成测试**

在 `web/src/components/asset-detail-view.test.tsx` 末尾追加：

```tsx
it("renders video player when videos are provided", () => {
  render(
    <AssetDetailView
      blocks={[]}
      sharedFields={{
        videos: [
          { id: "v1", title: "Overview", videoUrl: "https://example.com/v.mp4", posterUrl: null, description: "desc", isPrimary: true },
        ],
      }}
    />,
  );
  expect(screen.getByText("Demo video")).toBeTruthy();
  expect(screen.getByText("Overview")).toBeTruthy();
});

it("renders no video section when videos is empty", () => {
  const { container } = render(
    <AssetDetailView blocks={[]} sharedFields={{ videos: [] }} />,
  );
  expect(container.textContent).not.toContain("Demo video");
});
```

- [ ] **Step 2: 修改 `web/src/lib/public-assets.ts` 的 `PublicAssetDetail` 类型**

在 `shared_fields` 类型中新增 `videos`：

```typescript
export type PublicAssetDetail = PublicAssetSummary & {
  visibility: string;
  content_blocks: Array<Record<string, unknown>>;
  shared_fields: {
    introduction?: string;
    use_cases?: string[];
    demo_video_url?: string | null;
    live_demo_url?: string | null;
    videos?: Array<{
      id: string;
      title: string;
      video_url: string;
      poster_url?: string | null;
      description?: string;
      is_primary?: boolean;
    }>;
  };
  // ... rest unchanged
```

- [ ] **Step 3: 修改 `web/src/components/asset-detail-view.tsx`**

**3a. 添加 import：** 在文件顶部 `import { ContentBlockRenderer } from ...` 之后新增：

```typescript
import { AssetVideoPlayer, type VideoItem } from "@/components/asset-video-player";
```

**3b. 在 `AssetDetailViewProps` 中新增 `videos`：**

```typescript
  sharedFields?: {
    introduction?: string;
    useCases?: string[];
    demoVideoUrl?: string;
    liveDemoUrl?: string;
    videos?: VideoItem[];
  };
```

**3c. 在 `SharedDetailPanel` 的 `hasContent` 判断中加入 `videos`：**

```typescript
  const hasContent =
    Boolean(sharedFields.introduction) ||
    useCases.length > 0 ||
    Boolean(sharedFields.demoVideoUrl) ||
    Boolean(sharedFields.liveDemoUrl) ||
    (sharedFields.videos && sharedFields.videos.length > 0);
```

**3d. 在 `AssetDetailView` 渲染中 `SharedDetailPanel` 之前插入播放器：**

在两个 return 分支中（`!showDeliveryMode` 分支和主分支），在 `<SharedDetailPanel ... />` 之后、`<SalesDetailPanel ...>` 或模式切换之前，新增：

```tsx
        {sharedFields.videos && sharedFields.videos.length > 0 && (
          <AssetVideoPlayer videos={sharedFields.videos} />
        )}
```

具体地，在 `!showDeliveryMode` 分支（约 L263-L270）改为：

```tsx
      <div className="space-y-6">
        <SharedDetailPanel sharedFields={sharedFields} />
        {sharedFields.videos && sharedFields.videos.length > 0 && (
          <AssetVideoPlayer videos={sharedFields.videos} />
        )}
        <SalesDetailPanel salesFields={salesFields} />
        <ContentBlockRenderer blocks={blocks} mode="sales" />
      </div>
```

在主分支（约 L274-L306）的 `<SharedDetailPanel ... />` 之后、`<section ... View mode ...>` 之前插入同样的条件渲染：

```tsx
      <SharedDetailPanel sharedFields={sharedFields} />
      {sharedFields.videos && sharedFields.videos.length > 0 && (
        <AssetVideoPlayer videos={sharedFields.videos} />
      )}
      <section className="rounded-2xl ...">
```

- [ ] **Step 4: 修改 `web/src/components/public-asset-detail-client.tsx`**

在传递给 `AssetDetailView` 的 `sharedFields` prop 中新增 `videos` 映射：

```tsx
      sharedFields={{
        introduction: sharedFields.introduction,
        useCases: sharedFields.use_cases,
        demoVideoUrl: sharedFields.demo_video_url ?? undefined,
        liveDemoUrl: sharedFields.live_demo_url ?? undefined,
        videos: (sharedFields.videos ?? []).map((v) => ({
          id: v.id,
          title: v.title,
          videoUrl: v.video_url,
          posterUrl: v.poster_url ?? undefined,
          description: v.description ?? undefined,
          isPrimary: v.is_primary ?? undefined,
        })),
      }}
```

- [ ] **Step 5: 运行所有前端测试**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npx vitest run src/components/asset-detail-view.test.tsx src/components/public-asset-detail-client.test.tsx src/components/asset-video-player.test.tsx src/lib/public-assets.test.ts
```

预期：全部通过。

- [ ] **Step 6: 提交**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/components/asset-detail-view.tsx web/src/components/asset-detail-view.test.tsx web/src/components/public-asset-detail-client.tsx web/src/components/public-asset-detail-client.test.tsx web/src/lib/public-assets.ts web/src/lib/public-assets.test.ts
git commit -m "feat(web): integrate AssetVideoPlayer into asset detail page and public client"
```

---

## Task 9: 重建前端、重灌种子、端到端验证

**Files:** 无新增/修改文件，纯验证步骤。

- [ ] **Step 1: 运行全部后端测试**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='sqlite:///./test_asset_videos.db' python -m pytest tests/ -x -q
```

预期：全部通过。

- [ ] **Step 2: 运行全部前端测试**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npx vitest run
```

预期：全部通过。

- [ ] **Step 3: 重建种子数据**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
DATABASE_URL='postgresql+psycopg://postgres:postgres@127.0.0.1:5545/hsah' python -m app.scripts.seed_assets
```

预期：无报错。

- [ ] **Step 4: 重建前端并重启服务**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
PORT=3100 npm run start &
```

- [ ] **Step 5: 用 curl 验证 API 返回 videos**

```bash
curl -s http://127.0.0.1:8000/api/v1/assets/agentic-service-mesh-kubernetes | python -c "import sys,json; d=json.load(sys.stdin); v=d['shared_fields']['videos']; print(f'videos: {len(v)}'); print(f'primary: {v[0][\"title\"]}')"
```

预期：`videos: 2` 和 `primary: Agentic Service Mesh Overview`。

- [ ] **Step 6: 浏览器验证详情页**

打开 `http://localhost:3100/assets/agentic-service-mesh-kubernetes`，确认：
- 页面有内嵌 `<video>` 播放器
- 主视频标题为 "Agentic Service Mesh Overview"
- 下方有视频列表，点击 "Deployment Deep Dive" 可切换播放

- [ ] **Step 7: 提交最终合并**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add -A
git commit -m "feat: complete multi-video player, admin management, and legacy compatibility"
```
