# Phase 3A: Extended Block Types Implementation Plan

> **For agentic workers:** Use subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 new content block types (image, code_snippet, callout) with editor components, image upload API, and asset detail page rendering.

**Architecture:** Extend existing content block type system with new configs and validation. Add backend image upload endpoint with local file storage. Create dedicated editor components for each new type. Extend asset detail page's BlockRenderer for new types.

**Tech Stack:** React 19, TypeScript, FastAPI, SQLAlchemy, Vitest

---

## File Structure

### Backend (New)
```
api/app/
├── api/v1/upload.py              # Image upload endpoint
├── api/v1/router.py              # Register upload router (MODIFY)
└── main.py                       # Mount static files (MODIFY)
```

### Frontend (New)
```
web/src/
├── components/admin/content-blocks/
│   ├── image-block-editor.tsx     # Image block editor
│   ├── code-snippet-block-editor.tsx  # Code snippet editor
│   └── callout-block-editor.tsx   # Callout block editor
├── lib/
│   └── admin-content-blocks.ts    # Extend types + validation (MODIFY)
└── app/assets/[slug]/
    └── page.tsx                   # Extend BlockRenderer (MODIFY)
```

### Tests (New)
```
api/tests/
└── test_upload.py                 # Upload endpoint tests

web/src/
├── lib/admin-content-blocks.test.ts               # Extend (MODIFY)
└── components/admin/content-blocks/
    ├── image-block-editor.test.tsx
    ├── code-snippet-block-editor.test.tsx
    └── callout-block-editor.test.tsx
```

---

## Task 1: Extend Type Definitions

**Files:**
- Modify: `web/src/lib/admin-content-blocks.ts`
- Modify: `web/src/lib/admin-content-blocks.test.ts`

---

### Step 1: Add new type definitions

Add to `web/src/lib/admin-content-blocks.ts`:

```typescript
export type ImageBlockConfig = {
  url: string;
  alt: string;
  caption?: string;
  width?: number;
};

export type CodeSnippetBlockConfig = {
  language: string;
  code: string;
  showLineNumbers: boolean;
};

export type CalloutBlockConfig = {
  variant: "info" | "warning" | "error" | "tip";
  title?: string;
  content: string;
};

// Update ContentBlockType
export type ContentBlockType = "text" | "stat_card" | "image" | "code_snippet" | "callout";

// Update ContentBlockConfig
export type ContentBlockConfig = TextBlockConfig | StatCardBlockConfig | ImageBlockConfig | CodeSnippetBlockConfig | CalloutBlockConfig;

// Update VALID_TYPES
const VALID_TYPES: ContentBlockType[] = ["text", "stat_card", "image", "code_snippet", "callout"];
```

---

### Step 2: Update isContentBlock validation

Add validation for new types in `isContentBlock`:

```typescript
if (value.type === "image") {
  const config = value.config as ImageBlockConfig;
  return typeof config.url === "string" && typeof config.alt === "string";
}
if (value.type === "code_snippet") {
  const config = value.config as CodeSnippetBlockConfig;
  return typeof config.language === "string" && typeof config.code === "string" && typeof config.showLineNumbers === "boolean";
}
if (value.type === "callout") {
  const config = value.config as CalloutBlockConfig;
  const validVariants = ["info", "warning", "error", "tip"];
  return validVariants.includes(config.variant) && typeof config.content === "string";
}
```

---

### Step 3: Update createDefaultBlock

Add default blocks for new types:

```typescript
if (type === "image") {
  return { id: crypto.randomUUID(), type: "image", order: 0, visible: true, config: { url: "", alt: "", caption: "", width: 100 } };
}
if (type === "code_snippet") {
  return { id: crypto.randomUUID(), type: "code_snippet", order: 0, visible: true, config: { language: "plaintext", code: "", showLineNumbers: true } };
}
if (type === "callout") {
  return { id: crypto.randomUUID(), type: "callout", order: 0, visible: true, config: { variant: "info", title: "", content: "" } };
}
```

