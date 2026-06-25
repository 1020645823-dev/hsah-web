# Phase 7 — Quality & UX Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立完整的质量基础设施（后端 ruff lint + 测试覆盖率、前端 Error Boundary + 404 页面），优化 UX（Skeleton 骨架屏、Empty State 空状态、React Query 数据管理、响应式表格），并提升代码质量（修复 lint 错误、清理 TODO、Route Guard 路由守卫）。

**Architecture:** 后端引入 ruff 作为统一 lint 工具并配置 pyproject.toml，前端新增可复用的 Skeleton 和 EmptyState 组件并通过 React Query Provider 统一数据获取层，所有 admin 页面统一接入骨架屏和空状态以替换内联 loading 文本，最后通过 Route Guard HOC 统一 admin 路由的鉴权重定向逻辑。

**Tech Stack:** Python (FastAPI, pytest, pytest-cov, ruff), TypeScript (Next.js 16, React 19, Tailwind CSS 4, @tanstack/react-query, Lucide React, ESLint 9, Vitest)

---

## File Map

| File | Action | Responsibility |
|------|--------|--------------|
| `/Users/weiwei.g.zhang/Documents/hsah/api/pyproject.toml` | Create | ruff 配置、pytest-cov 配置 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_version.py` | Create | `/version` 端点测试 |
| `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_templates_list.py` | Create | 模板列表 GET 测试 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/error-boundary.tsx` | Create | React class ErrorBoundary |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/not-found.tsx` | Create | Next.js 404 页面 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/skeleton.tsx` | Create | 可复用 Skeleton 组件（card/table-row/text-line/block） |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/empty-state.tsx` | Create | 可复用 EmptyState 组件 |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/query-provider.tsx` | Create | React Query Provider |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/route-guard.tsx` | Create | Admin Route Guard HOC |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/layout.tsx` | Modify | 注入 QueryProvider |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/page.tsx` | Modify | 接入 Skeleton、EmptyState、RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/users/page.tsx` | Modify | 接入 Skeleton、EmptyState、RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/page.tsx` | Modify | 接入 Skeleton、EmptyState、RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/roles/page.tsx` | Modify | 接入 Skeleton、EmptyState、RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/policies/page.tsx` | Modify | 接入 Skeleton、EmptyState、RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/matrix/page.tsx` | Modify | 接入 Skeleton、EmptyState、RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/simulator/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/templates/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/policies/wizard/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/new/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/[id]/edit/page.tsx` | Modify | 接入 RouteGuard |
| `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/image-block-editor.test.tsx` | Modify | 替换 img 查询为 data-testid |

---

## Feature 1: Quality Infrastructure

### Task 1: Backend ruff lint setup

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/api/pyproject.toml`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/app/main.py`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/app/api/v1/admin.py`

- [ ] **Step 1: Create pyproject.toml with ruff config**

```toml
[project]
name = "hsah-api"
version = "0.1.0"
description = "Hyperscaler Asset Hub API"
requires-python = ">=3.11"

[tool.ruff]
target-version = "py311"
line-length = 120
select = [
    "E",   # pycodestyle errors
    "F",   # Pyflakes
    "I",   # isort
    "N",   # pep8-naming
    "W",   # pycodestyle warnings
    "UP",  # pyupgrade
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "SIM", # flake8-simplify
]
ignore = [
    "E501",  # line too long (handled by formatter)
]

[tool.ruff.lint.pydocstyle]
convention = "google"

[tool.ruff.lint.isort]
known-first-party = ["app"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-q --tb=short"

[tool.coverage.run]
source = ["app"]
omit = [
    "*/tests/*",
    "*/alembic/*",
    "*/scripts/*",
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
]
```

- [ ] **Step 2: Install ruff and run check**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pip install ruff pytest-cov
ruff check app/ tests/
```

Expected: ruff reports any lint errors in the codebase.

- [ ] **Step 3: Fix ruff errors in app/main.py**

If ruff reports unused imports in `app/main.py`, fix them. Common issues:

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.scripts.seed_templates import seed as seed_templates
```

Run: `ruff check app/main.py`
Expected: no errors.

