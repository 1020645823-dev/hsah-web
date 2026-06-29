import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test-utils";
import "@testing-library/jest-dom/vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { AssetCollectionRail } from "@/components/public/asset-collection-rail";
import type { PublicCollectionSummary } from "@/lib/public-assets";

const collections: PublicCollectionSummary[] = [
  {
    id: "c1",
    slug: "ai-transform",
    title: "AI Transformation",
    summary: "Assets for AI-led delivery.",
    cover_url: null,
    item_count: 5,
  },
];

describe("AssetCollectionRail", () => {
  it("renders collection cards with item counts", () => {
    render(<AssetCollectionRail collections={collections} />);
    expect(screen.getByText("AI Transformation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AI Transformation/ })).toHaveAttribute(
      "href",
      "/assets/collections/ai-transform",
    );
  });

  it("renders nothing when collections list is empty", () => {
    const { container } = render(<AssetCollectionRail collections={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
