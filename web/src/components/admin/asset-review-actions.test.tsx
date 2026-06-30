import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
  submitReview: vi.fn(),
  publishAsset: vi.fn(),
  unpublishAsset: vi.fn(),
  archiveAsset: vi.fn(),
  approveAsset: vi.fn(),
  rejectAsset: vi.fn(),
}));

vi.mock("@/lib/admin-asset-review", () => mocks);

import { AssetReviewActions } from "@/components/admin/asset-review-actions";

describe("AssetReviewActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows submit and publish actions for a draft", () => {
    render(<AssetReviewActions assetId="a1" status="draft" token="token" />);

    expect(screen.getByRole("button", { name: "Submit for review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });

  it("shows approve and reject for a reviewing asset", () => {
    render(<AssetReviewActions assetId="a1" status="reviewing" token="token" />);

    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("requires a reason before confirming reject", async () => {
    const user = userEvent.setup();
    render(<AssetReviewActions assetId="a1" status="reviewing" token="token" />);

    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(screen.getByRole("button", { name: "Reject asset" })).toBeDisabled();
    await user.type(screen.getByRole("textbox"), "Not enough detail");
    expect(screen.getByRole("button", { name: "Reject asset" })).not.toBeDisabled();

    mocks.rejectAsset.mockResolvedValue({ ok: true });
    await user.click(screen.getByRole("button", { name: "Reject asset" }));

    await waitFor(() => {
      expect(mocks.rejectAsset).toHaveBeenCalledWith("a1", "token", "Not enough detail");
    });
  });

  it("renders no action buttons for an archived asset", () => {
    render(<AssetReviewActions assetId="a1" status="archived" token="token" />);
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
  });
});
