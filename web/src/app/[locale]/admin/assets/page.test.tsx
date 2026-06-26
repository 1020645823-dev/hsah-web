import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const {
  mockGetStoredAdminToken,
  mockAdminPaginatedRequest,
  mockBatchDeleteAssets,
  mockPublishAsset,
  mockArchiveAsset,
} = vi.hoisted(() => ({
  mockGetStoredAdminToken: vi.fn(),
  mockAdminPaginatedRequest: vi.fn(),
  mockBatchDeleteAssets: vi.fn(),
  mockPublishAsset: vi.fn(),
  mockArchiveAsset: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/admin", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin")>("@/lib/admin");
  return {
    ...actual,
    getStoredAdminToken: mockGetStoredAdminToken,
    adminPaginatedRequest: mockAdminPaginatedRequest,
    batchDeleteAssets: mockBatchDeleteAssets,
    publishAsset: mockPublishAsset,
    archiveAsset: mockArchiveAsset,
  };
});

import AdminAssetsPage from "./page";

function buildAssetRow(overrides: Partial<{
  id: string;
  slug: string;
  title: string;
  asset_type: string;
  status: string;
  visibility: string;
  cloud_providers: string[];
}> = {}) {
  return {
    id: "asset-1",
    slug: "asset-one",
    title: "Asset One",
    asset_type: "solution",
    status: "draft",
    visibility: "public",
    cloud_providers: ["aws"],
    ...overrides,
  };
}

describe("AdminAssetsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredAdminToken.mockReturnValue("token-123");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the new page header and admin actions", async () => {
    mockAdminPaginatedRequest.mockResolvedValue({
      ok: true,
      data: { items: [], total: 0, limit: 10, offset: 0 },
    });

    render(<AdminAssetsPage />);

    expect(screen.getByRole("heading", { name: "Assets" })).toBeInTheDocument();
    expect(
      screen.getByText("Manage discovery, publication, and lifecycle for reusable platform assets."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New asset" })).toHaveAttribute("href", "/admin/assets/new");
  });

  it("uses batch delete helper once and shows success message", async () => {
    const row = buildAssetRow({ id: "asset-batch", title: "Batch Asset" });
    mockAdminPaginatedRequest.mockImplementation(async () => ({
      ok: true,
      data: { items: [row], total: 1, limit: 10, offset: 0 },
    }));
    mockBatchDeleteAssets.mockResolvedValue({
      ok: true,
      data: { deleted: 1, failed: [] },
    });

    render(<AdminAssetsPage />);

    await screen.findByText("Batch Asset");
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByText("删除"));
    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() => {
      expect(mockBatchDeleteAssets).toHaveBeenCalledTimes(1);
    });
    expect(mockBatchDeleteAssets).toHaveBeenCalledWith("token-123", ["asset-batch"]);
    expect(await screen.findByText("已删除 1 个资产")).toBeInTheDocument();
  });

  it("shows validation fields when publish fails", async () => {
    const row = buildAssetRow({ id: "asset-publish", title: "Publish Asset", status: "draft" });
    mockAdminPaginatedRequest.mockImplementation(async () => ({
      ok: true,
      data: { items: [row], total: 1, limit: 10, offset: 0 },
    }));
    mockPublishAsset.mockResolvedValue({
      ok: false,
      status: 422,
      data: {
        detail: {
          code: "publish_validation_failed",
          fields: ["title", "content_blocks"],
        },
      },
      message: "publish_validation_failed",
    });

    render(<AdminAssetsPage />);

    await screen.findByText("Publish Asset");
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(mockPublishAsset).toHaveBeenCalledWith("token-123", "asset-publish");
    });
    expect(await screen.findByText("发布失败，请完善：title、content_blocks")).toBeInTheDocument();
  });

  it("archives published assets and shows success message", async () => {
    const row = buildAssetRow({ id: "asset-archive", title: "Archive Asset", status: "published" });
    mockAdminPaginatedRequest.mockImplementation(async () => ({
      ok: true,
      data: { items: [row], total: 1, limit: 10, offset: 0 },
    }));
    mockArchiveAsset.mockResolvedValue({
      ok: true,
      data: { ...row, status: "archived" },
    });

    render(<AdminAssetsPage />);

    await screen.findByText("Archive Asset");
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    await waitFor(() => {
      expect(mockArchiveAsset).toHaveBeenCalledWith("token-123", "asset-archive");
    });
    expect(await screen.findByText("资产已归档")).toBeInTheDocument();
  });
});
