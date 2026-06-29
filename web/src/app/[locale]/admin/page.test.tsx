import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import "@testing-library/jest-dom/vitest";

const { mockGetStoredAdminToken, mockAdminRequest } = vi.hoisted(() => ({
  mockGetStoredAdminToken: vi.fn(),
  mockAdminRequest: vi.fn(),
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
    adminRequest: mockAdminRequest,
  };
});

import AdminPage from "./page";

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredAdminToken.mockReturnValue("token-123");
  });

  it("renders the operations overview with KPI cards and quick actions", async () => {
    mockAdminRequest.mockResolvedValue({
      ok: true,
      data: { users: 12, assets: 48 },
    });

    render(<AdminPage />);

    expect(screen.getByRole("heading", { name: "Operations overview" })).toBeInTheDocument();
    expect(
      screen.getByText("Monitor content health, recent work, and access-control surfaces from one workspace."),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockAdminRequest).toHaveBeenCalledWith("/api/v1/admin/overview", "token-123", {
        method: "GET",
      });
    });

    expect(await screen.findByText("48")).toBeInTheDocument();
    expect(screen.getByText("Recent drafts")).toBeInTheDocument();
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create asset" })).toHaveAttribute(
      "href",
      "/admin/assets",
    );
    expect(screen.getByRole("link", { name: "Access Matrix" })).toHaveAttribute(
      "href",
      "/admin/access",
    );
  });
});
