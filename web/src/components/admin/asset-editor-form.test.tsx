import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { AssetEditorForm } from "./asset-editor-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("./asset-video-manager", () => ({
  AssetVideoManager: () => <div data-testid="mock-asset-video-manager" />,
}));

vi.mock("./asset-attachments-manager", () => ({
  AssetAttachmentsManager: () => <div data-testid="mock-asset-attachments-manager" />,
}));

describe("AssetEditorForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url.endsWith("/api/v1/admin/assets/asset-1") && method === "GET") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "asset-1",
            slug: "demo-asset",
            title: "Demo Asset",
            short_description: "Original short description",
            asset_type: "solution",
            status: "draft",
            visibility: "public",
            shared_fields: {
              introduction: "Shared overview",
              use_cases: ["customer onboarding"],
              live_demo_url: "https://example.com/live",
            },
            sales_fields: {
              value_summary: "Sales framing",
              differentiators: ["accelerator"],
              outcomes: ["shorter presales"],
            },
          }),
        } as Response;
      }

      if (url.endsWith("/api/v1/admin/assets/asset-1") && method === "PUT") {
        return {
          ok: false,
          status: 422,
          json: async () => ({
            detail: {
              code: "validation_failed",
              message: "Slug already exists",
            },
          }),
        } as Response;
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    }) as typeof fetch;
  });

  it("shows a submit error message after a failed save", async () => {
    const user = userEvent.setup();

    render(<AssetEditorForm mode="edit" assetId="asset-1" token="token-123" />);

    await screen.findByDisplayValue("Demo Asset");

    const descriptionInput = screen.getByPlaceholderText("Brief description shown in listings");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Updated short description");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Slug already exists")).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("loads shared and sales detail fields into the form", async () => {
    render(<AssetEditorForm mode="edit" assetId="asset-1" token="token-123" />);

    expect(await screen.findByDisplayValue("Shared overview")).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-asset-video-manager").length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue("Sales framing").length).toBeGreaterThan(0);
  });
});
