import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const { mockAddFavorite, mockRemoveFavorite } = vi.hoisted(() => ({
  mockAddFavorite: vi.fn(),
  mockRemoveFavorite: vi.fn(),
}));

vi.mock("@/lib/asset-engagement", async () => {
  const actual = await vi.importActual<typeof import("@/lib/asset-engagement")>("@/lib/asset-engagement");
  return { ...actual, addFavorite: mockAddFavorite, removeFavorite: mockRemoveFavorite };
});

import { AssetEngagementBar } from "@/components/public/asset-engagement-bar";

describe("AssetEngagementBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prompts sign-in when favoriting without a token", async () => {
    const user = userEvent.setup();
    render(<AssetEngagementBar assetId="a1" />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Sign in to save this asset.")).toBeInTheDocument();
    expect(mockAddFavorite).not.toHaveBeenCalled();
  });

  it("toggles favorite on when authed", async () => {
    mockAddFavorite.mockResolvedValue({ ok: true, data: { is_favorite: true } });
    const user = userEvent.setup();
    render(<AssetEngagementBar assetId="a1" token="tok" />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();
    });
    expect(mockAddFavorite).toHaveBeenCalledWith("a1", "tok");
  });

  it("toggles favorite off after being favorited", async () => {
    mockAddFavorite.mockResolvedValue({ ok: true, data: { is_favorite: true } });
    mockRemoveFavorite.mockResolvedValue({ ok: true, data: { is_favorite: false } });
    const user = userEvent.setup();
    render(<AssetEngagementBar assetId="a1" token="tok" />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Saved" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });
    expect(mockRemoveFavorite).toHaveBeenCalledWith("a1", "tok");
  });

  it("renders a share button", () => {
    render(<AssetEngagementBar assetId="a1" token="tok" />);
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });
});
