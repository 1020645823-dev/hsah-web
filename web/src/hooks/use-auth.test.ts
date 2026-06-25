import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const { mockMe, mockGetStoredAdminToken, mockClearStoredAdminToken } = vi.hoisted(() => ({
  mockMe: vi.fn(),
  mockGetStoredAdminToken: vi.fn(),
  mockClearStoredAdminToken: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  me: mockMe,
}));

vi.mock("@/lib/admin", () => ({
  ADMIN_AUTH_CHANGED_EVENT: "hsah-admin-auth-changed",
  getStoredAdminToken: mockGetStoredAdminToken,
  clearStoredAdminToken: mockClearStoredAdminToken,
}));

import { useAuth } from "./use-auth";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears stale token and finishes loading when /me returns 401", async () => {
    mockGetStoredAdminToken.mockReturnValue("expired-token");
    mockMe.mockResolvedValue({
      ok: false,
      status: 401,
      data: { detail: "expired" },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(mockClearStoredAdminToken).toHaveBeenCalledTimes(1);
  });
});