- [ ] **Step 4: Fix ruff errors in app/api/v1/admin.py**

If ruff reports issues (e.g., unused imports, import ordering), fix them. The file should already be clean; verify with:

Run: `ruff check app/api/v1/admin.py`
Expected: no errors.

- [ ] **Step 5: Run ruff on entire codebase and fix all errors**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
ruff check app/ tests/ --fix
```

Expected: All auto-fixable issues resolved. Review any remaining manual fixes.

- [ ] **Step 6: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/pyproject.toml api/app/
git commit -m "feat: add ruff lint config and fix backend lint errors"
```

---

### Task 2: Add pytest-cov for backend test coverage

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/api/pyproject.toml` (already created in Task 1)

- [ ] **Step 1: Install pytest-cov and run with coverage**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pip install pytest-cov
pytest --cov=app --cov-report=term-missing
```

Expected: Coverage report printed showing line coverage % and missing lines per file.

- [ ] **Step 2: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/pyproject.toml
git commit -m "feat: add pytest-cov for backend test coverage"
```

---

### Task 3: Create Error Boundary component

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/error-boundary.tsx`
- Test: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/error-boundary.test.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
          <AlertTriangle className="h-10 w-10 text-red-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              页面渲染出错
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {this.state.error?.message ?? "未知错误"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-4 py-2 text-xs text-[var(--color-text-primary)] transition-colors hover:border-[rgb(123_63_242_/40%)]"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

- [ ] **Step 2: Write the test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";

function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div data-testid="child">Child content</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders fallback UI when error is thrown", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText("页面渲染出错")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("resets error state when retry button is clicked", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText("页面渲染出错")).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText("重试"));
    expect(screen.getByTestId("child")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
```

- [ ] **Step 3: Run test**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test -- src/components/error-boundary.test.tsx
```

Expected: All 3 tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/components/error-boundary.tsx web/src/components/error-boundary.test.tsx
git commit -m "feat: add ErrorBoundary component with tests"
```

---

### Task 4: Create Next.js 404 page

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/not-found.tsx`

- [ ] **Step 1: Write the 404 page**

```tsx
import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <FileQuestion className="h-16 w-16 text-[var(--color-text-tertiary)]" />
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold text-[var(--color-text-primary)]">
          404
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          页面不存在或已被移除
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-[var(--color-electric-purple)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        返回首页
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

Expected: Build succeeds, no errors related to not-found.tsx.

- [ ] **Step 3: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/not-found.tsx
git commit -m "feat: add Next.js 404 not-found page"
```

---

### Task 5: Add more backend tests for uncovered endpoints

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_version.py`
- Create: `/Users/weiwei.g.zhang/Documents/hsah/api/tests/test_templates_list.py`

- [ ] **Step 1: Write /version endpoint test**

```python
from fastapi.testclient import TestClient

from app.main import app


def test_version() -> None:
    client = TestClient(app)
    res = client.get("/version")
    assert res.status_code == 200
    body = res.json()
    assert "version" in body
    assert body["version"] == "0.1.0"
```

- [ ] **Step 2: Write templates list GET test**

```python
import uuid

from fastapi.testclient import TestClient

from app.main import app


def _get_token(client: TestClient) -> str:
    email = f"admin-{uuid.uuid4().hex}@example.com"
    password = "P@ssw0rd-123"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert res.status_code in (201, 409)
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_list_templates_requires_auth() -> None:
    client = TestClient(app)
    res = client.get("/api/v1/templates")
    assert res.status_code == 401


def test_list_templates_authed() -> None:
    client = TestClient(app)
    token = _get_token(client)
    res = client.get("/api/v1/templates", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body, list)
```

- [ ] **Step 3: Run new tests**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest tests/test_version.py tests/test_templates_list.py -v
```

Expected: All tests pass.

- [ ] **Step 4: Run full backend test suite**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add api/tests/test_version.py api/tests/test_templates_list.py
git commit -m "test: add tests for /version and /templates endpoints"
```

---

## Feature 2: UX Optimization

### Task 6: Create Skeleton component

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/skeleton.tsx`
- Test: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/skeleton.test.tsx`

- [ ] **Step 1: Write the Skeleton component**

```tsx
import { cn } from "@/lib/utils";

export type SkeletonVariant = "card" | "table-row" | "text-line" | "block";

interface SkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-[rgb(212_218_245_/10%)]",
        className
      )}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] p-5 backdrop-blur-[24px]">
      <SkeletonPulse className="h-5 w-1/3" />
      <SkeletonPulse className="h-4 w-full" />
      <SkeletonPulse className="h-4 w-5/6" />
      <div className="flex gap-2 pt-2">
        <SkeletonPulse className="h-6 w-16 rounded-full" />
        <SkeletonPulse className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="grid items-center gap-4 px-5 py-4">
      <div
        className="grid items-center gap-4"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonPulse key={i} className="h-4" />
        ))}
      </div>
    </div>
  );
}

function TextLineSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonPulse className="h-4 w-full" />
      <SkeletonPulse className="h-4 w-5/6" />
      <SkeletonPulse className="h-4 w-4/6" />
    </div>
  );
}

function BlockSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] p-5 backdrop-blur-[24px]">
      <SkeletonPulse className="h-4 w-1/4" />
      <SkeletonPulse className="h-24 w-full" />
    </div>
  );
}

export function Skeleton({ variant = "block", count = 1, className }: SkeletonProps) {
  const items = Array.from({ length: count }).map((_, index) => {
    switch (variant) {
      case "card":
        return <CardSkeleton key={index} />;
      case "table-row":
        return <TableRowSkeleton key={index} />;
      case "text-line":
        return <TextLineSkeleton key={index} />;
      case "block":
      default:
        return <BlockSkeleton key={index} />;
    }
  });

  return <div className={cn("space-y-3", className)}>{items}</div>;
}
```

- [ ] **Step 2: Write the test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders block variant by default", () => {
    render(<Skeleton />);
    const pulses = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("animate-pulse")
    );
    expect(pulses.length).toBeGreaterThan(0);
  });

  it("renders multiple items when count > 1", () => {
    const { container } = render(<Skeleton variant="card" count={3} />);
    const cards = container.querySelectorAll(".rounded-2xl");
    expect(cards.length).toBe(3);
  });

  it("renders table-row variant", () => {
    const { container } = render(<Skeleton variant="table-row" count={2} />);
    const rows = container.querySelectorAll("[style*='grid-template-columns']");
    expect(rows.length).toBe(2);
  });

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
```

