import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import "@testing-library/jest-dom/vitest";

const { mockGetStoredAdminToken, mockAdminRequest } = vi.hoisted(() => ({
  mockGetStoredAdminToken: vi.fn(),
  mockAdminRequest: vi.fn(),
}));

vi.mock("@/lib/admin", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin")>("@/lib/admin");
  return {
    ...actual,
    getStoredAdminToken: mockGetStoredAdminToken,
    adminRequest: mockAdminRequest,
  };
});

import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

describe("AnalyticsDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredAdminToken.mockReturnValue("token-123");
  });

  it("renders metric sections from the analytics overview", async () => {
    mockAdminRequest.mockResolvedValue({
      ok: true,
      data: {
        content: { total_assets: 10, published_assets: 8, reviewing_assets: 1, low_quality_assets: 1 },
        experience: { views: 100, favorites: 20, feedback: 5, access_requests: 3 },
        workflow: { review_records: 12, rejects: 1, approved_requests: 2, rejected_requests: 1 },
        quality: { average_score: 88.5, low_quality_assets: 1 },
        governance: { pending_access_requests: 1, total_access_requests: 3 },
      },
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("88.5")).toBeInTheDocument();
    expect(screen.getByText("Experience")).toBeInTheDocument();
  });

  it("renders loading state before data arrives", () => {
    mockAdminRequest.mockReturnValue(new Promise(() => {}));

    render(<AnalyticsDashboard />);

    // Loading skeleton renders pulsing placeholders instead of metric values.
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });
});