---

### Step 4: Update validateBlock

Add validation/fallback for new types:

```typescript
if (type === "image") {
  const url = isPlainObject(block.config) && typeof block.config.url === "string" ? block.config.url : "";
  const alt = isPlainObject(block.config) && typeof block.config.alt === "string" ? block.config.alt : "";
  const caption = isPlainObject(block.config) && typeof block.config.caption === "string" ? block.config.caption : "";
  const width = isPlainObject(block.config) && typeof block.config.width === "number" ? block.config.width : 100;
  config = { url, alt, caption, width };
}
if (type === "code_snippet") {
  const language = isPlainObject(block.config) && typeof block.config.language === "string" ? block.config.language : "plaintext";
  const code = isPlainObject(block.config) && typeof block.config.code === "string" ? block.config.code : "";
  const showLineNumbers = isPlainObject(block.config) && typeof block.config.showLineNumbers === "boolean" ? block.config.showLineNumbers : true;
  config = { language, code, showLineNumbers };
}
if (type === "callout") {
  const validVariants = ["info", "warning", "error", "tip"];
  const rawVariant = isPlainObject(block.config) && typeof block.config.variant === "string" ? block.config.variant : "info";
  const variant = validVariants.includes(rawVariant) ? rawVariant as CalloutBlockConfig["variant"] : "info";
  const title = isPlainObject(block.config) && typeof block.config.title === "string" ? block.config.title : "";
  const content = isPlainObject(block.config) && typeof block.config.content === "string" ? block.config.content : "";
  config = { variant, title, content };
}
```

---

### Step 5: Write tests for new types

Add to `web/src/lib/admin-content-blocks.test.ts`:

```typescript
const validImageBlock = { id: "img-1", type: "image" as const, order: 0, visible: true, config: { url: "https://example.com/img.png", alt: "Example", caption: "A caption", width: 80 } };
const validCodeBlock = { id: "code-1", type: "code_snippet" as const, order: 0, visible: true, config: { language: "javascript", code: "console.log('hello');", showLineNumbers: true } };
const validCalloutBlock = { id: "call-1", type: "callout" as const, order: 0, visible: true, config: { variant: "info" as const, title: "Note", content: "This is a note." } };

// isContentBlock tests
it("returns true for valid image block", () => expect(isContentBlock(validImageBlock)).toBe(true));
it("returns true for valid code_snippet block", () => expect(isContentBlock(validCodeBlock)).toBe(true));
it("returns true for valid callout block", () => expect(isContentBlock(validCalloutBlock)).toBe(true));
it("returns false for image block missing url", () => expect(isContentBlock({ ...validImageBlock, config: { alt: "test" } })).toBe(false));
it("returns false for callout block with invalid variant", () => expect(isContentBlock({ ...validCalloutBlock, config: { variant: "invalid", content: "test" } })).toBe(false));

// createDefaultBlock tests
it("creates default image block", () => {
  const block = createDefaultBlock("image");
  expect(block.type).toBe("image");
  expect(block.config.url).toBe("");
});

it("creates default code_snippet block", () => {
  const block = createDefaultBlock("code_snippet");
  expect(block.type).toBe("code_snippet");
  expect(block.config.language).toBe("plaintext");
});

it("creates default callout block", () => {
  const block = createDefaultBlock("callout");
  expect(block.type).toBe("callout");
  expect(block.config.variant).toBe("info");
});

// validateBlock tests
it("validates and fills defaults for image block", () => {
  const result = validateBlock({ type: "image" });
  expect(result.type).toBe("image");
  expect(result.config.url).toBe("");
});

it("validates and fills defaults for code_snippet block", () => {
  const result = validateBlock({ type: "code_snippet" });
  expect(result.type).toBe("code_snippet");
  expect(result.config.language).toBe("plaintext");
});

it("validates and fills defaults for callout block", () => {
  const result = validateBlock({ type: "callout" });
  expect(result.type).toBe("callout");
  expect(result.config.variant).toBe("info");
});
```

---

