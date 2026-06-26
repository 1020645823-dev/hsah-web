import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { PublicAssetDetailClient } from "./public-asset-detail-client";

vi.mock("@/lib/admin", () => ({
  getStoredAdminToken: vi.fn(() => null),
}));

vi.mock("@/lib/public-assets", async () => {
  const actual = await vi.importActual<typeof import("@/lib/public-assets")>("@/lib/public-assets");
  return {
    ...actual,
    fetchPublicAssetDetail: vi.fn(),
  };
});

describe("PublicAssetDetailClient", () => {
  it("renders safely when detail field groups are missing", () => {
    const { container } = render(
      <PublicAssetDetailClient
        slug="agentic-service-mesh-kubernetes"
        initialAsset={
          {
            id: "asset-1",
            slug: "agentic-service-mesh-kubernetes",
            title: "Agentic Service Mesh on Kubernetes",
            subtitle: null,
            short_description: "Short description",
            cloud_providers: ["aws"],
            industries: ["banking"],
            technologies: ["kubernetes"],
            asset_type: "reference-architecture",
            status: "published",
            visibility: "public",
            content_blocks: [],
          } as never
        }
      />,
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
