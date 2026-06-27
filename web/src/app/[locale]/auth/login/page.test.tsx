import { cleanup, render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockLogin,
  mockRegister,
  mockReplace,
  mockUseSearchParams,
  mockSearchParamsGet,
  mockLocalStorage,
} = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockRegister: vi.fn(),
  mockReplace: vi.fn(),
  mockUseSearchParams: vi.fn(),
  mockSearchParamsGet: vi.fn(),
  mockLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/lib/api", () => ({
  login: mockLogin,
  register: mockRegister,
}));

import LoginPage from "./page";

afterEach(() => {
  cleanup();
});

function getEnabledButton(name: string) {
  return screen
    .getAllByRole("button", { name })
    .find((button) => !button.hasAttribute("disabled"));
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", mockLocalStorage);
    mockUseSearchParams.mockReturnValue({
      get: mockSearchParamsGet,
    });
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "next" ? "/admin/assets" : null,
    );
    mockRegister.mockResolvedValue({
      ok: true,
      data: { id: "user-1", email: "admin@example.com" },
    });
  });

  it("renders a split-layout login page with brand context", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Access saved assets, profiles, and admin operations/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Explore the public content platform/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Admin workspace sign-in")).toBeInTheDocument();
    expect(screen.getByText("Admin workspace")).toBeInTheDocument();
    expect(screen.getByText("/admin/assets")).toBeInTheDocument();
    expect(
      screen.getByText(/the public library remains your discovery surface/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to public library" }),
    ).toHaveAttribute("href", "/assets");
  });

  it("does not show admin context for public destinations", () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "next" ? "/assets" : null,
    );

    render(<LoginPage />);

    expect(screen.queryByText("Admin workspace sign-in")).not.toBeInTheDocument();
    expect(screen.queryByText("/admin/assets")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to public library" }),
    ).toHaveAttribute("href", "/assets");
  });

  it("redirects successful login to the requested destination", async () => {
    mockLogin.mockResolvedValue({
      ok: true,
      data: {
        access_token: "token-123",
        token_type: "bearer",
      },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), " admin@example.com ");
    await user.type(screen.getByLabelText("Password"), "secret123");
    const signInButton = getEnabledButton("Sign in");
    expect(signInButton).toBeDefined();

    await user.click(signInButton!);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "admin@example.com",
        "secret123",
        undefined,
      );
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("hsah_token", "token-123");
    expect(mockReplace).toHaveBeenCalledWith("/admin/assets");
  });

  it("redirects successful login to admin when no destination is requested", async () => {
    mockSearchParamsGet.mockReturnValue(null);
    mockLogin.mockResolvedValue({
      ok: true,
      data: {
        access_token: "token-123",
        token_type: "bearer",
      },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    const signInButton = getEnabledButton("Sign in");
    expect(signInButton).toBeDefined();

    await user.click(signInButton!);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/admin");
    });
  });

  it("renders a suspense fallback when search params are not ready yet", () => {
    mockUseSearchParams.mockImplementation(() => {
      throw new Promise(() => {});
    });

    expect(() => render(<LoginPage />)).not.toThrow();
    expect(screen.getByText("Loading sign-in workspace...")).toBeInTheDocument();
  });
});
