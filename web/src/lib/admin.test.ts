import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_TOKEN_STORAGE_KEY,
  adminRequest,
  archiveAsset,
  batchDeleteAssets,
  publishAsset,
} from "./admin";

describe("admin asset actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const store = new Map<string, string>();
    const storageMock = {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
      clear: vi.fn(() => {
        store.clear();
      }),
    };
    vi.stubGlobal("localStorage", storageMock);
  });

  it("posts ids to batch-delete endpoint once", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ deleted: 2, failed: [] }),
    }) as typeof fetch;

    await batchDeleteAssets("token-123", ["asset-1", "asset-2"]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/assets/batch-delete",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ ids: ["asset-1", "asset-2"] }),
        headers: expect.any(Headers),
      }),
    );
  });

  it("posts publish action to the publish endpoint", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "asset-1", status: "published" }),
    }) as typeof fetch;

    await publishAsset("token-123", "asset-1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/assets/asset-1/publish",
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
      }),
    );
  });

  it("posts archive action to the archive endpoint", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "asset-1", status: "archived" }),
    }) as typeof fetch;

    await archiveAsset("token-123", "asset-1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/assets/asset-1/archive",
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
      }),
    );
  });

  it("clears stored token when admin request returns 401", async () => {
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, "expired-token");
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: "token expired" }),
    }) as typeof fetch;

    const result = await adminRequest("/api/v1/admin/overview", "expired-token", {
      method: "GET",
    });

    expect(result.ok).toBe(false);
    expect(window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)).toBeNull();
  });
});
