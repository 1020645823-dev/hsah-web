import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@/test-utils";
import "@testing-library/jest-dom/vitest";

const {
  mockGetStoredAdminToken,
  mockAdminRequest,
} = vi.hoisted(() => ({
  mockGetStoredAdminToken: vi.fn(),
  mockAdminRequest: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/admin", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin")>("@/lib/admin");
  return {
    ...actual,
    getStoredAdminToken: mockGetStoredAdminToken,
    adminRequest: mockAdminRequest,
  };
});

import AdminAssetsPage from "./page";

function buildAsset(overrides: Partial<{
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  visibility: string;
  cloud_providers: string[];
}> = {}) {
  return {
    id: "asset-1",
    slug: "asset-one",
    title: "Asset One",
    type: "solution",
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

  it("renders the page header and create asset button", async () => {
    mockAdminRequest.mockResolvedValue({
      ok: true,
      data: { assets: [] },
    });

    render(<AdminAssetsPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Assets" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Create new asset" })).toBeInTheDocument();
  });

  it("renders asset cards when data is fetched", async () => {
    const asset = buildAsset({ id: "asset-1", title: "Test Asset" });
    mockAdminRequest.mockResolvedValue({
      ok: true,
      data: { assets: [asset] },
    });

    render(<AdminAssetsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Asset")).toBeInTheDocument();
    });
    expect(screen.getByText((content) => content.includes("Type") && content.includes("solution"))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("Status") && content.includes("draft"))).toBeInTheDocument();
  });

  it("shows empty state when no assets", async () => {
    mockAdminRequest.mockResolvedValue({
      ok: true,
      data: { assets: [] },
    });

    render(<AdminAssetsPage />);

    await waitFor(() => {
      expect(screen.getByText("No assets found")).toBeInTheDocument();
    });
  });
});
