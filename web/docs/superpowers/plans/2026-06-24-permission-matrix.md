# Permission Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only Admin `Permission Matrix` that visualizes effective permission decisions by role, supports resource-context filtering and permission search, and links operators back to `Roles`, `Policies`, and `Simulator`.

**Architecture:** Keep the decision logic in a pure TypeScript helper so matrix aggregation can be tested independently from the UI. Build the page as a client route under `src/app/admin/matrix`, reusing existing Admin fetch helpers and the current dark glass UI system, with matrix presentation and detail rendering split into focused components.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, `lucide-react`, Vitest

---

## File Map

- `src/lib/admin-permission-matrix.ts`: matrix types, filter derivation, aggregation, precedence logic
- `src/lib/admin-permission-matrix.test.ts`: pure helper tests for precedence and filtering
- `vitest.config.ts`: lightweight frontend test runner config for pure TypeScript helpers
- `package.json`: add test script and Vitest dev dependency
- `src/app/admin/page.tsx`: add `Permission Matrix` entry card
- `src/app/admin/matrix/page.tsx`: page shell, auth redirect, data loading, page state
- `src/components/admin/permission-matrix-table.tsx`: table renderer for row/column matrix
- `src/components/admin/permission-matrix-detail.tsx`: detail panel for selected cell
- `src/lib/admin.ts`: optional shared parsing helpers if matrix page needs reusable record-to-schema conversion

### Task 1: Add a minimal frontend test harness for matrix logic

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Add the failing test command contract**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 2: Add a minimal Vitest config for pure helper tests**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text"],
    },
  },
});
```

- [ ] **Step 3: Install dependencies and verify the command fails before helper code exists**

Run:

```bash
npm install
npm run test
```

Expected: FAIL with “No test files found” or missing matrix helper test, confirming the new test command is wired but the feature tests are not implemented yet.

- [ ] **Step 4: Commit the test harness bootstrap**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add vitest harness for admin matrix helpers"
```

### Task 2: Build and test pure matrix aggregation logic

**Files:**
- Create: `src/lib/admin-permission-matrix.ts`
- Create: `src/lib/admin-permission-matrix.test.ts`

- [ ] **Step 1: Write failing matrix precedence tests**

```ts
import { describe, expect, it } from "vitest";
import { buildPermissionMatrix } from "@/lib/admin-permission-matrix";

describe("buildPermissionMatrix", () => {
  it("prefers deny over allow for the same role and permission", () => {
    const result = buildPermissionMatrix({
      roles: [{ id: "r1", name: "ops" }],
      policies: [
        {
          id: "p-allow",
          name: "allow-public-read",
          effect: "allow",
          permissions: ["assets.read"],
          role_names: ["ops"],
          resource_type: "asset",
          resource_visibility: "public",
        },
        {
          id: "p-deny",
          name: "deny-public-read",
          effect: "deny",
          permissions: ["assets.read"],
          role_names: ["ops"],
          resource_type: "asset",
          resource_visibility: "public",
        },
      ],
      filters: { resourceType: "asset", resourceVisibility: "public", search: "" },
    });

    expect(result.cells["assets.read"].ops.decision).toBe("deny");
    expect(result.cells["assets.read"].ops.matchedPolicies).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Add tests for implicit decisions, global policies, and search filtering**

```ts
it("returns implicit when no policy matches", () => {
  const result = buildPermissionMatrix({
    roles: [{ id: "r1", name: "ops" }],
    policies: [],
    filters: { resourceType: "asset", resourceVisibility: "public", search: "" },
  });

  expect(result.permissionKeys).toEqual([]);
});

