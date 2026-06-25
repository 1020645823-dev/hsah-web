export type PolicyWizardEffect = "allow" | "deny";

export type PolicyWizardTemplateId =
  | "blank"
  | "allow-public-asset-read"
  | "deny-restricted-asset-read"
  | "deny-public-asset-write";

export type PolicyWizardDraft = {
  name: string;
  effect: PolicyWizardEffect;
  permissionsText: string;
  permissions: string[];
  roleNamesText: string;
  roleNames: string[];
  resourceType: string;
  resourceVisibility: string;
};

export function normalizeCommaList(input: string) {
  const items = input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set(items)];
}

export function normalizePermissions(input: string) {
  return normalizeCommaList(input);
}

export function normalizeRoleNames(input: string) {
  return normalizeCommaList(input);
}

export function applyWizardTemplate(
  draft: PolicyWizardDraft,
  templateId: PolicyWizardTemplateId,
): PolicyWizardDraft {
  if (templateId === "allow-public-asset-read") {
    return {
      ...draft,
      effect: "allow",
      permissionsText: "assets.read",
      permissions: ["assets.read"],
      resourceType: "asset",
      resourceVisibility: "public",
    };
  }

  if (templateId === "deny-restricted-asset-read") {
    return {
      ...draft,
      effect: "deny",
      permissionsText: "assets.read",
      permissions: ["assets.read"],
      resourceType: "asset",
      resourceVisibility: "restricted",
    };
  }

  if (templateId === "deny-public-asset-write") {
    return {
      ...draft,
      effect: "deny",
      permissionsText: "assets.write",
      permissions: ["assets.write"],
      resourceType: "asset",
      resourceVisibility: "public",
    };
  }

  return {
    ...draft,
    permissionsText: "",
    permissions: [],
    roleNamesText: "",
    roleNames: [],
    resourceType: "",
    resourceVisibility: "",
  };
}

export function buildPolicyCreatePayload(draft: PolicyWizardDraft) {
  const resourceType = draft.resourceType.trim();
  const resourceVisibility = draft.resourceVisibility.trim();

  return {
    name: draft.name.trim(),
    effect: draft.effect,
    permissions: draft.permissions,
    role_names: draft.roleNames,
    resource_type: resourceType ? resourceType : null,
    resource_visibility: resourceVisibility ? resourceVisibility : null,
  };
}

export function validateWizardDraft(draft: PolicyWizardDraft, step: 0 | 1 | 2 | 3) {
  if (step >= 1) {
    if (!draft.name.trim()) return { ok: false as const, message: "请填写策略名称。" };
    if (draft.effect !== "allow" && draft.effect !== "deny") {
      return { ok: false as const, message: "请选择 effect。" };
    }
  }

  if (step >= 2) {
    if (draft.permissions.length < 1) {
      return { ok: false as const, message: "至少需要 1 个 permission。" };
    }
  }

  return { ok: true as const };
}
