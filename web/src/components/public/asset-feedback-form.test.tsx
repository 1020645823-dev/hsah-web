import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const { mockSubmitFeedback } = vi.hoisted(() => ({
  mockSubmitFeedback: vi.fn(),
}));

vi.mock("@/lib/asset-engagement", async () => {
  const actual = await vi.importActual<typeof import("@/lib/asset-engagement")>("@/lib/asset-engagement");
  return { ...actual, submitFeedback: mockSubmitFeedback };
});

import { AssetFeedbackForm } from "@/components/public/asset-feedback-form";

describe("AssetFeedbackForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables submit until message is entered", () => {
    render(<AssetFeedbackForm assetId="a1" />);
    expect(screen.getByRole("button", { name: "Submit feedback" })).toBeDisabled();
  });

  it("submits feedback and shows confirmation", async () => {
    mockSubmitFeedback.mockResolvedValue({ ok: true, data: { id: "f1" } });
    const user = userEvent.setup();
    render(<AssetFeedbackForm assetId="a1" />);

    await user.type(screen.getByRole("textbox"), "Great asset");
    await user.click(screen.getByRole("button", { name: "Submit feedback" }));

    await waitFor(() => {
      expect(
        screen.getByText("Thanks - your feedback was submitted."),
      ).toBeInTheDocument();
    });
    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      "a1",
      { feedback_type: "question", message: "Great asset" },
      undefined,
    );
  });

  it("shows error message on failure", async () => {
    mockSubmitFeedback.mockResolvedValue({
      ok: false,
      error: { message: "Something went wrong", retryable: false },
    });
    const user = userEvent.setup();
    render(<AssetFeedbackForm assetId="a1" />);

    await user.type(screen.getByRole("textbox"), "Oops");
    await user.click(screen.getByRole("button", { name: "Submit feedback" }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });
});
