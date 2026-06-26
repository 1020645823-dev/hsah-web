"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PermissionMatrixDetail } from "@/components/admin/permission-matrix-detail";
import { PermissionMatrixTable } from "@/components/admin/permission-matrix-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminRequest,
  extractArrayPayload,
  getErrorMessage,
  getStoredAdminToken,
  parseAdminPolicy,
  parseAdminRole,
  type AdminRecord,
} from "@/lib/admin";
import { buildPermissionMatrix } from "@/lib/admin-permission-matrix";
import { Skeleton } from "@/components/skeleton";

type SelectedCell = {
  permission: string;
  roleName: string;
};

export default function AdminMatrixPage() {
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [roleRows, setRoleRows] = useState<AdminRecord[]>([]);
  const [policyRows, setPolicyRows] = useState<AdminRecord[]>([]);
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState<string | null>("asset");
  const [resourceVisibility, setResourceVisibility] = useState<string | null>("public");
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let canceled = false;

    async function hydrate(currentToken: string) {
      setLoading(true);
      setError(null);

      const [rolesResult, policiesResult] = await Promise.all([
        adminRequest<unknown>("/api/v1/admin/roles", currentToken, { method: "GET" }),
        adminRequest<unknown>("/api/v1/admin/policies", currentToken, { method: "GET" }),
      ]);

      if (canceled) return;

      if (rolesResult.ok) {
        setRoleRows(extractArrayPayload(rolesResult.data, ["roles"]));
      } else {
        setRoleRows([]);
      }

      if (policiesResult.ok) {
        setPolicyRows(extractArrayPayload(policiesResult.data, ["policies"]));
      } else {
        setPolicyRows([]);
      }

      const nextError = [rolesResult, policiesResult]
        .filter((result) => !result.ok)
        .map((result) => getErrorMessage(result.data, result.status))
        .join(" ");

      setError(nextError || null);
      setLoading(false);
    }

    void hydrate(token);

    return () => {
      canceled = true;
    };
  }, [token]);

  const roles = useMemo(() => {
    const byName = new Map<string, ReturnType<typeof parseAdminRole>>();

    for (const row of roleRows) {
      const role = parseAdminRole(row);
      if (!role.name || byName.has(role.name)) continue;
      byName.set(role.name, role);
    }

    return [...byName.values()];
  }, [roleRows]);

  const policies = useMemo(() => {
    return policyRows.map(parseAdminPolicy).filter((policy) => policy.permissions.length > 0);
  }, [policyRows]);

  const matrix = useMemo(() => {
    return buildPermissionMatrix({
      roles,
      policies,
      filters: {
        resourceType,
        resourceVisibility,
        search,
      },
    });
  }, [policies, resourceType, resourceVisibility, roles, search]);

  const selectedSelection = useMemo(() => {
    if (!selectedCell) return null;
    const cell = matrix.cells[selectedCell.permission]?.[selectedCell.roleName];
    if (!cell) return null;

    return {
      permission: selectedCell.permission,
      roleName: selectedCell.roleName,
      decision: cell.decision,
      reason: cell.reason,
      matchedPolicies: cell.matchedPolicies,
    };
  }, [matrix.cells, selectedCell]);

  const selectedKey = selectedSelection
    ? `${selectedSelection.permission}::${selectedSelection.roleName}`
    : null;

  const summaryItems = [
    {
      label: "ROLES",
      value: loading ? "…" : String(roles.length),
      description: "按角色名去重后作为矩阵列头，直接反映当前 Admin 角色集合。",
    },
    {
      label: "POLICIES",
      value: loading ? "…" : String(policies.length),
      description: "已解析策略 effect、permission、role scope 与资源上下文，用于矩阵聚合。",
    },
    {
      label: "ROWS",
      value: loading ? "…" : String(matrix.permissionKeys.length),
      description: "当前筛选条件下命中的权限行数，支持 permission 搜索与资源上下文过滤。",
    },
  ];

  return (
    <div className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.18em] text-[var(--color-electric-purple)]">
              ADMIN / PERMISSION MATRIX
            </div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Permission Matrix
            </div>
            <div className="max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
              按角色和策略实时聚合有效权限结果，支持 `resource_type`、`resource_visibility`
              与 permission 搜索，并可选中单元格查看命中策略来源。
            </div>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ← Back
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-3">
          {summaryItems.map((item) => (
            <Card
              key={item.label}
              className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]"
            >
              <CardHeader className="space-y-3">
                <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  {item.label}
                </div>
                <CardTitle className="text-4xl font-semibold text-[var(--color-text-primary)]">
                  {item.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
            <CardHeader>
              <CardTitle className="text-[var(--color-text-primary)]">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="matrix-search" className="text-[var(--color-text-primary)]">
                    Permission Search
                  </Label>
                  <Input
                    id="matrix-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="assets.read"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matrix-resource-type" className="text-[var(--color-text-primary)]">
                    Resource Type
                  </Label>
                  <select
                    id="matrix-resource-type"
                    value={resourceType ?? ""}
                    onChange={(event) => setResourceType(event.target.value || null)}
                    className="flex h-10 w-full rounded-md border border-[rgb(212_218_245_/12%)] bg-[rgb(10_10_16_/70%)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus-visible:border-[rgb(123_63_242_/45%)]"
                  >
                    <option value="">All resource types</option>
                    {matrix.resourceTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="matrix-resource-visibility"
                    className="text-[var(--color-text-primary)]"
                  >
                    Resource Visibility
                  </Label>
                  <select
                    id="matrix-resource-visibility"
                    value={resourceVisibility ?? ""}
                    onChange={(event) => setResourceVisibility(event.target.value || null)}
                    className="flex h-10 w-full rounded-md border border-[rgb(212_218_245_/12%)] bg-[rgb(10_10_16_/70%)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus-visible:border-[rgb(123_63_242_/45%)]"
                  >
                    <option value="">All visibilities</option>
                    {matrix.resourceVisibilityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setResourceType("asset");
                    setResourceVisibility("public");
                    setSelectedCell(null);
                  }}
                  className="rounded-full border border-[rgb(212_218_245_/12%)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[rgb(123_63_242_/35%)] hover:text-[var(--color-text-primary)]"
                >
                  Reset To Plan Defaults
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResourceType(null);
                    setResourceVisibility(null);
                  }}
                  className="rounded-full border border-[rgb(212_218_245_/12%)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[rgb(123_63_242_/35%)] hover:text-[var(--color-text-primary)]"
                >
                  Show All Resources
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
            <CardHeader>
              <CardTitle className="text-[var(--color-text-primary)]">Related Admin Views</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { href: "/admin/roles", label: "Open Roles", note: "查看角色定义与角色元数据。" },
                {
                  href: "/admin/policies",
                  label: "Open Policies",
                  note: "查看策略范围与策略原始返回。",
                },
                {
                  href: "/admin/simulator",
                  label: "Open Simulator",
                  note: "继续联调鉴权请求与决策结果。",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl border border-[rgb(212_218_245_/10%)] bg-black/10 px-4 py-3 transition-colors hover:border-[rgb(123_63_242_/35%)]"
                >
                  <div className="text-sm text-[var(--color-text-primary)]">{item.label}</div>
                  <div className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {item.note}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <Card className="border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/70%)] backdrop-blur-[24px]">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-[var(--color-text-primary)]">Matrix</CardTitle>
                <div className="text-xs tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  {loading
                    ? "LOADING"
                    : `${matrix.permissionKeys.length} ROWS / ${matrix.roleNames.length} COLUMNS`}
                </div>
              </div>
              <div className="text-sm leading-6 text-[var(--color-text-secondary)]">
                单元格按 `deny &gt; allow &gt; implicit` 的优先级聚合；点击任意单元格可查看命中策略。
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Skeleton variant="block" count={4} />
              ) : (
                <PermissionMatrixTable
                  roleNames={matrix.roleNames}
                  permissionKeys={matrix.permissionKeys}
                  cells={matrix.cells}
                  selectedKey={selectedKey}
                  onSelect={(permission, roleName) => setSelectedCell({ permission, roleName })}
                />
              )}
            </CardContent>
          </Card>

          <PermissionMatrixDetail selection={selectedSelection} />
        </div>
      </div>
    </div>
  );
}
