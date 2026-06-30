import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
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

import { AccessRequestQueue } from "@/components/admin/access-request-queue";

describe("AccessRequestQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredAdminToken.mockReturnValue("token-123");
  });

  it("renders pending requests", async () => {
    mockAdminRequest.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: "ar-1",
            user_id: "u1",
            asset_id: "a1",
            purpose: "Need delivery access",
            role: "Consultant",
            status: "pending",
            decision_reason: "",
            decided_at: null,
            created_at: "2026-06-29T10:00:00Z",
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      },
    });

    render(<AccessRequestQueue />);

    await waitFor(() => {
      expect(screen.getByText("Need delivery access")).toBeInTheDocument();
    });
    expect(screen.getByText("Consultant")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("removes a request after approving", async () => {
    mockAdminRequest.mockResolvedValue({
      ok: true,
      data: { items: [], total: 0, limit: 50, offset: 0 },
    });
    mockAdminRequest.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        data: {
          items: [
            {
              id: "ar-2",
              user_id: "u1",
              asset_id: "a1",
              purpose: "Approve me",
              role: null,
              status: "pending",
              decision_reason: "",
              decided_at: null,
              created_at: "2026-06-29T10:00:00Z",
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        },
      }),
    );
    mockAdminRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, data: { id: "ar-2", status: "approved" } }),
    );

    const user = userEvent.setup();
    render(<AccessRequestQueue />);

    await waitFor(() => {
      expect(screen.getByText("Approve me")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(screen.queryByText("Approve me")).not.toBeInTheDocument();
    });
  });

  it("requires a reason before rejecting", async () => {
    mockAdminRequest.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        data: {
          items: [
            {
              id: "ar-3",
              user_id: "u1",
              asset_id: "a1",
              purpose: "Reject me",
              role: null,
              status: "pending",
              decision_reason: "",
              decided_at: null,
              created_at: "2026-06-29T10:00:00Z",
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        },
      }),
    );

    const user = userEvent.setup();
    render(<AccessRequestQueue />);

    await waitFor(() => {
      expect(screen.getByText("Reject me")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Reject" }));

    // Reject button inside the reason form is disabled until reason is entered.
    const rejectConfirm = screen.getByRole("button", { name: "Reject" });
    expect(rejectConfirm).toBeDisabled();
  });

  it("renders empty state when no requests", async () => {
    mockAdminRequest.mockResolvedValue({
      ok: true,
      data: { items: [], total: 0, limit: 50, offset: 0 },
    });

    render(<AccessRequestQueue />);

    await waitFor(() => {
      expect(
        screen.getByText("No access requests in this view."),
      ).toBeInTheDocument();
    });
  });
});