it("applies policy rows with empty role_names to every role", () => {
  const result = buildPermissionMatrix({
    roles: [{ id: "r1", name: "ops" }, { id: "r2", name: "audit" }],
    policies: [
      {
        id: "p-global",
        name: "global-read",
        effect: "allow",
        permissions: ["assets.read"],
        role_names: [],
        resource_type: "asset",
        resource_visibility: "public",
      },
    ],
    filters: { resourceType: "asset", resourceVisibility: "public", search: "" },
  });

  expect(result.cells["assets.read"].ops.decision).toBe("allow");
  expect(result.cells["assets.read"].audit.decision).toBe("allow");
});
```

- [ ] **Step 3: Implement the minimal helper to make the tests pass**

```ts
export type MatrixRole = { id: string; name: string };

export type MatrixPolicy = {
  id: string;
  name: string;
  effect: "allow" | "deny";
  permissions: string[];
  role_names: string[];
  resource_type: string | null;
  resource_visibility: string | null;
};

export type MatrixFilters = {
  resourceType: string | null;
  resourceVisibility: string | null;
  search: string;
};

export function buildPermissionMatrix({
  roles,
  policies,
  filters,
}: {
  roles: MatrixRole[];
  policies: MatrixPolicy[];
  filters: MatrixFilters;
}) {
  // derive permission keys from matching policies, then compute deny > allow > implicit
}
```

- [ ] **Step 4: Run the helper tests and confirm they pass**

Run:

```bash
npm run test -- src/lib/admin-permission-matrix.test.ts
```

Expected: PASS with all precedence and filtering cases green.

- [ ] **Step 5: Commit the aggregation core**

```bash
git add src/lib/admin-permission-matrix.ts src/lib/admin-permission-matrix.test.ts
git commit -m "feat: add permission matrix aggregation helpers"
```

### Task 3: Add the Admin entry and matrix route shell

**Files:**
- Modify: `src/app/admin/page.tsx`
- Create: `src/app/admin/matrix/page.tsx`

- [ ] **Step 1: Add the new Admin overview card**

```tsx
const adminLinks = [
  {
    href: "/admin/matrix",
    title: "Permission Matrix",
    description: "按角色和权限查看有效鉴权结果与命中策略。",
  },
];
```

- [ ] **Step 2: Write the failing page shell using the existing Admin auth pattern**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getStoredAdminToken } from "@/lib/admin";

export default function AdminMatrixPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => getStoredAdminToken());

  useEffect(() => {
    if (!token) router.replace("/auth/login");
  }, [router, token]);

  return <div>Permission Matrix</div>;
}
```

- [ ] **Step 3: Run lint to verify the new route is wired but still incomplete**

Run:

```bash
npm run lint
```

Expected: PASS or only expected unused-variable failures in the new page, proving the route is mounted before the full UI is added.

- [ ] **Step 4: Expand the page shell to load roles and policies**

```tsx
const [roleRows, setRoleRows] = useState<AdminRecord[]>([]);
const [policyRows, setPolicyRows] = useState<AdminRecord[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

async function hydrate(currentToken: string) {
  const [rolesResult, policiesResult] = await Promise.all([
    adminRequest<unknown>("/api/v1/admin/roles", currentToken, { method: "GET" }),
    adminRequest<unknown>("/api/v1/admin/policies", currentToken, { method: "GET" }),
  ]);
}
```

- [ ] **Step 5: Commit the route entry and loading shell**

```bash
git add src/app/admin/page.tsx src/app/admin/matrix/page.tsx
git commit -m "feat: add admin permission matrix route shell"
```

### Task 4: Render the matrix controls, table, and detail panel

**Files:**
- Modify: `src/app/admin/matrix/page.tsx`
- Create: `src/components/admin/permission-matrix-table.tsx`
- Create: `src/components/admin/permission-matrix-detail.tsx`
- Modify: `src/lib/admin.ts`

- [ ] **Step 1: Add shared record-to-schema parsers for roles and policies**

```ts
export function parseAdminRole(record: AdminRecord) {
  return {
    id: pickString(record, ["id"]) ?? "",
    name: pickString(record, ["name"]) ?? "unknown-role",
  };
}

export function parseAdminPolicy(record: AdminRecord) {
  return {
    id: pickString(record, ["id"]) ?? "",
    name: pickString(record, ["name"]) ?? "unknown-policy",
    effect: pickString(record, ["effect"]) === "deny" ? "deny" : "allow",
    permissions: pickStringArray(record, ["permissions"]),
    role_names: pickStringArray(record, ["role_names"]),
    resource_type: pickString(record, ["resource_type"]),
    resource_visibility: pickString(record, ["resource_visibility"]),
  };
}
```

