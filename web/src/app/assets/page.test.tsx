import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AssetsPage from "./page";

const mocks = vi.hoisted(() => ({
  fetchPublicAssets: vi.fn(),
  parseAssetQueryFromSearchParams: vi.fn(),
  assetsClientProps: vi.fn(),
  publicSiteShellProps: vi.fn(),
}));

vi.mock("@/lib/public-assets", () => ({
  fetchPublicAssets: mocks.fetchPublicAssets,
  parseAssetQueryFromSearchParams: mocks.parseAssetQueryFromSearchParams,
}));

vi.mock("./assets-client", () => ({
  AssetsClient: (props: unknown) => {
    mocks.assetsClientProps(props);
    return <div>mocked-assets-client</div>;
  },
}));

vi.mock("@/components/public-site-shell", () => ({
  PublicSiteShell: ({
    children,
    ctaHref,
    ctaLabel,
  }: {
    children: React.ReactNode;
    ctaHref?: string;
    ctaLabel?: string;
  }) => {
    mocks.publicSiteShellProps({ ctaHref, ctaLabel });
    return <div>{children}</div>;
  },
  PublicSectionHero: () => <div>mocked-public-section-hero</div>,
}));

describe("AssetsPage", () => {
  beforeEach(() => {
    mocks.fetchPublicAssets.mockReset();
    mocks.parseAssetQueryFromSearchParams.mockReset();
    mocks.assetsClientProps.mockReset();
    mocks.publicSiteShellProps.mockReset();
  });

  it("parses search params, fetches first page data, and renders the client shell", async () => {
    mocks.parseAssetQueryFromSearchParams.mockReturnValue({
      q: "agent",
      cloud: "aws",
      limit: 12,
      offset: 24,
    });
    mocks.fetchPublicAssets.mockResolvedValue({
      items: [],
      total: 0,
      limit: 12,
      offset: 24,
    });

    const element = await AssetsPage({
      searchParams: Promise.resolve({
        q: "agent",
        cloud: "aws",
        limit: "12",
        offset: "24",
      }),
    });

    render(element);

    expect(mocks.parseAssetQueryFromSearchParams).toHaveBeenCalledWith({
      q: "agent",
      cloud: "aws",
      limit: "12",
      offset: "24",
    });
    expect(mocks.fetchPublicAssets).toHaveBeenCalledWith({
      q: "agent",
      cloud: "aws",
      limit: 12,
      offset: 24,
    });
    expect(mocks.assetsClientProps).toHaveBeenCalledWith({
      initialResponse: { items: [], total: 0, limit: 12, offset: 24 },
      initialQuery: { q: "agent", cloud: "aws", limit: 12, offset: 24 },
    });
    expect(mocks.publicSiteShellProps).toHaveBeenCalledWith({
      ctaHref: "/auth/login",
      ctaLabel: "Sign in",
    });
    expect(screen.getByText("mocked-assets-client")).toBeInTheDocument();
  });
});
