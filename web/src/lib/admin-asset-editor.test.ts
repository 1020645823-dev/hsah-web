import { describe, expect, it } from "vitest";

import {
  type AssetEditorDraft,
  ASSET_STATUS_OPTIONS,
  ASSET_TYPE_OPTIONS,
  ASSET_VISIBILITY_OPTIONS,
  INITIAL_DRAFT,
  areDraftsEqual,
  buildPayload,
  parseAssetToDraft,
  validateDraft,
} from "./admin-asset-editor";

// A reusable, fully-populated draft that always passes validation.
// Cloned per test to avoid cross-test mutation.
const validDraft: AssetEditorDraft = {
  slug: "test-asset",
  title: "Test Asset",
  subtitle: "Test Subtitle",
  shortDescription: "A realistic short description.",
  cloudProviders: ["aws"],
  industries: ["finance"],
  technologies: ["react"],
  assetType: "solution",
  status: "draft",
  visibility: "public",
  sharedFields: {
    introduction: "Shared introduction text",
    useCases: ["customer onboarding"],
    liveDemoUrl: "https://example.com/live",
    videos: [
      {
        id: "v1",
        title: "Overview Video",
        videoUrl: "https://example.com/v.mp4",
        posterUrl: "https://example.com/poster.jpg",
        description: "An overview of the asset",
        isPrimary: true,
      },
    ],
  },
  salesFields: {
    valueSummary: "Sales framing summary",
    differentiators: ["accelerator"],
    outcomes: ["faster presales"],
  },
};

const clone = (d: AssetEditorDraft): AssetEditorDraft => JSON.parse(JSON.stringify(d));

describe("INITIAL_DRAFT", () => {
  it("has the expected empty/default shape", () => {
    expect(INITIAL_DRAFT).toEqual({
      slug: "",
      title: "",
      subtitle: "",
      shortDescription: "",
      cloudProviders: [],
      industries: [],
      technologies: [],
      assetType: "solution",
      status: "draft",
      visibility: "public",
      sharedFields: {
        introduction: "",
        useCases: [],
        liveDemoUrl: "",
        videos: [],
      },
      salesFields: {
        valueSummary: "",
        differentiators: [],
        outcomes: [],
      },
    });
  });

  it("defaults assetType/status/visibility to the first option values", () => {
    expect(INITIAL_DRAFT.assetType).toBe("solution");
    expect(INITIAL_DRAFT.status).toBe("draft");
    expect(INITIAL_DRAFT.visibility).toBe("public");
  });

  it("exposes option constants", () => {
    expect(ASSET_TYPE_OPTIONS).toEqual(["solution", "whitepaper", "demo", "reference-architecture"]);
    expect(ASSET_STATUS_OPTIONS).toEqual(["draft", "published", "archived"]);
    expect(ASSET_VISIBILITY_OPTIONS).toEqual(["public", "restricted", "internal"]);
  });
});

