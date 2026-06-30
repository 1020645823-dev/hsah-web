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

import { OperationsWorkbench } from "@/components/admin/operations-workbench";

describe("OperationsWorkbench", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredAdminToken.mockReturnValue("token-123");
  });

  it("renders metric values and tasks from the operations APIs", async () => {
    mockAdminRequest.mockImplementation((path: string) => {
      if (path.includes("/overview")) {
        return Promise.resolve({
          ok: true,
          data: {
            total_assets: 42,
            published_assets: 30,
            reviewing_assets: 4,
            low_quality_assets: 3,
            pending_access_requests: 5,
          },
        });
      }
      if (path.includes("/tasks")) {
        return Promise.resolve({
          ok: true,
          data: {
            items: [
              {
                asset_id: "a1",
                slug: "blocked-asset",
                title: "Blocked Asset",
                status: "draft",
                reason: "Blocked: short_description",
                priority: "high",
                target_url: "/admin/assets/a1/edit",
              },
            ],
            total: 1,
          },
        });
      }
      return Promise.resolve({ ok: true, data: { items: [], total: 0 } });
    });

    render(<OperationsWorkbench token="token-123" />);

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
    });
    expect(screen.getByText("Blocked Asset")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("renders empty task state when no tasks", async () => {
    mockAdminRequest.mockImplementation((path: string) => {
      if (path.includes("/overview")) {
        return Promise.resolve({
          ok: true,
          data: {
            total_assets: 0,
            published_assets: 0,
            reviewing_assets: 0,
            low_quality_assets: 0,
            pending_access_requests: 0,
          },
        });
      }
      return Promise.resolve({ ok: true, data: { items: [], total: 0 } });
    });

    render(<OperationsWorkbench token="token-123" />);

    await waitFor(() => {
      expect(
        screen.getByText("No pending tasks. Everything is up to date."),
      ).toBeInTheDocument();
    });
  });
});