### Step 6: Run tests

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test src/lib/admin-content-blocks.test.ts
```

Expected: All tests pass

---

## Task 2: Backend Image Upload API

**Files:**
- Create: `api/app/api/v1/upload.py`
- Modify: `api/app/api/v1/router.py`
- Modify: `api/app/main.py`
- Create: `api/tests/test_upload.py`

---

### Step 1: Create upload endpoint

Create `api/app/api/v1/upload.py`:

```python
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from app.core.auth import get_current_user

router = APIRouter(prefix="/admin/assets", tags=["admin", "upload"])

UPLOAD_DIR = Path("uploads/images")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/images")
async def upload_image(
    file: UploadFile,
    _user=Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail={"code": "invalid_file_type", "message": "仅支持 jpg/png/gif/webp 格式"},
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail={"code": "file_too_large", "message": "文件大小不能超过 5MB"},
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "png"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename

    filepath.write_bytes(content)

    return {"url": f"/uploads/images/{filename}"}
```

---

### Step 2: Register upload router

Modify `api/app/api/v1/router.py` to include upload router.

---

### Step 3: Mount static files

Modify `api/app/main.py`:

```python
from fastapi.staticfiles import StaticFiles
import os

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

---

### Step 4: Write upload tests

Create `api/tests/test_upload.py`:

```python
import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_header():
    response = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "testpass"})
    token = response.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}

def test_upload_image_success():
    file_data = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    response = client.post(
        "/api/v1/admin/assets/images",
        files={"file": ("test.png", io.BytesIO(file_data), "image/png")},
        headers=get_auth_header(),
    )
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("/uploads/images/")

def test_upload_invalid_type():
    response = client.post(
        "/api/v1/admin/assets/images",
        files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")},
        headers=get_auth_header(),
    )
    assert response.status_code == 400

def test_upload_too_large():
    large_data = b"\x00" * (6 * 1024 * 1024)
    response = client.post(
        "/api/v1/admin/assets/images",
        files={"file": ("large.png", io.BytesIO(large_data), "image/png")},
        headers=get_auth_header(),
    )
    assert response.status_code == 413
```

---

### Step 5: Run backend tests

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_upload.py -v
```

---

## Task 3: ImageBlockEditor Component

**Files:**
- Create: `web/src/components/admin/content-blocks/image-block-editor.tsx`
- Create: `web/src/components/admin/content-blocks/image-block-editor.test.tsx`

---

### Step 1: Implement ImageBlockEditor

```typescript
"use client";

import { useState, useRef } from "react";
import type { ImageBlockConfig } from "@/lib/admin-content-blocks";

type ImageBlockEditorProps = {
  config: ImageBlockConfig;
  onChange: (config: ImageBlockConfig) => void;
  token: string;
};

export function ImageBlockEditor({ config, onChange, token }: ImageBlockEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("仅支持 jpg/png/gif/webp 格式");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("文件大小不能超过 5MB");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/admin/assets/images", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.detail?.message || "上传失败");
        return;
      }
      const data = await res.json();
      onChange({ ...config, url: data.url });
    } catch {
      setUploadError("网络错误，请重试");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">图片 URL</label>
          <input
            type="text"
            value={config.url}
            onChange={(e) => onChange({ ...config, url: e.target.value })}
            placeholder="https://... 或上传图片"
            className="w-full px-3 py-2 bg-[rgb(255_255_255_/5%)] border border-[rgb(255_255_255_/10%)] rounded text-sm focus:outline-none focus:border-[var(--color-electric-purple)]"
          />
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-[var(--color-electric-purple)] text-white text-sm rounded hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? "上传中..." : "上传图片"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      </div>
      {uploadError && <div className="text-xs text-red-500">{uploadError}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Alt 文本</label>
          <input
            type="text"
            value={config.alt}
            onChange={(e) => onChange({ ...config, alt: e.target.value })}
            placeholder="图片描述"
            className="w-full px-3 py-2 bg-[rgb(255_255_255_/5%)] border border-[rgb(255_255_255_/10%)] rounded text-sm focus:outline-none focus:border-[var(--color-electric-purple)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">说明文字</label>
          <input
            type="text"
            value={config.caption || ""}
            onChange={(e) => onChange({ ...config, caption: e.target.value })}
            placeholder="可选"
            className="w-full px-3 py-2 bg-[rgb(255_255_255_/5%)] border border-[rgb(255_255_255_/10%)] rounded text-sm focus:outline-none focus:border-[var(--color-electric-purple)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">宽度: {config.width || 100}%</label>
        <input
          type="range"
          min={10}
          max={100}
          value={config.width || 100}
          onChange={(e) => onChange({ ...config, width: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {config.url && (
        <div className="border border-[rgb(255_255_255_/10%)] rounded-lg overflow-hidden" style={{ width: `${config.width || 100}%` }}>
          <img src={config.url} alt={config.alt} className="w-full h-auto" />
          {config.caption && <div className="text-xs text-[var(--color-text-secondary)] p-2 text-center">{config.caption}</div>}
        </div>
      )}
    </div>
  );
}
```

---

### Step 2: Write tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ImageBlockEditor } from "./image-block-editor";

const defaultConfig = { url: "", alt: "", caption: "", width: 100 };

describe("ImageBlockEditor", () => {
  it("renders url input", () => {
    render(<ImageBlockEditor config={defaultConfig} onChange={vi.fn()} token="test" />);
    expect(screen.getByPlaceholderText("https://... 或上传图片")).toBeInTheDocument();
  });

  it("renders upload button", () => {
    render(<ImageBlockEditor config={defaultConfig} onChange={vi.fn()} token="test" />);
    expect(screen.getByText("上传图片")).toBeInTheDocument();
  });

  it("renders alt input", () => {
    render(<ImageBlockEditor config={defaultConfig} onChange={vi.fn()} token="test" />);
    expect(screen.getByPlaceholderText("图片描述")).toBeInTheDocument();
  });

  it("calls onChange when url changes", () => {
    const onChange = vi.fn();
    render(<ImageBlockEditor config={defaultConfig} onChange={onChange} token="test" />);
    fireEvent.change(screen.getByPlaceholderText("https://... 或上传图片"), { target: { value: "https://example.com/img.png" } });
    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, url: "https://example.com/img.png" });
  });

  it("shows preview when url is set", () => {
    const config = { ...defaultConfig, url: "https://example.com/img.png", alt: "Test" };
    render(<ImageBlockEditor config={config} onChange={vi.fn()} token="test" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/img.png");
  });
});
```

---

### Step 3: Run tests

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test src/components/admin/content-blocks/image-block-editor.test.tsx
```

---

## Task 4: CodeSnippetBlockEditor Component

**Files:**
- Create: `web/src/components/admin/content-blocks/code-snippet-block-editor.tsx`
- Create: `web/src/components/admin/content-blocks/code-snippet-block-editor.test.tsx`

---

### Step 1: Implement CodeSnippetBlockEditor

```typescript
"use client";

import type { CodeSnippetBlockConfig } from "@/lib/admin-content-blocks";

const LANGUAGES = ["plaintext", "javascript", "typescript", "python", "java", "go", "rust", "html", "css", "sql", "bash", "json", "yaml"];

type CodeSnippetBlockEditorProps = {
  config: CodeSnippetBlockConfig;
  onChange: (config: CodeSnippetBlockConfig) => void;
};

export function CodeSnippetBlockEditor({ config, onChange }: CodeSnippetBlockEditorProps) {
  const lines = config.code.split("\n");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">语言</label>
          <select
            value={config.language}
            onChange={(e) => onChange({ ...config, language: e.target.value })}
            className="px-3 py-2 bg-[rgb(18_18_26_/90%)] border border-[rgb(255_255_255_/10%)] rounded text-sm focus:outline-none focus:border-[var(--color-electric-purple)]"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={config.showLineNumbers}
            onChange={(e) => onChange({ ...config, showLineNumbers: e.target.checked })}
          />
          显示行号
        </label>
      </div>

      <div className="relative">
        <div className="flex">
          {config.showLineNumbers && (
            <div className="py-2 px-3 text-right text-xs text-[var(--color-text-tertiary)] select-none border-r border-[rgb(255_255_255_/10%)] bg-[rgb(0_0_0_/20%)]">
              {lines.map((_, i) => (
                <div key={i} className="leading-6">{i + 1}</div>
              ))}
            </div>
          )}
          <textarea
            value={config.code}
            onChange={(e) => onChange({ ...config, code: e.target.value })}
            placeholder="输入代码..."
            className="flex-1 min-h-[200px] p-3 bg-[rgb(0_0_0_/30%)] border border-[rgb(255_255_255_/10%)] rounded-r font-mono text-sm leading-6 resize-y focus:outline-none focus:border-[var(--color-electric-purple)]"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="border border-[rgb(255_255_255_/10%)] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1 bg-[rgb(255_255_255_/5%)] text-xs text-[var(--color-text-tertiary)]">
          <span>{config.language}</span>
          <span>{lines.length} 行</span>
        </div>
        <pre className="p-3 text-sm font-mono overflow-x-auto">
          <code>{config.code || "// 预览"}</code>
        </pre>
      </div>
    </div>
  );
}
```

---

### Step 2: Write tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CodeSnippetBlockEditor } from "./code-snippet-block-editor";

const defaultConfig = { language: "javascript", code: "console.log('hello');", showLineNumbers: true };

describe("CodeSnippetBlockEditor", () => {
  it("renders language selector", () => {
    render(<CodeSnippetBlockEditor config={defaultConfig} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("javascript")).toBeInTheDocument();
  });

  it("renders code textarea", () => {
    render(<CodeSnippetBlockEditor config={defaultConfig} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("console.log('hello');")).toBeInTheDocument();
  });

  it("shows line numbers when enabled", () => {
    render(<CodeSnippetBlockEditor config={defaultConfig} onChange={vi.fn()} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("calls onChange when code changes", () => {
    const onChange = vi.fn();
    render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("console.log('hello');"), { target: { value: "const x = 1;" } });
    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, code: "const x = 1;" });
  });

  it("calls onChange when language changes", () => {
    const onChange = vi.fn();
    render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("javascript"), { target: { value: "python" } });
    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, language: "python" });
  });
});
```

---

### Step 3: Run tests

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test src/components/admin/content-blocks/code-snippet-block-editor.test.tsx
```

---

## Task 5: CalloutBlockEditor Component

**Files:**
- Create: `web/src/components/admin/content-blocks/callout-block-editor.tsx`
- Create: `web/src/components/admin/content-blocks/callout-block-editor.test.tsx`

---

### Step 1: Implement CalloutBlockEditor

```typescript
"use client";

import type { CalloutBlockConfig } from "@/lib/admin-content-blocks";

const VARIANTS = [
  { value: "info" as const, label: "信息", icon: "ℹ️", color: "blue" },
  { value: "warning" as const, label: "警告", icon: "⚠️", color: "amber" },
  { value: "error" as const, label: "错误", icon: "❌", color: "red" },
  { value: "tip" as const, label: "提示", icon: "💡", color: "green" },
];

const VARIANT_COLORS: Record<string, string> = {
  info: "border-l-blue-500 bg-blue-500/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  error: "border-l-red-500 bg-red-500/5",
  tip: "border-l-green-500 bg-green-500/5",
};

type CalloutBlockEditorProps = {
  config: CalloutBlockConfig;
  onChange: (config: CalloutBlockConfig) => void;
};

export function CalloutBlockEditor({ config, onChange }: CalloutBlockEditorProps) {
  const currentVariant = VARIANTS.find((v) => v.value === config.variant) || VARIANTS[0];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-[var(--color-text-secondary)] mb-2">样式</label>
        <div className="flex gap-2">
          {VARIANTS.map((v) => (
            <button
              key={v.value}
              onClick={() => onChange({ ...config, variant: v.value })}
              className={`px-3 py-2 rounded text-sm border transition-colors ${
                config.variant === v.value
                  ? "border-[var(--color-electric-purple)] bg-[var(--color-electric-purple)]/10"
                  : "border-[rgb(255_255_255_/10%)] hover:bg-[rgb(255_255_255_/5%)]"
              }`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">标题（可选）</label>
        <input
          type="text"
          value={config.title || ""}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder="提示标题"
          className="w-full px-3 py-2 bg-[rgb(255_255_255_/5%)] border border-[rgb(255_255_255_/10%)] rounded text-sm focus:outline-none focus:border-[var(--color-electric-purple)]"
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">内容</label>
        <textarea
          value={config.content}
          onChange={(e) => onChange({ ...config, content: e.target.value })}
          placeholder="提示内容..."
          rows={3}
          className="w-full px-3 py-2 bg-[rgb(255_255_255_/5%)] border border-[rgb(255_255_255_/10%)] rounded text-sm resize-y focus:outline-none focus:border-[var(--color-electric-purple)]"
        />
      </div>

      <div className={`border-l-4 rounded-lg p-4 ${VARIANT_COLORS[config.variant]}`}>
        <div className="flex items-start gap-2">
          <span className="text-lg">{currentVariant.icon}</span>
          <div>
            {config.title && <div className="font-medium text-sm mb-1">{config.title}</div>}
            <div className="text-sm text-[var(--color-text-secondary)]">{config.content || "预览内容..."}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Step 2: Write tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CalloutBlockEditor } from "./callout-block-editor";

const defaultConfig = { variant: "info" as const, title: "", content: "" };

describe("CalloutBlockEditor", () => {
  it("renders variant buttons", () => {
    render(<CalloutBlockEditor config={defaultConfig} onChange={vi.fn()} />);
    expect(screen.getByText(/信息/)).toBeInTheDocument();
    expect(screen.getByText(/警告/)).toBeInTheDocument();
    expect(screen.getByText(/错误/)).toBeInTheDocument();
    expect(screen.getByText(/提示/)).toBeInTheDocument();
  });

  it("renders content textarea", () => {
    render(<CalloutBlockEditor config={defaultConfig} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("提示内容...")).toBeInTheDocument();
  });

  it("calls onChange when variant changes", () => {
    const onChange = vi.fn();
    render(<CalloutBlockEditor config={defaultConfig} onChange={onChange} />);
    fireEvent.click(screen.getByText(/警告/));
    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, variant: "warning" });
  });

  it("calls onChange when content changes", () => {
    const onChange = vi.fn();
    render(<CalloutBlockEditor config={defaultConfig} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("提示内容..."), { target: { value: "注意！" } });
    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, content: "注意！" });
  });

  it("shows preview with current variant", () => {
    const config = { variant: "warning" as const, title: "注意", content: "这是一个警告" };
    render(<CalloutBlockEditor config={config} onChange={vi.fn()} />);
    expect(screen.getByText("注意")).toBeInTheDocument();
    expect(screen.getByText("这是一个警告")).toBeInTheDocument();
  });
});
```

---

### Step 3: Run tests

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test src/components/admin/content-blocks/callout-block-editor.test.tsx
```

---

## Task 6: Extend ContentBlockEditor + BlockPreview

**Files:**
- Modify: `web/src/components/admin/content-blocks/content-block-editor.tsx`
- Modify: `web/src/components/admin/content-blocks/block-preview.tsx`
- Modify: `web/src/components/admin/content-blocks/content-block-editor.test.tsx`

---

### Step 1: Extend ContentBlockEditor

Update `content-block-editor.tsx`:
- Import new editor components
- Update `handleAddBlock` parameter type to `ContentBlockType`
- Update `handleBlockConfigChange` to accept all config types
- Update `renderEditor` to handle new types
- Add 3 new items to the "添加内容块" menu (📷 图片, 💻 代码片段, 💡 提示框)

---

### Step 2: Extend BlockPreview

Update `block-preview.tsx` to render previews for new types:
- `image`: Show thumbnail image + caption text
- `code_snippet`: Show first 5 lines of code with language label
- `callout`: Show colored left border + icon + first line of content

---

### Step 3: Update tests

Add tests for new block types in `content-block-editor.test.tsx`:
- Test adding image block
- Test adding code_snippet block
- Test adding callout block

---

### Step 4: Run all tests

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

---

## Task 7: Extend Asset Detail Page Rendering

**Files:**
- Modify: `web/src/app/assets/[slug]/page.tsx`

---

### Step 1: Add image block rendering

```typescript
if (block.type === "image") {
  const url = String(block.config.url ?? "");
  const alt = String(block.config.alt ?? "");
  const caption = String(block.config.caption ?? "");
  const width = typeof block.config.width === "number" ? block.config.width : 100;
  if (!url) return null;
  return (
    <figure key={block.id} style={{ width: `${width}%` }} className="mx-auto">
      <img src={url} alt={alt} loading="lazy" className="w-full h-auto rounded-lg" />
      {caption && <figcaption className="text-xs text-[var(--color-text-tertiary)] mt-2 text-center">{caption}</figcaption>}
    </figure>
  );
}
```

---

### Step 2: Add code_snippet block rendering

```typescript
if (block.type === "code_snippet") {
  const language = String(block.config.language ?? "plaintext");
  const code = String(block.config.code ?? "");
  const showLineNumbers = block.config.showLineNumbers !== false;
  const lines = code.split("\n");
  return (
    <div key={block.id} className="rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/60%)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[rgb(255_255_255_/5%)] text-xs text-[var(--color-text-tertiary)]">
        <span>{language}</span>
        <span>{lines.length} 行</span>
      </div>
      <div className="flex">
        {showLineNumbers && (
          <div className="py-3 px-3 text-right text-xs text-[var(--color-text-tertiary)] select-none border-r border-[rgb(255_255_255_/5%)]">
            {lines.map((_, i) => <div key={i} className="leading-6">{i + 1}</div>)}
          </div>
        )}
        <pre className="p-3 text-sm font-mono overflow-x-auto flex-1"><code>{code}</code></pre>
      </div>
    </div>
  );
}
```

---

### Step 3: Add callout block rendering

```typescript
if (block.type === "callout") {
  const variant = String(block.config.variant ?? "info");
  const title = String(block.config.title ?? "");
  const content = String(block.config.content ?? "");
  const variantStyles: Record<string, string> = {
    info: "border-l-blue-500 bg-blue-500/5",
    warning: "border-l-amber-500 bg-amber-500/5",
    error: "border-l-red-500 bg-red-500/5",
    tip: "border-l-green-500 bg-green-500/5",
  };
  const variantIcons: Record<string, string> = { info: "ℹ️", warning: "⚠️", error: "❌", tip: "💡" };
  return (
    <div key={block.id} className={`border-l-4 rounded-2xl p-5 ${variantStyles[variant] || variantStyles.info}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{variantIcons[variant] || "ℹ️"}</span>
        <div>
          {title && <div className="font-medium text-sm mb-1">{title}</div>}
          <div className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{content}</div>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 8: Integration Testing

---

### Step 1: Run all frontend tests

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

Expected: All tests pass

---

### Step 2: Run lint

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run lint
```

Expected: No errors

---

### Step 3: Run build

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

Expected: Build succeeds

---

### Step 4: Run backend tests

```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_upload.py -v
```

Expected: All tests pass

---

## Success Criteria

1. ✅ 可以添加 image/code_snippet/callout 类型的 block
2. ✅ Image block 支持 URL 输入和本地上传
3. ✅ Code snippet block 支持语言选择和行号显示
4. ✅ Callout block 支持 4 种变体切换
5. ✅ 图片上传 API 正常工作
6. ✅ 资产详情页正确渲染新类型
7. ✅ 所有测试通过
8. ✅ Lint + Build 成功
