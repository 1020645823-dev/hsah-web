import { describe, expect, it } from "vitest";

import {
  applyWizardTemplate,
  normalizeCommaList,
  normalizePermissions,
  type PolicyWizardDraft,
} from "./admin-policy-wizard";

describe("admin-policy-wizard helpers", () => {
  it("normalizeCommaList trims, removes empties, de-duplicates", () => {
    expect(normalizeCommaList(" a, b , ,a,  ")).toEqual(["a", "b"]);
  });

  it("normalizePermissions accepts comma text and returns stable list", () => {
    expect(normalizePermissions("assets.read, assets.write")).toEqual([
      "assets.read",
      "assets.write",
    ]);
  });

  it("applyWizardTemplate sets effect, permissions and resource scope", () => {
    const draft: PolicyWizardDraft = {
      name: "",
      effect: "allow",
      permissionsText: "",
      permissions: [],
      roleNamesText: "",
      roleNames: [],
      resourceType: "",
      resourceVisibility: "",
    };

    const next = applyWizardTemplate(draft, "deny-public-asset-write");
    expect(next.effect).toBe("deny");
    expect(next.permissions).toEqual(["assets.write"]);
    expect(next.resourceType).toBe("asset");
    expect(next.resourceVisibility).toBe("public");
  });
});
