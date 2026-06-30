import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const { mockCreateAccessRequest } = vi.hoisted(() => ({
  mockCreateAccessRequest: vi.fn(),
}));

vi.mock("@/lib/access-requests", () => ({
  createAccessRequest: mockCreateAccessRequest,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { AccessRequestForm } from "@/components/public/access-request-form";

describe("AccessRequestForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prompts sign-in when no token", async () => {
    mockCreateAccessRequest.mockResolvedValue({
      ok: false,
      error: { message: "Unauthorized", retryable: false },
      requiresAuth: true,
    });
    const user = userEvent.setup();
    render(<AccessRequestForm assetId="a1" />);

    await user.type(screen.getAllByRole("textbox")[0], "I need access");
    await user.click(screen.getByRole("button", { name: "Request access" }));

    await waitFor(() => {
      expect(screen.getByText("Sign in")).toBeInTheDocument();
    });
  });

  it("submits and shows pending confirmation", async () => {
    mockCreateAccessRequest.mockResolvedValue({
      ok: true,
      data: { status: "pending" },
    });
    const user = userEvent.setup();
    render(<AccessRequestForm assetId="a1" token="tok" />);

    await user.type(screen.getAllByRole("textbox")[0], "Client delivery");
    await user.click(screen.getByRole("button", { name: "Request access" }));

    await waitFor(() => {
      expect(
        screen.getByText("Your access request was submitted. We will review it shortly."),
      ).toBeInTheDocument();
    });
  });

  it("disables submit until purpose entered", () => {
    render(<AccessRequestForm assetId="a1" token="tok" />);
    expect(screen.getByRole("button", { name: "Request access" })).toBeDisabled();
  });
});
