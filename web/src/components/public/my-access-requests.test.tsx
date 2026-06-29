import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import "@testing-library/jest-dom/vitest";

const { mockGetStoredAdminToken } = vi.hoisted(() => ({
  mockGetStoredAdminToken: vi.fn(),
}));

vi.mock("@/lib/admin", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin")>("@/lib/admin");
  return { ...actual, getStoredAdminToken: mockGetStoredAdminToken };
});

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { MyAccessRequests } from "@/components/public/my-access-requests";

const sampleRequest = {
  id: "ar-1",
  user_id: "u1",
  asset_id: "a1",
  purpose: "Client delivery",
  role: "Consultant",
  status: "pending" as const,
  decision_reason: "",
  decided_at: null,
  created_at: "2026-06-29T10:00:00Z",
};

describe("MyAccessRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredAdminToken.mockReturnValue("token-123");
    global.fetch = vi.fn();
  });

  it("renders requests with status badges", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [sampleRequest], total: 1, limit: 50, offset: 0 }),
    });

    render(<MyAccessRequests />);

    await waitFor(() => {
      expect(screen.getByText("Client delivery")).toBeInTheDocument();
    });
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("renders sign-in prompt when no token", () => {
    mockGetStoredAdminToken.mockReturnValue(null);
    render(<MyAccessRequests />);
    expect(screen.getByText("Sign in to view your access requests.")).toBeInTheDocument();
  });

  it("renders empty state when no requests", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], total: 0, limit: 50, offset: 0 }),
    });

    render(<MyAccessRequests />);

    await waitFor(() => {
      expect(
        screen.getByText("You have not submitted any access requests yet."),
      ).toBeInTheDocument();
    });
  });
});