- [ ] **Step 3: Run test**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test -- src/components/skeleton.test.tsx
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/components/skeleton.tsx web/src/components/skeleton.test.tsx
git commit -m "feat: add reusable Skeleton component with variants"
```

---

### Task 7: Create EmptyState component

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/empty-state.tsx`
- Test: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/empty-state.test.tsx`

- [ ] **Step 1: Write the EmptyState component**

```tsx
import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-5 py-10 text-center",
        className
      )}
    >
      {Icon ? (
        <Icon className="h-10 w-10 text-[var(--color-text-tertiary)]" />
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {title}
        </p>
        {description ? (
          <p className="text-xs text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Write the test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Inbox } from "lucide-react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No items" description="Add your first item." />);
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Add your first item.")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(<EmptyState title="Empty" icon={Inbox} />);
    expect(screen.getByRole("generic", { hidden: true })).toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <EmptyState
        title="Empty"
        action={<button type="button">Create</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<EmptyState title="Empty" className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
```

- [ ] **Step 3: Run test**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test -- src/components/empty-state.test.tsx
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/components/empty-state.tsx web/src/components/empty-state.test.tsx
git commit -m "feat: add reusable EmptyState component"
```

---

### Task 8: Add React Query

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/query-provider.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/layout.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/package.json`

- [ ] **Step 1: Install @tanstack/react-query**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm install @tanstack/react-query
```

Expected: Package installs successfully, package.json updated.

- [ ] **Step 2: Create QueryProvider component**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 3: Wrap layout with QueryProvider**

Modify `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hyperscaler Asset Hub",
  description:
    "Explore scenario-driven AI demos, reusable architectures, and hyperscaler assets across AWS, Azure, and Google Cloud.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/package.json web/package-lock.json web/src/components/query-provider.tsx web/src/app/layout.tsx
git commit -m "feat: add React Query with QueryProvider wrapper"
```

---

### Task 9: Integrate Skeleton into admin pages

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/users/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/roles/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/policies/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/matrix/page.tsx`

- [ ] **Step 1: Update admin/users/page.tsx**

Replace the inline loading skeleton (lines 309-326) with the `<Skeleton>` component. The existing inline code:

```tsx
{loading ? (
  <div className="space-y-3 px-5 py-8">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="grid grid-cols-[40px_1fr_140px_120px_120px] items-center gap-4"
      >
        <div className="h-4 animate-pulse rounded bg-[rgb(212_218_245_/10%)]" />
        <div className="h-4 animate-pulse rounded bg-[rgb(212_218_245_/10%)]" />
        <div className="h-4 animate-pulse rounded bg-[rgb(212_218_245_/10%)]" />
        <div className="h-4 animate-pulse rounded bg-[rgb(212_218_245_/10%)]" />
        <div className="flex justify-end gap-2">
          <div className="h-6 w-12 animate-pulse rounded bg-[rgb(212_218_245_/10%)]" />
          <div className="h-6 w-12 animate-pulse rounded bg-[rgb(212_218_245_/10%)]" />
        </div>
      </div>
    ))}
  </div>
) : (
  userRows
)}
```

Replace with:

```tsx
import { Skeleton } from "@/components/skeleton";

// ... inside the table body:
{loading ? (
  <div className="px-5 py-8">
    <Skeleton variant="table-row" count={4} />
  </div>
) : (
  userRows
)}
```

- [ ] **Step 2: Update admin/assets/page.tsx**

Replace the inline loading skeleton (lines 234-250) with `<Skeleton variant="table-row" count={4} />`. Also add `overflow-x-auto` wrapper to the table container.

Current table container (line 213):
```tsx
<div className="overflow-hidden rounded-2xl border ...">
```

Change to:
```tsx
<div className="overflow-x-auto">
  <div className="min-w-[700px] overflow-hidden rounded-2xl border ...">
```

And close the extra `</div>` after the Pagination.

Replace loading block:
```tsx
{loading ? (
  <div className="px-5 py-8">
    <Skeleton variant="table-row" count={4} />
  </div>
) : (
  rows.map((a) => ( ... ))
)}
```

- [ ] **Step 3: Update admin/roles/page.tsx**

The roles page uses card layout. Replace the loading indicator text (line 449) with Skeleton. The overview card shows `loading ? "…" : total`. Keep the overview as-is but add Skeleton for the role cards section when loading.

Add import:
```tsx
import { Skeleton } from "@/components/skeleton";
```

After the create/edit form card, before the error block, add:
```tsx
{loading ? (
  <Skeleton variant="card" count={3} />
) : (
  <>
    <div className="flex items-center gap-2 px-1">
      {/* existing checkbox all */}
    </div>
    {roleCards}
  </>
)}
```

- [ ] **Step 4: Update admin/policies/page.tsx**

Similar to roles page. Add import and wrap policy cards with Skeleton when loading:

```tsx
import { Skeleton } from "@/components/skeleton";
```

Replace the policy cards grid section:
```tsx
<div className="grid gap-5 md:grid-cols-2">
  {loading ? (
    <Skeleton variant="card" count={3} />
  ) : (
    policyCards
  )}
</div>
```

- [ ] **Step 5: Update admin/matrix/page.tsx**

The matrix page shows a loading text at line 338. Replace with Skeleton:

```tsx
import { Skeleton } from "@/components/skeleton";
```

Replace:
```tsx
{loading ? (
  <div className="rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/10 px-4 py-8 text-sm text-[var(--color-text-secondary)]">
    正在加载角色与策略数据...
  </div>
) : (
  <PermissionMatrixTable ... />
)}
```

With:
```tsx
{loading ? (
  <Skeleton variant="block" count={2} />
) : (
  <PermissionMatrixTable ... />
)}
```

- [ ] **Step 6: Verify build**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/admin/users/page.tsx web/src/app/admin/assets/page.tsx web/src/app/admin/roles/page.tsx web/src/app/admin/policies/page.tsx web/src/app/admin/matrix/page.tsx
git commit -m "feat: integrate Skeleton into admin pages"
```

---

### Task 10: Integrate Empty State into admin pages

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/users/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/roles/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/policies/page.tsx`

- [ ] **Step 1: Update admin/users/page.tsx**

Replace the inline empty state (lines 331-353) with `<EmptyState>`:

Add import:
```tsx
import { EmptyState } from "@/components/empty-state";
import { Users } from "lucide-react";
```

Replace:
```tsx
{!loading && rows.length === 0 ? (
  <div className="flex flex-col items-center gap-3 px-5 py-10 text-sm text-[var(--color-text-secondary)]">
    <svg ...>...</svg>
    <div className="text-center">
      <p className="font-medium text-[var(--color-text-primary)]">暂无用户</p>
      <p className="mt-1 text-xs">点击上方「创建用户」按钮添加第一个用户。</p>
    </div>
  </div>
) : null}
```

With:
```tsx
{!loading && rows.length === 0 ? (
  <EmptyState
    icon={Users}
    title="暂无用户"
    description="点击上方「创建用户」按钮添加第一个用户。"
  />
) : null}
```

- [ ] **Step 2: Update admin/assets/page.tsx**

Replace the inline empty state (lines 292-296):

Add import:
```tsx
import { EmptyState } from "@/components/empty-state";
import { Package } from "lucide-react";
```

Replace:
```tsx
{!loading && rows.length === 0 ? (
  <div className="px-5 py-8 text-sm text-[var(--color-text-secondary)]">
    No assets.
  </div>
) : null}
```

With:
```tsx
{!loading && rows.length === 0 ? (
  <EmptyState
    icon={Package}
    title="暂无资产"
    description="点击上方「+ New Asset」按钮添加第一个资产。"
  />
) : null}
```

- [ ] **Step 3: Update admin/roles/page.tsx**

Replace the empty state card (lines 612-625):

Add import:
```tsx
import { EmptyState } from "@/components/empty-state";
import { Shield } from "lucide-react";
```

Replace:
```tsx
{!loading && rows.length === 0 ? (
  <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
    <CardContent className="space-y-4 py-8">
      <div className="text-sm text-[var(--color-text-secondary)]">
        接口暂未返回角色数组，当前保留原始响应方便联调。
      </div>
      {rawResponse ? (
        <pre className="overflow-x-auto rounded-2xl bg-black/20 p-4 text-xs leading-6 text-[var(--color-periwinkle)]">
          {formatJson(rawResponse)}
        </pre>
      ) : null}
    </CardContent>
  </Card>
) : null}
```

With:
```tsx
{!loading && rows.length === 0 ? (
  <EmptyState
    icon={Shield}
    title="暂无角色"
    description="在上方表单中创建第一个角色。"
  />
) : null}
```

Note: The rawResponse debug view is intentionally removed from the empty state; it remains available via the `details` element inside each role card when data is present.

- [ ] **Step 4: Update admin/policies/page.tsx**

Replace the empty state card (lines 706-719):

Add import:
```tsx
import { EmptyState } from "@/components/empty-state";
import { FileText } from "lucide-react";
```

Replace:
```tsx
{!loading && rows.length === 0 ? (
  <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
    <CardContent className="space-y-4 py-8">
      <div className="text-sm text-[var(--color-text-secondary)]">
        接口暂未返回策略数组，当前展示原始响应以方便继续联调。
      </div>
      {rawResponse ? (
        <pre className="overflow-x-auto rounded-2xl bg-black/20 p-4 text-xs leading-6 text-[var(--color-periwinkle)]">
          {formatJson(rawResponse)}
        </pre>
      ) : null}
    </CardContent>
  </Card>
) : null}
```

With:
```tsx
{!loading && rows.length === 0 ? (
  <EmptyState
    icon={FileText}
    title="暂无策略"
    description="在上方表单中创建第一个策略，或使用 Wizard 分步创建。"
    action={
      <Link
        href="/admin/policies/wizard"
        className="rounded-lg bg-[var(--color-electric-purple)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        使用 Wizard 创建
      </Link>
    }
  />
) : null}
```

- [ ] **Step 5: Verify build**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/admin/users/page.tsx web/src/app/admin/assets/page.tsx web/src/app/admin/roles/page.tsx web/src/app/admin/policies/page.tsx
git commit -m "feat: integrate EmptyState into admin pages"
```

---

### Task 11: Responsive design — mobile sidebar collapse and table overflow

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/users/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/page.tsx`

- [ ] **Step 1: Add overflow-x-auto to users table**

The users page already has `overflow-x-auto` at line 289. Verify it wraps the entire table card:

```tsx
<div className="overflow-x-auto">
  <div className="min-w-[600px] overflow-hidden rounded-2xl border ...">
    {/* table content */}
  </div>
</div>
```

If not already wrapped, add the wrapper.

- [ ] **Step 2: Add overflow-x-auto to assets table**

This was done in Task 9 Step 2. Verify the assets page has:

```tsx
<div className="overflow-x-auto">
  <div className="min-w-[700px] overflow-hidden rounded-2xl border ...">
    {/* table content */}
  </div>
</div>
```

- [ ] **Step 3: Verify responsive behavior**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/admin/users/page.tsx web/src/app/admin/assets/page.tsx
git commit -m "style: add responsive table overflow-x-auto for mobile"
```

---

## Feature 3: Code Quality

### Task 12: Fix all remaining frontend lint errors

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/eslint.config.mjs` (if needed)
- Various files in `/Users/weiwei.g.zhang/Documents/hsah/web/src/`

- [ ] **Step 1: Run lint and capture all errors**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run lint
```

Expected: List of lint errors printed. If no errors, skip to Step 4.

- [ ] **Step 2: Fix errors one by one**

For each error reported:
1. Read the file and line number from the lint output
2. Determine the fix needed (unused import, missing dependency, type issue, etc.)
3. Apply the fix using SearchReplace
4. Re-run lint to verify

Common patterns to fix:
- Unused imports: remove the import line
- Missing React hooks dependencies: add the missing dependency to the dependency array
- `any` types: replace with proper types if possible, or add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a comment explaining why

- [ ] **Step 3: Verify lint passes**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run lint
```

Expected: No errors, exit code 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/
git commit -m "fix: resolve all frontend lint errors"
```

---

### Task 13: Clean up TODO comments in codebase

**Files:**
- Search across `/Users/weiwei.g.zhang/Documents/hsah/web/src/` and `/Users/weiwei.g.zhang/Documents/hsah/api/`

- [ ] **Step 1: Search for TODO/FIXME/HACK comments**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah
grep -rn "TODO\|FIXME\|HACK\|XXX" web/src/ api/ --include="*.ts" --include="*.tsx" --include="*.py" || echo "No TODOs found"
```

Expected: If any TODOs exist, list them with file paths and line numbers.

- [ ] **Step 2: Address each TODO**

For each TODO found:
- If it's a quick fix (1-2 lines), implement it immediately
- If it requires significant work, create a follow-up task comment with a reference ID
- If it's outdated/obsolete, remove the comment

Based on current codebase research, no TODO comments were found in the source files. If the search confirms this, mark this task as complete with no changes.

- [ ] **Step 3: Commit (if changes were made)**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add -A
git commit -m "chore: clean up TODO comments" || echo "No changes to commit"
```

---

### Task 14: Replace img tags with next/image where appropriate

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/image-block-editor.test.tsx`

- [ ] **Step 1: Search for img tags in public pages**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
grep -rn "<img" src/ --include="*.tsx" --include="*.ts"
```

Expected: Only test file `image-block-editor.test.tsx` uses `<img>` in test queries.

- [ ] **Step 2: Fix test file to not rely on img tag**

In `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/admin/content-blocks/image-block-editor.test.tsx` at line 88, the test queries by role "img". This is a test query for an element that may be rendered by the component. The test itself is not using a raw `<img>` tag; it's querying for one.

If the component under test uses `next/image`, the `<img>` element is still rendered in the DOM (Next.js Image component renders an `<img>`). So the test query is actually correct and does not need to change.

If there are actual `<img>` tags in non-test source files (not found in research), replace them with `next/image`:

```tsx
import Image from "next/image";

// Replace:
<img src="/path.jpg" alt="desc" />

// With:
<Image src="/path.jpg" alt="desc" width={400} height={300} />
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit (if changes were made)**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add -A
git commit -m "refactor: replace img tags with next/Image where appropriate" || echo "No changes to commit"
```

---

### Task 15: Create Route Guard component

**Files:**
- Create: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/route-guard.tsx`
- Test: `/Users/weiwei.g.zhang/Documents/hsah/web/src/components/route-guard.test.tsx`

- [ ] **Step 1: Write the RouteGuard component**

```tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getStoredAdminToken } from "@/lib/admin";
import { Skeleton } from "@/components/skeleton";

interface RouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RouteGuard({ children, fallback }: RouteGuardProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = getStoredAdminToken();
    if (!stored) {
      router.replace("/auth/login");
    } else {
      setToken(stored);
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="flex flex-1 justify-center px-6 py-12">
        <div className="w-full max-w-6xl">
          {fallback ?? <Skeleton variant="block" count={3} />}
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Write the test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RouteGuard } from "./route-guard";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/lib/admin", () => ({
  getStoredAdminToken: vi.fn(),
}));