describe("validateDraft", () => {
  it("returns valid with no errors for a correct draft", () => {
    const result = validateDraft(clone(validDraft));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("flags a missing slug", () => {
    const result = validateDraft({ ...clone(validDraft), slug: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.slug).toBeDefined();
  });

  it("flags a whitespace-only slug", () => {
    const result = validateDraft({ ...clone(validDraft), slug: "   " });
    expect(result.valid).toBe(false);
    expect(result.errors.slug).toBeDefined();
  });

  it("flags a slug that violates the lowercase/digit/hyphen pattern", () => {
    const result = validateDraft({ ...clone(validDraft), slug: "Bad Slug!" });
    expect(result.valid).toBe(false);
    expect(result.errors.slug).toBeDefined();
  });

  it("accepts a well-formed slug", () => {
    const result = validateDraft({ ...clone(validDraft), slug: "my-cool-asset-1" });
    expect(result.errors.slug).toBeUndefined();
    expect(result.valid).toBe(true);
  });

  it("flags a slug exceeding 200 characters", () => {
    const result = validateDraft({ ...clone(validDraft), slug: "a".repeat(201) });
    expect(result.valid).toBe(false);
    expect(result.errors.slug).toBeDefined();
  });

  it("accepts a slug at the 200 character boundary", () => {
    const result = validateDraft({ ...clone(validDraft), slug: "a".repeat(200) });
    expect(result.errors.slug).toBeUndefined();
    expect(result.valid).toBe(true);
  });

  it("flags a missing title", () => {
    const result = validateDraft({ ...clone(validDraft), title: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it("flags a title exceeding 240 characters", () => {
    const result = validateDraft({ ...clone(validDraft), title: "x".repeat(241) });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it("flags a shortDescription that is missing", () => {
    const result = validateDraft({ ...clone(validDraft), shortDescription: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.shortDescription).toBeDefined();
  });

  it("flags a shortDescription exceeding 500 characters", () => {
    const result = validateDraft({ ...clone(validDraft), shortDescription: "x".repeat(501) });
    expect(result.valid).toBe(false);
    expect(result.errors.shortDescription).toBeDefined();
  });

  it("flags an invalid assetType", () => {
    const result = validateDraft({ ...clone(validDraft), assetType: "bogus-type" });
    expect(result.valid).toBe(false);
    expect(result.errors.assetType).toBeDefined();
  });

  it("accepts every valid assetType option", () => {
    for (const t of ASSET_TYPE_OPTIONS) {
      const result = validateDraft({ ...clone(validDraft), assetType: t });
      expect(result.errors.assetType).toBeUndefined();
    }
  });

  it("flags an invalid status", () => {
    const result = validateDraft({ ...clone(validDraft), status: "bogus-status" });
    expect(result.valid).toBe(false);
    expect(result.errors.status).toBeDefined();
  });

  it("accepts every valid status option", () => {
    for (const s of ASSET_STATUS_OPTIONS) {
      const result = validateDraft({ ...clone(validDraft), status: s });
      expect(result.errors.status).toBeUndefined();
    }
  });

  it("flags an invalid visibility", () => {
    const result = validateDraft({ ...clone(validDraft), visibility: "bogus-visibility" });
    expect(result.valid).toBe(false);
    expect(result.errors.visibility).toBeDefined();
  });

  it("accepts every valid visibility option", () => {
    for (const v of ASSET_VISIBILITY_OPTIONS) {
      const result = validateDraft({ ...clone(validDraft), visibility: v });
      expect(result.errors.visibility).toBeUndefined();
    }
  });
});

describe("buildPayload", () => {
  it("converts camelCase draft keys to snake_case payload keys", () => {
    const payload = buildPayload(clone(validDraft));
    expect(payload).toEqual({
      slug: "test-asset",
      title: "Test Asset",
      subtitle: "Test Subtitle",
      short_description: "A realistic short description.",
      cloud_providers: ["aws"],
      industries: ["finance"],
      technologies: ["react"],
      asset_type: "solution",
      status: "draft",
      visibility: "public",
      shared_fields: {
        introduction: "Shared introduction text",
        use_cases: ["customer onboarding"],
        live_demo_url: "https://example.com/live",
        videos: [
          {
            id: "v1",
            title: "Overview Video",
            video_url: "https://example.com/v.mp4",
            poster_url: "https://example.com/poster.jpg",
            description: "An overview of the asset",
            is_primary: true,
          },
        ],
      },
      sales_fields: {
        value_summary: "Sales framing summary",
        differentiators: ["accelerator"],
        outcomes: ["faster presales"],
      },
    });
  });

  it("maps empty subtitle to null", () => {
    const payload = buildPayload({ ...clone(validDraft), subtitle: "" });
    expect(payload.subtitle).toBeNull();
  });

  it("maps whitespace-only subtitle to null", () => {
    const payload = buildPayload({ ...clone(validDraft), subtitle: "   " });
    expect(payload.subtitle).toBeNull();
  });

  it("maps empty live_demo_url to null", () => {
    const payload = buildPayload({
      ...clone(validDraft),
      sharedFields: { ...validDraft.sharedFields, liveDemoUrl: "" },
    });
    expect(payload.shared_fields.live_demo_url).toBeNull();
  });

  it("deduplicates array values", () => {
    const payload = buildPayload({
      ...clone(validDraft),
      cloudProviders: ["aws", "aws", "gcp"],
      industries: ["finance", "finance"],
      technologies: ["react", "react", "vue"],
    });
    expect(payload.cloud_providers).toEqual(["aws", "gcp"]);
    expect(payload.industries).toEqual(["finance"]);
    expect(payload.technologies).toEqual(["react", "vue"]);
  });

  it("trims array values and drops empty entries", () => {
    const payload = buildPayload({
      ...clone(validDraft),
      cloudProviders: [" aws ", "", "  ", "gcp"],
    });
    expect(payload.cloud_providers).toEqual(["aws", "gcp"]);
  });

  it("trims top-level string values", () => {
    const payload = buildPayload({
      ...clone(validDraft),
      slug: "  test-asset  ",
      title: "  Test Asset  ",
      subtitle: "  Test Subtitle  ",
      shortDescription: "  A realistic short description.  ",
    });
    expect(payload.slug).toBe("test-asset");
    expect(payload.title).toBe("Test Asset");
    expect(payload.subtitle).toBe("Test Subtitle");
    expect(payload.short_description).toBe("A realistic short description.");
  });

  it("maps sharedFields.videos to snake_case and trims fields", () => {
    const payload = buildPayload({
      ...clone(validDraft),
      sharedFields: {
        ...validDraft.sharedFields,
        videos: [
          {
            id: "  v1  ",
            title: "  Overview  ",
            videoUrl: "  https://example.com/v.mp4  ",
            posterUrl: "  https://example.com/poster.jpg  ",
            description: "  desc  ",
            isPrimary: true,
          },
        ],
      },
    });
    expect(payload.shared_fields.videos).toEqual([
      {
        id: "  v1  ",
        title: "Overview",
        video_url: "https://example.com/v.mp4",
        poster_url: "https://example.com/poster.jpg",
        description: "desc",
        is_primary: true,
      },
    ]);
  });

  it("maps an empty poster_url to null", () => {
    const payload = buildPayload({
      ...clone(validDraft),
      sharedFields: {
        ...validDraft.sharedFields,
        videos: [
          {
            id: "v1",
            title: "Overview",
            videoUrl: "https://example.com/v.mp4",
            posterUrl: "   ",
            description: "desc",
            isPrimary: false,
          },
        ],
      },
    });
    expect(payload.shared_fields.videos[0].poster_url).toBeNull();
  });

  it("does NOT include legacy/removed payload keys", () => {
    const payload = buildPayload(clone(validDraft)) as Record<string, unknown>;
    expect(payload).not.toHaveProperty("allowed_roles");
    expect(payload).not.toHaveProperty("allowed_users");
    expect(payload).not.toHaveProperty("delivery_fields");
    expect(payload).not.toHaveProperty("delivery_allowed_roles");
    expect(payload).not.toHaveProperty("delivery_allowed_users");
    expect(payload).not.toHaveProperty("content_blocks");
    expect(payload).not.toHaveProperty("content_schema_version");
  });
});

describe("parseAssetToDraft", () => {
  it("converts snake_case asset keys to camelCase draft keys", () => {
    const asset = {
      slug: "test-asset",
      title: "Test Asset",
      subtitle: "Test Subtitle",
      short_description: "A realistic short description.",
      cloud_providers: ["aws"],
      industries: ["finance"],
      technologies: ["react"],
      asset_type: "solution",
      status: "draft",
      visibility: "public",
      shared_fields: {
        introduction: "Shared introduction text",
        use_cases: ["customer onboarding"],
        live_demo_url: "https://example.com/live",
        videos: [
          {
            id: "v1",
            title: "Overview Video",
            video_url: "https://example.com/v.mp4",
            poster_url: "https://example.com/poster.jpg",
            description: "An overview of the asset",
            is_primary: true,
          },
        ],
      },
      sales_fields: {
        value_summary: "Sales framing summary",
        differentiators: ["accelerator"],
        outcomes: ["faster presales"],
      },
    };
    const draft = parseAssetToDraft(asset);
    expect(draft).toEqual(validDraft);
  });

  it("returns empty arrays for missing list fields", () => {
    const draft = parseAssetToDraft({ slug: "s", title: "t" });
    expect(draft.cloudProviders).toEqual([]);
    expect(draft.industries).toEqual([]);
    expect(draft.technologies).toEqual([]);
    expect(draft.sharedFields.useCases).toEqual([]);
    expect(draft.salesFields.differentiators).toEqual([]);
    expect(draft.salesFields.outcomes).toEqual([]);
  });

  it("returns empty videos array when shared_fields.videos is missing", () => {
    const draft = parseAssetToDraft({ slug: "s", title: "t" });
    expect(draft.sharedFields.videos).toEqual([]);
  });

  it("returns empty videos array when shared_fields.videos is undefined", () => {
    const draft = parseAssetToDraft({ slug: "s", title: "t", shared_fields: {} });
    expect(draft.sharedFields.videos).toEqual([]);
  });

  it("returns empty videos array when shared_fields is missing entirely", () => {
    const draft = parseAssetToDraft({ slug: "s", title: "t" });
    expect(draft.sharedFields.videos).toEqual([]);
  });

  it("applies safe defaults when asset_type/status/visibility are missing", () => {
    const draft = parseAssetToDraft({ slug: "s", title: "t" });
    expect(draft.assetType).toBe(INITIAL_DRAFT.assetType);
    expect(draft.status).toBe(INITIAL_DRAFT.status);
    expect(draft.visibility).toBe(INITIAL_DRAFT.visibility);
  });

  it("maps shared_fields.videos snake_case keys to camelCase", () => {
    const draft = parseAssetToDraft({
      slug: "s",
      title: "t",
      short_description: "d",
      shared_fields: {
        videos: [
          {
            id: "v1",
            title: "Overview",
            video_url: "https://example.com/v.mp4",
            poster_url: "https://example.com/poster.jpg",
            description: "desc",
            is_primary: true,
          },
        ],
      },
    });
    expect(draft.sharedFields.videos).toEqual([
      {
        id: "v1",
        title: "Overview",
        videoUrl: "https://example.com/v.mp4",
        posterUrl: "https://example.com/poster.jpg",
        description: "desc",
        isPrimary: true,
      },
    ]);
  });

  it("generates an id for a video missing one", () => {
    const draft = parseAssetToDraft({
      slug: "s",
      title: "t",
      shared_fields: {
        videos: [
          {
            title: "No ID",
            video_url: "https://example.com/v.mp4",
            poster_url: null,
            description: "",
            is_primary: false,
          },
        ],
      },
    });
    const video = draft.sharedFields.videos[0];
    expect(typeof video.id).toBe("string");
    expect(video.id.length).toBeGreaterThan(0);
    // UUID v4-ish format produced by crypto.randomUUID()
    expect(video.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("coerces missing video string fields to safe defaults", () => {
    const draft = parseAssetToDraft({
      slug: "s",
      title: "t",
      shared_fields: {
        videos: [
          {
            id: "v1",
            // title/video_url/poster_url/description/is_primary omitted
          },
        ],
      },
    });
    expect(draft.sharedFields.videos[0]).toEqual({
      id: "v1",
      title: "",
      videoUrl: "",
      posterUrl: "",
      description: "",
      isPrimary: false,
    });
  });
});

describe("areDraftsEqual", () => {
  it("returns true for identical drafts", () => {
    const a = clone(validDraft);
    expect(areDraftsEqual(a, clone(a))).toBe(true);
  });

  it("returns true for the same reference", () => {
    const a = clone(validDraft);
    expect(areDraftsEqual(a, a)).toBe(true);
  });

  it("returns false when cloudProviders differ", () => {
    const a = clone(validDraft);
    const b = { ...clone(validDraft), cloudProviders: ["gcp"] };
    expect(areDraftsEqual(a, b)).toBe(false);
  });

  it("returns false when cloudProviders length differs", () => {
    const a = clone(validDraft);
    const b = { ...clone(validDraft), cloudProviders: ["aws", "gcp"] };
    expect(areDraftsEqual(a, b)).toBe(false);
  });

  it("returns false when sharedFields.videos differ", () => {
    const a = clone(validDraft);
    const b = {
      ...clone(validDraft),
      sharedFields: { ...validDraft.sharedFields, videos: [] },
    };
    expect(areDraftsEqual(a, b)).toBe(false);
  });

  it("returns false when a top-level scalar differs", () => {
    const a = clone(validDraft);
    const b = { ...clone(validDraft), title: "Different Title" };
    expect(areDraftsEqual(a, b)).toBe(false);
  });
});
