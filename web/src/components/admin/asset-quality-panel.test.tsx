import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import "@testing-library/jest-dom/vitest";

const { mockFetchQualityCheck } = vi.hoisted(() => ({
  mockFetchQualityCheck: vi.fn(),
}));

vi.mock("@/lib/admin-asset-review", () => ({
  fetchQualityCheck: mockFetchQualityCheck,
}));

import { AssetQualityPanel } from "@/components/admin/asset-quality-panel";

describe("AssetQualityPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders score, band, missing, and warnings", async () => {
    mockFetchQualityCheck.mockResolvedValue({
      ok: true,
      data: {
        asset_id: "a1",
        score: 80,
        band: "needs_work",
        missing: [],
        warnings: ["videos", "sales_fields"],
        is_publishable: true,
      },
    });

    render(<AssetQualityPanel assetId="a1" token="token" />);

    await waitFor(() => {
      expect(screen.getByText("80")).toBeInTheDocument();
    });
    expect(screen.getByText("Needs work")).toBeInTheDocument();
    expect(screen.getByText("videos")).toBeInTheDocument();
    expect(screen.getByText("sales_fields")).toBeInTheDocument();
  });

  it("lists missing blocking requirements", async () => {
    mockFetchQualityCheck.mockResolvedValue({
      ok: true,
      data: {
        asset_id: "a1",
        score: 40,
        band: "blocked",
        missing: ["short_description", "cloud_providers"],
        warnings: [],
        is_publishable: false,
      },
    });

    render(<AssetQualityPanel assetId="a1" token="token" />);

    await waitFor(() => {
      expect(screen.getByText("Blocked")).toBeInTheDocument();
    });
    expect(screen.getByText("short_description")).toBeInTheDocument();
    expect(screen.getByText("cloud_providers")).toBeInTheDocument();
  });
});