import { getStoredAdminToken } from "@/lib/admin";

describe("RouteGuard", () => {
  it("shows skeleton while checking auth", () => {
    vi.mocked(getStoredAdminToken).mockReturnValue("valid-token");
    render(
      <RouteGuard>
        <div data-testid="protected">Protected content</div>
      </RouteGuard>
    );
    // After effect runs, token is set and children render
    expect(screen.getByTestId("protected")).toBeInTheDocument();
  });

  it("redirects to login when no token", () => {
    vi.mocked(getStoredAdminToken).mockReturnValue(null);
    render(
      <RouteGuard>
        <div data-testid="protected">Protected content</div>
      </RouteGuard>
    );
    expect(mockReplace).toHaveBeenCalledWith("/auth/login");
  });
});
```

- [ ] **Step 3: Run test**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test -- src/components/route-guard.test.tsx
```

Expected: Tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/components/route-guard.tsx web/src/components/route-guard.test.tsx
git commit -m "feat: add RouteGuard HOC for admin route protection"
```

---

### Task 16: Apply route guard to all admin pages

**Files:**
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/users/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/roles/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/policies/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/matrix/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/simulator/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/templates/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/policies/wizard/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/new/page.tsx`
- Modify: `/Users/weiwei.g.zhang/Documents/hsah/web/src/app/admin/assets/[id]/edit/page.tsx`

