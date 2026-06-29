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

import { AuditLogTable } from "@/components/admin/audit-log-table";

describe("AuditLogTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredAdminToken.mockReturnValue("token-123");
  });

  it("renders audit rows when data is present", async () => {
    mockAdminRequest.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: "log-1",
            actor_user_id: "u1",
            action: "asset.archive",
            resource_type: "asset",
            resource_id: "a1",
            summary: "archive: Old Asset",
            details: {},
            created_at: "2026-06-29T10:00:00Z",
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      },
    });

    render(<AuditLogTable />);

    await waitFor(() => {
      expect(screen.getByText("asset.archive")).toBeInTheDocument();
    });
    expect(screen.getByText("archive: Old Asset")).toBeInTheDocument();
  });

  it("renders empty state when no logs", async () => {
    mockAdminRequest.mockResolvedValue({
      ok: true,
      data: { items: [], total: 0, limit: 50, offset: 0 },
    });

    render(<AuditLogTable />);

    await waitFor(() => {
      expect(
        screen.getByText("No audit entries match the current filters."),
      ).toBeInTheDocument();
    });
  });
});
