import { describe, expect, test } from "vitest";

import {
  type AssetEditorDraft,
  INITIAL_DRAFT,
  validateDraft,
  buildPayload,
  parseAssetToDraft,
  areDraftsEqual,
} from "./admin-asset-editor";


const validDraft: AssetEditorDraft = {
  slug: "test-asset",
  title: "Test Asset",
  subtitle: "Test Subtitle",
  shortDescription: "Test description",
  cloudProviders: ["aws"],
  industries: ["finance"],
  technologies: ["react"],
  assetType: "solution",
  status: "draft",
  visibility: "public",
  allowedRoles: ["admin"],
  allowedUsers: ["user1"],
  contentSchemaVersion: 2,
  contentBlocks: [],
};

describe("validateDraft", () => {
  test("returns valid for correct draft", () => {
    const result = validateDraft(validDraft);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test("reports missing slug", () => {
    const result = validateDraft({ ...validDraft, slug: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.slug).toBe("必填");
  });

  test("reports invalid slug format", () => {
    const result = validateDraft({ ...validDraft, slug: "INVALID_SLUG" });
    expect(result.valid).toBe(false);
    expect(result.errors.slug).toBe("只能包含小写字母、数字和连字符");
  });

  test("reports slug exceeding 200 characters", () => {
    const result = validateDraft({ ...validDraft, slug: "a".repeat(201) });
    expect(result.valid).toBe(false);
    expect(result.errors.slug).toBe("最多 200 个字符");
  });

  test("reports missing title", () => {
    const result = validateDraft({ ...validDraft, title: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBe("必填");
  });

  test("allows empty subtitle as optional", () => {
    const result = validateDraft({ ...validDraft, subtitle: "" });
    expect(result.valid).toBe(true);
  });

  test("reports subtitle exceeding 300 characters", () => {
    const result = validateDraft({ ...validDraft, subtitle: "x".repeat(301) });
    expect(result.valid).toBe(false);
    expect(result.errors.subtitle).toBe("最多 300 个字符");
  });

  test("reports missing shortDescription", () => {
    const result = validateDraft({ ...validDraft, shortDescription: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.shortDescription).toBe("必填");
  });

  test("reports shortDescription exceeding 500 characters", () => {
    const result = validateDraft({ ...validDraft, shortDescription: "x".repeat(501) });
    expect(result.valid).toBe(false);
    expect(result.errors.shortDescription).toBe("最多 500 个字符");
  });

  test("allows empty cloudProviders as optional", () => {
    const result = validateDraft({ ...validDraft, cloudProviders: [] });
    expect(result.valid).toBe(true);
  });

  test("allows empty industries as optional", () => {
    const result = validateDraft({ ...validDraft, industries: [] });
    expect(result.valid).toBe(true);
  });

  test("allows empty technologies as optional", () => {
    const result = validateDraft({ ...validDraft, technologies: [] });
    expect(result.valid).toBe(true);
  });

  test("allows empty allowedRoles as optional", () => {
    const result = validateDraft({ ...validDraft, allowedRoles: [] });
    expect(result.valid).toBe(true);
  });

  test("allows empty allowedUsers as optional", () => {
    const result = validateDraft({ ...validDraft, allowedUsers: [] });
    expect(result.valid).toBe(true);
  });

  test("reports invalid assetType", () => {
    const result = validateDraft({ ...validDraft, assetType: "invalid" });
    expect(result.valid).toBe(false);
    expect(result.errors.assetType).toBe("无效的资产类型");
  });

  test("reports invalid status", () => {
    const result = validateDraft({ ...validDraft, status: "invalid" });
    expect(result.valid).toBe(false);
    expect(result.errors.status).toBe("无效的状态");
  });

  test("reports invalid visibility", () => {
    const result = validateDraft({ ...validDraft, visibility: "invalid" });
    expect(result.valid).toBe(false);
    expect(result.errors.visibility).toBe("无效的可见性");
  });
});

describe("buildPayload", () => {
  test("converts camelCase to snake_case", () => {
    const payload = buildPayload(validDraft);
    expect(payload).toEqual({
      slug: "test-asset",
      title: "Test Asset",
      subtitle: "Test Subtitle",
      short_description: "Test description",
      cloud_providers: ["aws"],
      industries: ["finance"],
      technologies: ["react"],
      asset_type: "solution",
      status: "draft",
      visibility: "public",
      allowed_roles: ["admin"],
      allowed_users: ["user1"],
      content_schema_version: 2,
      content_blocks: [],
    });
  });

  test("deduplicates arrays", () => {
    const payload = buildPayload({
      ...validDraft,
      cloudProviders: ["aws", "aws", "gcp"],
      industries: ["finance", "finance"],
      technologies: ["react", "react", "vue"],
    });
    expect(payload.cloud_providers).toEqual(["aws", "gcp"]);
    expect(payload.industries).toEqual(["finance"]);
    expect(payload.technologies).toEqual(["react", "vue"]);
  });

  test("trims array values and filters empty", () => {
    const payload = buildPayload({
      ...validDraft,
      cloudProviders: [" aws ", "", "  ", "gcp"],
    });
    expect(payload.cloud_providers).toEqual(["aws", "gcp"]);
  });

  test("trims string values", () => {
    const payload = buildPayload({
      ...validDraft,
      slug: "  test-asset  ",
      title: "  Test Asset  ",
      subtitle: "  Test Subtitle  ",
      shortDescription: "  Test description  ",
    });
    expect(payload.slug).toBe("test-asset");
    expect(payload.title).toBe("Test Asset");
    expect(payload.subtitle).toBe("Test Subtitle");
    expect(payload.short_description).toBe("Test description");
  });

  test("sets content_blocks to empty array", () => {
    const payload = buildPayload(validDraft);
    expect(payload.content_blocks).toEqual([]);
  });

  test("converts contentBlocks to content_blocks format", () => {
    const draftWithBlocks: AssetEditorDraft = {
      ...validDraft,
      contentBlocks: [
        {
          id: "block-1",
          type: "text",
          version: 2,
          order: 0,
          visible: true,
          config: { markdown: "# Hello", html: "" },
        },
        {
          id: "block-2",
          type: "stat_card",
          version: 2,
          order: 1,
          visible: true,
          config: {
            title: "KPIs",
            stats: [{ label: "Users", value: "1000", description: "" }],
          },
        },
      ],
    };
    const payload = buildPayload(draftWithBlocks);
    expect(payload.content_blocks).toHaveLength(2);
    expect(payload.content_blocks[0]).toEqual({
      id: "block-1",
      type: "text",
      version: 2,
      order: 0,
      visible: true,
      config: { markdown: "# Hello", html: "" },
    });
    expect(payload.content_blocks[1]).toEqual({
      id: "block-2",
      type: "stat_card",
      version: 2,
      order: 1,
      visible: true,
      config: {
        title: "KPIs",
        stats: [{ label: "Users", value: "1000", description: "" }],
      },
    });
  });

  test("filters out invisible content blocks", () => {
    const draftWithBlocks: AssetEditorDraft = {
      ...validDraft,
      contentBlocks: [
        {
          id: "block-1",
          type: "text",
          version: 2,
          order: 0,
          visible: true,
          config: { markdown: "# Visible", html: "" },
        },
        {
          id: "block-2",
          type: "text",
          version: 2,
          order: 1,
          visible: false,
          config: { markdown: "# Hidden", html: "" },
        },
      ],
    };
    const payload = buildPayload(draftWithBlocks);
    expect(payload.content_blocks).toHaveLength(1);
    expect(payload.content_blocks[0].id).toBe("block-1");
  });
  test("sets subtitle to null when empty", () => {
    const payload = buildPayload({ ...validDraft, subtitle: "" });
    expect(payload.subtitle).toBeNull();
  });
});

describe("parseAssetToDraft", () => {
  test("converts snake_case to camelCase", () => {
    const asset = {
      slug: "test-asset",
      title: "Test Asset",
      subtitle: "Test Subtitle",
      short_description: "Test description",
      cloud_providers: ["aws"],
      industries: ["finance"],
      technologies: ["react"],
      asset_type: "solution",
      status: "draft",
      visibility: "public",
      allowed_roles: ["admin"],
      allowed_users: ["user1"],
    };
    const draft = parseAssetToDraft(asset);
    expect(draft).toEqual({
      slug: "test-asset",
      title: "Test Asset",
      subtitle: "Test Subtitle",
      shortDescription: "Test description",
      cloudProviders: ["aws"],
      industries: ["finance"],
      technologies: ["react"],
      assetType: "solution",
      status: "draft",
      visibility: "public",
      allowedRoles: ["admin"],
      allowedUsers: ["user1"],
      contentSchemaVersion: 2,
      contentBlocks: [],
    });
  });

  test("applies defaults for missing fields", () => {
    const asset = {
      slug: "test-asset",
      title: "Test Asset",
    };
    const draft = parseAssetToDraft(asset);
    expect(draft.slug).toBe("test-asset");
    expect(draft.title).toBe("Test Asset");
    expect(draft.assetType).toBe(INITIAL_DRAFT.assetType);
    expect(draft.status).toBe(INITIAL_DRAFT.status);
    expect(draft.visibility).toBe(INITIAL_DRAFT.visibility);
    expect(draft.contentSchemaVersion).toBe(INITIAL_DRAFT.contentSchemaVersion);
  });

  test("handles missing arrays", () => {
    const asset = {};
    const draft = parseAssetToDraft(asset);
    expect(draft.cloudProviders).toEqual([]);
    expect(draft.industries).toEqual([]);
    expect(draft.technologies).toEqual([]);
    expect(draft.allowedRoles).toEqual([]);
    expect(draft.allowedUsers).toEqual([]);
    expect(draft.contentBlocks).toEqual([]);
  });

  test("parses content_blocks from API format", () => {
    const asset = {
      slug: "test-asset",
      title: "Test Asset",
      content_schema_version: 2,
      content_blocks: [
        {
          id: "blk-1",
          type: "text",
          version: 2,
          order: 0,
          visible: true,
          config: { markdown: "# Hello World", html: "" },
        },
        {
          id: "blk-2",
          type: "stat_card",
          version: 2,
          order: 1,
          visible: true,
          config: {
            title: "KPIs",
            stats: [{ label: "Users", value: "1000", description: "" }],
          },
        },
      ],
    };
    const draft = parseAssetToDraft(asset);
    expect(draft.contentSchemaVersion).toBe(2);
    expect(draft.contentBlocks).toHaveLength(2);
    expect(draft.contentBlocks[0]).toEqual({
      id: "blk-1",
      type: "text",
      version: 2,
      order: 0,
      visible: true,
      config: { markdown: "# Hello World", html: "" },
    });
    expect(draft.contentBlocks[1]).toEqual({
      id: "blk-2",
      type: "stat_card",
      version: 2,
      order: 1,
      visible: true,
      config: {
        title: "KPIs",
        stats: [{ label: "Users", value: "1000", description: "" }],
      },
    });
  });

  test("handles empty content_blocks", () => {
    const asset = {
      slug: "test-asset",
      title: "Test Asset",
      content_blocks: [],
    };
    const draft = parseAssetToDraft(asset);
    expect(draft.contentBlocks).toEqual([]);
  });

  test("handles missing content_blocks", () => {
    const asset = {
      slug: "test-asset",
      title: "Test Asset",
    };
    const draft = parseAssetToDraft(asset);
    expect(draft.contentBlocks).toEqual([]);
  });

  test("skips invalid block types in content_blocks", () => {
    const asset = {
      slug: "test-asset",
      title: "Test Asset",
      content_blocks: [
        { id: "blk-x", type: "unknown_type", version: 2, order: 0, visible: true, config: {} },
        {
          id: "blk-y",
          type: "text",
          version: 2,
          order: 1,
          visible: true,
          config: { markdown: "ok", html: "" },
        },
      ],
    };
    const draft = parseAssetToDraft(asset);
    expect(draft.contentBlocks).toHaveLength(1);
    expect(draft.contentBlocks[0].id).toBe("blk-y");
  });

  test("parses latest versioned content blocks into the draft", () => {
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
});

describe("buildPayload versioned blocks", () => {
  test("builds payload with content schema version and full block wrapper", () => {
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
});

describe("areDraftsEqual", () => {
  test("returns true for identical drafts", () => {
    expect(areDraftsEqual(validDraft, validDraft)).toBe(true);
  });

  test("returns false for different string fields", () => {
    const different = { ...validDraft, title: "Different" };
    expect(areDraftsEqual(validDraft, different)).toBe(false);
  });

  test("returns false for different array lengths", () => {
    const different = { ...validDraft, cloudProviders: ["aws", "gcp"] };
    expect(areDraftsEqual(validDraft, different)).toBe(false);
  });

  test("returns false for different array values", () => {
    const different = { ...validDraft, cloudProviders: ["gcp"] };
    expect(areDraftsEqual(validDraft, different)).toBe(false);
  });
});
