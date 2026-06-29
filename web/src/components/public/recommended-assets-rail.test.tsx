import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test-utils";
import "@testing-library/jest-dom/vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { RecommendedAssetsRail } from "@/components/public/recommended-assets-rail";
import type { PublicAssetSummary } from "@/lib/public-assets";

const assets: PublicAssetSummary[] = [
  {
    id: "r1",
    slug: "rec-one",
    title: "Recommended One",
    subtitle: null,
    short_description: "A recommended asset",
    cloud_providers: ["aws"],
    industries: [],
    technologies: [],
    asset_type: "solution",
    status: "published",
  },
];

describe("RecommendedAssetsRail", () => {
  it("renders recommended asset cards", () => {
    render(<RecommendedAssetsRail assets={assets} />);
    expect(screen.getByText("Recommended One")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Recommended One/ })).toHaveAttribute(
      "href",
      "/assets/rec-one",
    );
  });

  it("renders nothing when no recommended assets", () => {
    const { container } = render(<RecommendedAssetsRail assets={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