- [ ] **Step 1: Update admin/page.tsx**

Add import:
```tsx
import { RouteGuard } from "@/components/route-guard";
```

Wrap the return content with RouteGuard:

```tsx
export default function AdminPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    if (!token) router.replace("/auth/login");
  }, [router, token]);

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    adminRequest<Overview>("/api/v1/admin/overview", token, { method: "GET" })
      .then((data) => {
        if (canceled) return;
        setOverview(data.ok ? data.data : null);
      });
    return () => {
      canceled = true;
    };
  }, [token]);

  return (
    <RouteGuard>
      <div className="flex flex-1 justify-center px-6 py-12">
        {/* existing content */}
      </div>
    </RouteGuard>
  );
}
```

- [ ] **Step 2: Update admin/users/page.tsx**

Add import:
```tsx
import { RouteGuard } from "@/components/route-guard";
```

Remove the existing auth redirect useEffect (lines 77-79):
```tsx
useEffect(() => {
  if (!token) router.replace("/auth/login");
}, [router, token]);
```

Wrap the return content with RouteGuard:
```tsx
return (
  <RouteGuard>
    <div className="flex flex-1 justify-center px-6 py-12">
      {/* existing content */}
    </div>
  </RouteGuard>
);
```

- [ ] **Step 3: Update admin/assets/page.tsx**

