import { describe, expect, test } from "vitest";

import {
  type AssetEditorDraft,
  INITIAL_DRAFT,
  validateDraft,
  buildPayload,
  parseAssetToDraft,
  areDraftsEqual,
} from "./admin-asset-editor";
import type { ContentBlock } from "./admin-content-blocks";

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
          order: 0,
          visible: true,
          config: { markdown: "# Hello" },
        },
        {
          id: "block-2",
          type: "stat_card",
          order: 1,
          visible: true,
          config: { items: [{ label: "Users", value: "1000" }] },
        },
      ],
    };
    const payload = buildPayload(draftWithBlocks);
    expect(payload.content_blocks).toHaveLength(2);
    expect(payload.content_blocks[0]).toEqual({
      block_type: "text",
      block_id: "block-1",
      config: { markdown: "# Hello" },
    });
    expect(payload.content_blocks[1]).toEqual({
      block_type: "stat_card",
      block_id: "block-2",
      config: { items: [{ label: "Users", value: "1000" }] },
    });
  });

  test("filters out invisible content blocks", () => {
    const draftWithBlocks: AssetEditorDraft = {
      ...validDraft,
      contentBlocks: [
        {
          id: "block-1",
          type: "text",
          order: 0,
          visible: true,
          config: { markdown: "# Visible" },
        },
        {
          id: "block-2",
          type: "text",
          order: 1,
          visible: false,
          config: { markdown: "# Hidden" },
        },
      ],
    };
    const payload = buildPayload(draftWithBlocks);
    expect(payload.content_blocks).toHaveLength(1);
    expect(payload.content_blocks[0].block_id).toBe("block-1");
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
      content_blocks: [
        {
          block_type: "text",
          block_id: "blk-1",
          config: { markdown: "# Hello World" },
        },
        {
          block_type: "stat_card",
          block_id: "blk-2",
          config: { items: [{ label: "Users", value: "1000" }] },
        },
      ],
    };
    const draft = parseAssetToDraft(asset);
    expect(draft.contentBlocks).toHaveLength(2);
    expect(draft.contentBlocks[0]).toEqual({
      id: "blk-1",
      type: "text",
      order: 0,
      visible: true,
      config: { markdown: "# Hello World" },
    });
    expect(draft.contentBlocks[1]).toEqual({
      id: "blk-2",
      type: "stat_card",
      order: 1,
      visible: true,
      config: { items: [{ label: "Users", value: "1000" }] },
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
        { block_type: "unknown_type", block_id: "blk-x", config: {} },
        { block_type: "text", block_id: "blk-y", config: { markdown: "ok" } },
      ],
    };
    const draft = parseAssetToDraft(asset);
    expect(draft.contentBlocks).toHaveLength(1);
    expect(draft.contentBlocks[0].id).toBe("blk-y");
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
