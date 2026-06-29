import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import "@testing-library/jest-dom/vitest";

const { mockFetchRelatedAssets } = vi.hoisted(() => ({
  mockFetchRelatedAssets: vi.fn(),
}));

vi.mock("@/lib/asset-engagement", async () => {
  const actual = await vi.importActual<typeof import("@/lib/asset-engagement")>("@/lib/asset-engagement");
  return { ...actual, fetchRelatedAssets: mockFetchRelatedAssets };
});

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { RelatedAssets } from "@/components/public/related-assets";

describe("RelatedAssets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders related asset cards when data present", async () => {
    mockFetchRelatedAssets.mockResolvedValue({
      ok: true,
      data: [
        {
          id: "r1",
          slug: "related-one",
          title: "Related One",
          subtitle: null,
          short_description: "A related asset",
          cloud_providers: ["aws"],
          asset_type: "solution",
          match_score: 5,
        },
      ],
    });

    render(<RelatedAssets assetId="a1" />);

    await waitFor(() => {
      expect(screen.getByText("Related One")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /Related One/ })).toHaveAttribute(
      "href",
      "/assets/related-one",
    );
  });

  it("renders nothing when no related assets", async () => {
    mockFetchRelatedAssets.mockResolvedValue({ ok: true, data: [] });
    const { container } = render(<RelatedAssets assetId="a1" />);
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});