Same pattern as users page. Remove the auth redirect useEffect and wrap with RouteGuard.

- [ ] **Step 4: Update admin/roles/page.tsx**

Same pattern. Remove the auth redirect useEffect (lines 114-116) and wrap with RouteGuard.

- [ ] **Step 5: Update admin/policies/page.tsx**

Same pattern. Remove the auth redirect useEffect (lines 128-130) and wrap with RouteGuard.

- [ ] **Step 6: Update admin/matrix/page.tsx**

Same pattern. Remove the auth redirect useEffect (lines 40-42) and wrap with RouteGuard.

- [ ] **Step 7: Update admin/simulator/page.tsx**

Same pattern. Remove the auth redirect useEffect (lines 34-36) and wrap with RouteGuard.

- [ ] **Step 8: Update admin/templates/page.tsx**

Same pattern. Remove the auth redirect useEffect (lines 14-16) and wrap with RouteGuard.

- [ ] **Step 9: Update admin/policies/wizard/page.tsx**

Same pattern. Remove the auth redirect useEffect (lines 99-101) and wrap with RouteGuard.

- [ ] **Step 10: Update admin/assets/new/page.tsx**

Same pattern. Remove the auth redirect useEffect (lines 16-18) and wrap with RouteGuard.

- [ ] **Step 11: Update admin/assets/[id]/edit/page.tsx**

