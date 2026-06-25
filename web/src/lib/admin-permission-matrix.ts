export type MatrixDecision = "allow" | "deny" | "implicit";

export type MatrixRole = {
  id: string;
  name: string;
};

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

export type MatrixMatchedPolicy = Pick<MatrixPolicy, "id" | "name" | "effect">;

export type MatrixCell = {
  decision: MatrixDecision;
  matchedPolicies: MatrixMatchedPolicy[];
  reason: "matched_deny_policy" | "matched_allow_policy" | "no_matching_policy";
};

export type PermissionMatrixResult = {
  roleNames: string[];
  permissionKeys: string[];
  resourceTypeOptions: string[];
  resourceVisibilityOptions: string[];
  cells: Record<string, Record<string, MatrixCell>>;
};

function normalizeOptionalValue(value: string | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function matchesOptionalFilter(policyValue: string | null, filterValue: string | null) {
  const normalizedPolicyValue = normalizeOptionalValue(policyValue);
  const normalizedFilterValue = normalizeOptionalValue(filterValue);

  if (!normalizedFilterValue) return true;
  if (!normalizedPolicyValue) return true;
  return normalizedPolicyValue === normalizedFilterValue;
}

function matchesRole(policy: MatrixPolicy, roleName: string) {
  return policy.role_names.length === 0 || policy.role_names.includes(roleName);
}

function toMatchedPolicy(policy: MatrixPolicy): MatrixMatchedPolicy {
  return {
    id: policy.id,
    name: policy.name,
    effect: policy.effect,
  };
}

function deriveDecision(matchedPolicies: MatrixMatchedPolicy[]): MatrixCell {
  if (matchedPolicies.some((policy) => policy.effect === "deny")) {
    return {
      decision: "deny",
      matchedPolicies,
      reason: "matched_deny_policy",
    };
  }

  if (matchedPolicies.some((policy) => policy.effect === "allow")) {
    return {
      decision: "allow",
      matchedPolicies,
      reason: "matched_allow_policy",
    };
  }

  return {
    decision: "implicit",
    matchedPolicies: [],
    reason: "no_matching_policy",
  };
}

export function buildPermissionMatrix({
  roles,
  policies,
  filters,
}: {
  roles: MatrixRole[];
  policies: MatrixPolicy[];
  filters: MatrixFilters;
}): PermissionMatrixResult {
  const roleNames = roles.map((role) => role.name);
  const normalizedSearch = filters.search.trim().toLowerCase();

  const resourceTypeOptions = [...new Set(
    policies
      .map((policy) => normalizeOptionalValue(policy.resource_type))
      .filter((value): value is string => value !== null),
  )].sort((left, right) => left.localeCompare(right));

  const resourceVisibilityOptions = [...new Set(
    policies
      .map((policy) => normalizeOptionalValue(policy.resource_visibility))
      .filter((value): value is string => value !== null),
  )].sort((left, right) => left.localeCompare(right));

  const contextPolicies = policies.filter((policy) => {
    return (
      matchesOptionalFilter(policy.resource_type, filters.resourceType) &&
      matchesOptionalFilter(policy.resource_visibility, filters.resourceVisibility)
    );
  });

  const permissionKeys = [...new Set(
    contextPolicies.flatMap((policy) => policy.permissions),
  )]
    .filter((permission) =>
      normalizedSearch ? permission.toLowerCase().includes(normalizedSearch) : true,
    )
    .sort((left, right) => left.localeCompare(right));

  const cells: PermissionMatrixResult["cells"] = {};

  for (const permissionKey of permissionKeys) {
    cells[permissionKey] = {};

    for (const roleName of roleNames) {
      const matchedPolicies = contextPolicies
        .filter((policy) => matchesRole(policy, roleName) && policy.permissions.includes(permissionKey))
        .map(toMatchedPolicy);

      cells[permissionKey][roleName] = deriveDecision(matchedPolicies);
    }
  }

  return {
    roleNames,
    permissionKeys,
    resourceTypeOptions,
    resourceVisibilityOptions,
    cells,
  };
}
