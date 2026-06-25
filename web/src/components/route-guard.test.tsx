import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { mockUseAuth, mockReplace, mockPush } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockReplace: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/assets",
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: mockUseAuth,
}));

import { RouteGuard } from "./route-guard";

describe("RouteGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a redirect panel while auth state is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });

    render(
      <RouteGuard>
        <div>secret</div>
      </RouteGuard>,
    );

    expect(
      screen.getByRole("heading", { name: "Redirecting to sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Checking your session before loading admin tools."),
    ).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to auth login with the next destination", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });

    render(
      <RouteGuard>
        <div>secret</div>
      </RouteGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/login?next=%2Fadmin%2Fassets");
    });

    expect(
      screen.getByText("You need to sign in before accessing admin routes."),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders children when user is authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "admin@example.com", is_active: true, two_factor_enabled: true },
      isLoading: false,
    });

    render(
      <RouteGuard>
        <div>secret</div>
      </RouteGuard>,
    );

    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
