import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_PUBLIC_ASSET_LIMIT,
  buildAssetSearchQuery,
  fetchPublicAssets,
  getAssetOffsetForPage,
  getAssetPageFromOffset,
  parseAssetQueryFromSearchParams,
  type PublicAssetSummary,
} from "./public-assets";

const assetFixture: PublicAssetSummary = {
  id: "asset-1",
  slug: "agent-hub",
  title: "Agent Hub",
  subtitle: null,
  short_description: "Production-ready agent workflow starter.",
  cloud_providers: ["aws"],
  industries: ["banking"],
  technologies: ["ai"],
  asset_type: "solution",
  status: "published",
};

describe("public-assets helpers", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("builds query string with filters and pagination", () => {
    const query = buildAssetSearchQuery({
      q: "agent",
      cloud: "aws",
      industry: "banking",
      tech: "ai",
      assetType: "solution",
      limit: 12,
      offset: 24,
    });

    expect(query).toBe("?q=agent&cloud=aws&industry=banking&tech=ai&asset_type=solution&offset=24");
  });

  it("parses search params with trimming and safe defaults", () => {
    const parsed = parseAssetQueryFromSearchParams({
      q: "  copilots  ",
      cloud: ["aws", "azure"],
      industry: "banking",
      tech: "  ai ",
      asset_type: "reference_architecture",
      limit: "0",
      offset: "-4",
    });

    expect(parsed).toEqual({
      q: "copilots",
      cloud: "aws",
      industry: "banking",
      tech: "ai",
      assetType: "reference_architecture",
      sort: "title",
      view: "grid",
      limit: DEFAULT_PUBLIC_ASSET_LIMIT,
      offset: 0,
    });
  });

  it("computes page and offset helpers from pagination state", () => {
    expect(getAssetPageFromOffset(24, 12)).toBe(3);
    expect(getAssetOffsetForPage(4, 12)).toBe(36);
    expect(getAssetOffsetForPage(0, 12)).toBe(0);
  });

  it("normalizes paginated API responses", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [assetFixture],
        total: 9,
        limit: 12,
        offset: 0,
      }),
    } as Response);

    const result = await fetchPublicAssets({ q: "agent", limit: 12, offset: 0 });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/assets?q=agent",
      { cache: "no-store" },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.total).toBe(9);
      expect(result.data.items[0]?.slug).toBe("agent-hub");
    }
  });

  it("falls back when API still returns a plain array", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [assetFixture],
    } as Response);

    const result = await fetchPublicAssets({ limit: 12, offset: 24 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        items: [assetFixture],
        total: 25,
        limit: 12,
        offset: 24,
      });
    }
  });

  it("returns error when API responds with 500", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Internal Server Error" }),
    } as Response);

    const result = await fetchPublicAssets({ q: "agent" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.category).toBe("server");
      expect(result.error.status).toBe(500);
      expect(result.error.userMessage).toBe("服务器暂时不可用，请稍后重试。");
      expect(result.error.retryable).toBe(true);
    }
  });

  it("returns error when fetch throws (network error)", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network Error"));

    const result = await fetchPublicAssets({ q: "agent" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.category).toBe("network");
      expect(result.error.userMessage).toBe("网络连接异常，请检查网络后重试。");
      expect(result.error.retryable).toBe(true);
    }
  });
});