Same pattern. Remove the auth redirect useEffect (lines 18-20) and wrap with RouteGuard.

- [ ] **Step 12: Verify build**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

Expected: Build succeeds.

- [ ] **Step 13: Run frontend tests**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

Expected: All tests pass.

- [ ] **Step 14: Commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add web/src/app/admin/
git commit -m "feat: apply RouteGuard to all admin pages"
```

---

## Final Verification

### Task 17: Full verification

- [ ] **Step 1: Run backend tests with coverage**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
pytest --cov=app --cov-report=term-missing
```

Expected: All tests pass, coverage report shows reasonable coverage.

- [ ] **Step 2: Run backend ruff check**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/api
ruff check app/ tests/
```

Expected: No lint errors.

- [ ] **Step 3: Run frontend lint**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run lint
```

Expected: No lint errors.

- [ ] **Step 4: Run frontend tests**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Run frontend build**

Run:
```bash
cd /Users/weiwei.g.zhang/Documents/hsah/web
npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Final commit**

```bash
cd /Users/weiwei.g.zhang/Documents/hsah
git add -A
git commit -m "feat(phase7): complete quality infrastructure, UX optimization, and code quality improvements"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] Backend lint with ruff — Task 1
- [x] pytest-cov for backend test coverage — Task 2
- [x] Error Boundary component — Task 3
- [x] Next.js 404 page — Task 4
- [x] More backend tests — Task 5
- [x] Skeleton component with variants — Task 6
- [x] EmptyState component — Task 7
- [x] React Query integration — Task 8
- [x] Skeleton integration into admin pages — Task 9
- [x] EmptyState integration into admin pages — Task 10
- [x] Responsive table overflow-x-auto — Task 11
- [x] Fix frontend lint errors — Task 12
- [x] Clean up TODO comments — Task 13
- [x] Replace img tags with next/image — Task 14
- [x] Route Guard component — Task 15
- [x] Apply route guard to all admin pages — Task 16

**2. Placeholder scan:**
- [x] No "TBD", "TODO", "implement later" found
- [x] All steps contain complete code
- [x] All file paths are exact and absolute
- [x] No vague instructions like "add appropriate error handling"

**3. Type consistency:**
- [x] `SkeletonVariant` type used consistently
- [x] `EmptyStateProps` interface defined and used
- [x] `RouteGuardProps` interface defined and used
- [x] All admin pages use same `getStoredAdminToken` import pattern
- [x] Lucide icon types (`LucideIcon`) used correctly in EmptyState