- [ ] **Step 2: Create the matrix table component**

```tsx
export function PermissionMatrixTable({
  roleNames,
  permissionKeys,
  cells,
  selectedKey,
  onSelect,
}: {
  roleNames: string[];
  permissionKeys: string[];
  cells: Record<string, Record<string, { decision: "allow" | "deny" | "implicit" }>>;
  selectedKey: string | null;
  onSelect: (permission: string, role: string) => void;
}) {
  return <div className="overflow-x-auto">...</div>;
}
```

- [ ] **Step 3: Create the cell detail component**

```tsx
export function PermissionMatrixDetail({
  selection,
}: {
  selection:
    | {
        roleName: string;
        permission: string;
        decision: "allow" | "deny" | "implicit";
        reason: string;
        matchedPolicies: Array<{ id: string; name: string; effect: "allow" | "deny" }>;
      }
    | null;
}) {
  if (!selection) return <div>Select a matrix cell to inspect policy sources.</div>;
  return <div>{selection.permission}</div>;
}
```

- [ ] **Step 4: Wire filters, matrix derivation, and selected-cell state in the page**

```tsx
const [search, setSearch] = useState("");
const [resourceType, setResourceType] = useState<string | null>("asset");
const [resourceVisibility, setResourceVisibility] = useState<string | null>("public");
const [selectedCell, setSelectedCell] = useState<{ permission: string; roleName: string } | null>(null);

const matrix = useMemo(() => {
  return buildPermissionMatrix({
    roles: roleRows.map(parseAdminRole),
    policies: policyRows.map(parseAdminPolicy),
    filters: { resourceType, resourceVisibility, search },
  });
}, [policyRows, resourceType, resourceVisibility, roleRows, search]);
```

- [ ] **Step 5: Verify the new page behavior**

Run:

```bash
npm run test -- src/lib/admin-permission-matrix.test.ts
npm run lint
```

Expected: PASS. The matrix page should compile cleanly, and helper logic should still pass all tests after page integration.

- [ ] **Step 6: Commit the complete matrix UI**

```bash
git add src/app/admin/matrix/page.tsx src/components/admin/permission-matrix-table.tsx src/components/admin/permission-matrix-detail.tsx src/lib/admin.ts
git commit -m "feat: add admin permission matrix ui"
```

### Task 5: Run full verification and capture handoff notes

**Files:**
- Modify: none

- [ ] **Step 1: Run the targeted test suite**

Run:

```bash
npm run test -- src/lib/admin-permission-matrix.test.ts
```

Expected: PASS with matrix precedence, global-policy, and filter cases green.

- [ ] **Step 2: Run lint and production build**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS for both commands, with `/admin/matrix` present in the Next.js route output.

- [ ] **Step 3: Manually verify the page against real Admin data**

Run:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001 npm run dev -- --port 3003
```

Then verify:

```text
1. Login with an admin token-capable account.
2. Open /admin and confirm the Permission Matrix card appears.
3. Open /admin/matrix and confirm roles, policies, and permission counts load.
4. Click a matrix cell and confirm matched policies plus reason render.
5. Change resource type or visibility and confirm the matrix recalculates.
6. Use the search box and confirm only matching permission rows remain.
7. Open the Roles, Policies, and Simulator links from the detail panel.
```

- [ ] **Step 4: Record the delivery summary**

```text
Include:
- changed files
- test results
- lint result
- build result
- manual verification notes
- any follow-up gaps deferred to Phase 2 Policy Wizard
```

- [ ] **Step 5: Commit the verification pass**

```bash
git add .
git commit -m "chore: verify permission matrix delivery"
```
