import { describe, expect, it } from "vitest";

import {
  buildPermissionMatrix,
  type MatrixFilters,
  type MatrixPolicy,
  type MatrixRole,
} from "./admin-permission-matrix";

const roles: MatrixRole[] = [
  { id: "r1", name: "ops" },
  { id: "r2", name: "audit" },
];

function buildMatrix({
  policies,
  filters,
}: {
  policies: MatrixPolicy[];
  filters?: Partial<MatrixFilters>;
}) {
  return buildPermissionMatrix({
    roles,
    policies,
    filters: {
      resourceType: "asset",
      resourceVisibility: "public",
      search: "",
      ...filters,
    },
  });
}

describe("buildPermissionMatrix", () => {
  it("在同一角色和权限上按 deny > allow > implicit 聚合", () => {
    const result = buildMatrix({
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
    });

    expect(result.roleNames).toEqual(["ops", "audit"]);
    expect(result.permissionKeys).toEqual(["assets.read"]);
    expect(result.cells["assets.read"].ops.decision).toBe("deny");
    expect(result.cells["assets.read"].ops.reason).toBe("matched_deny_policy");
    expect(result.cells["assets.read"].ops.matchedPolicies).toHaveLength(2);
    expect(result.cells["assets.read"].audit.decision).toBe("implicit");
    expect(result.cells["assets.read"].audit.reason).toBe("no_matching_policy");
    expect(result.cells["assets.read"].audit.matchedPolicies).toEqual([]);
  });

  it("把空 role_names 的策略作为全局策略应用到所有角色", () => {
    const result = buildMatrix({
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
    });

    expect(result.permissionKeys).toEqual(["assets.read"]);
    expect(result.cells["assets.read"].ops.decision).toBe("allow");
    expect(result.cells["assets.read"].audit.decision).toBe("allow");
    expect(result.cells["assets.read"].ops.reason).toBe("matched_allow_policy");
    expect(result.cells["assets.read"].audit.reason).toBe("matched_allow_policy");
  });

  it("按资源上下文和搜索词过滤权限行，但不改变已匹配单元格的优先级", () => {
    const result = buildMatrix({
      policies: [
        {
          id: "p-asset-read",
          name: "allow-public-read",
          effect: "allow",
          permissions: ["assets.read"],
          role_names: ["ops"],
          resource_type: "asset",
          resource_visibility: "public",
        },
        {
          id: "p-asset-write",
          name: "deny-public-write",
          effect: "deny",
          permissions: ["assets.write"],
          role_names: ["ops"],
          resource_type: "asset",
          resource_visibility: "public",
        },
        {
          id: "p-private",
          name: "allow-private-read",
          effect: "allow",
          permissions: ["assets.private.read"],
          role_names: ["ops"],
          resource_type: "asset",
          resource_visibility: "private",
        },
        {
          id: "p-scenario",
          name: "allow-scenario-read",
          effect: "allow",
          permissions: ["scenarios.read"],
          role_names: ["ops"],
          resource_type: "scenario",
          resource_visibility: "public",
        },
      ],
      filters: {
        resourceType: "asset",
        resourceVisibility: "public",
        search: "write",
      },
    });

    expect(result.permissionKeys).toEqual(["assets.write"]);
    expect(result.cells["assets.write"].ops.decision).toBe("deny");
    expect(result.cells["assets.write"].ops.reason).toBe("matched_deny_policy");
    expect(result.cells["assets.write"].ops.matchedPolicies.map((policy) => policy.id)).toEqual([
      "p-asset-write",
    ]);
    expect(result.resourceTypeOptions).toEqual(["asset", "scenario"]);
    expect(result.resourceVisibilityOptions).toEqual(["private", "public"]);
  });
});
