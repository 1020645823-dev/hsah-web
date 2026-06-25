import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { AssetEditorForm } from "./asset-editor-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("./content-blocks/content-block-editor", () => ({
  ContentBlockEditor: ({
    errors = [],
  }: {
    errors?: Array<{ blockId: string; field: string; message: string }>;
  }) => (
    <div data-testid="mock-content-block-editor">
      {errors.map((error) => (
        <p key={`${error.blockId}-${error.field}`}>{error.message}</p>
      ))}
    </div>
  ),
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
            content_schema_version: 2,
            content_blocks: [
              {
                id: "image-1",
                type: "image",
                version: 2,
                order: 0,
                visible: true,
                config: {
                  src: "https://example.com/asset.png",
                  alt: "",
                  caption: "",
                },
              },
            ],
          }),
        } as Response;
      }

      if (url.endsWith("/api/v1/admin/roles") && method === "GET") {
        return {
          ok: true,
          status: 200,
          json: async () => [],
        } as Response;
      }

      if (url.endsWith("/api/v1/admin/assets/asset-1") && method === "PUT") {
        return {
          ok: false,
          status: 422,
          json: async () => ({
            detail: {
              code: "content_block_validation_failed",
              message: "One or more content blocks are invalid",
              errors: [
                {
                  block_id: "image-1",
                  block_type: "image",
                  field: "config.alt",
                  message: "Alt text is required",
                },
              ],
            },
          }),
        } as Response;
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    }) as typeof fetch;
  });

  it("passes backend block errors into the content block editor after failed save", async () => {
    const user = userEvent.setup();

    render(<AssetEditorForm mode="edit" assetId="asset-1" token="token-123" />);

    await screen.findByDisplayValue("Demo Asset");

    const descriptionInput = screen.getByPlaceholderText("资产的简短描述");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Updated short description");

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(screen.getByText("Alt text is required")).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
  });
});
