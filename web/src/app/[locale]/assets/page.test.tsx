import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AssetsPage from "./page";

const mocks = vi.hoisted(() => ({
  fetchPublicAssets: vi.fn(),
  fetchPublicCollections: vi.fn(),
  fetchRecommendedAssets: vi.fn(),
  parseAssetQueryFromSearchParams: vi.fn(),
  assetsClientProps: vi.fn(),
  publicSiteShellProps: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("@/lib/public-assets", () => ({
  fetchPublicAssets: mocks.fetchPublicAssets,
  fetchPublicCollections: mocks.fetchPublicCollections,
  fetchRecommendedAssets: mocks.fetchRecommendedAssets,
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

vi.mock("@/components/error-alert", () => ({
  ErrorAlert: ({ error }: { error: { userMessage: string } }) => (
    <div data-testid="error-alert">{error.userMessage}</div>
  ),
}));

describe("AssetsPage", () => {
  beforeEach(() => {
    mocks.fetchPublicAssets.mockReset();
    mocks.fetchPublicCollections.mockReset();
    mocks.fetchRecommendedAssets.mockReset();
    mocks.parseAssetQueryFromSearchParams.mockReset();
    mocks.assetsClientProps.mockReset();
    mocks.publicSiteShellProps.mockReset();
    mocks.fetchPublicCollections.mockResolvedValue({ ok: true, data: [] });
    mocks.fetchRecommendedAssets.mockResolvedValue({ ok: true, data: [] });
  });

  it("parses search params, fetches first page data, and renders the client shell", async () => {
    mocks.parseAssetQueryFromSearchParams.mockReturnValue({
      q: "agent",
      cloud: "aws",
      limit: 12,
      offset: 24,
    });
    mocks.fetchPublicAssets.mockResolvedValue({
      ok: true,
      data: { items: [], total: 0, limit: 12, offset: 24 },
    });

    const element = await AssetsPage({
      params: Promise.resolve({ locale: "en" }),
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
      collections: [],
      recommended: [],
    });
    expect(mocks.publicSiteShellProps).toHaveBeenCalledWith({
      ctaHref: "/auth/login",
      ctaLabel: "ctaLabel",
    });
    expect(screen.getByText("mocked-assets-client")).toBeInTheDocument();
  });

  it("renders error alert when fetchPublicAssets returns an error", async () => {
    mocks.parseAssetQueryFromSearchParams.mockReturnValue({
      q: "agent",
      limit: 12,
      offset: 0,
    });
    mocks.fetchPublicAssets.mockResolvedValue({
      ok: false,
      error: {
        category: "server",
        status: 500,
        message: "Internal Server Error",
        userMessage: "Server temporarily unavailable, please try again later.",
        icon: () => null,
        retryable: true,
      },
    });

    const element = await AssetsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ q: "agent" }),
    });

    render(element);

    expect(screen.getByTestId("error-alert")).toHaveTextContent(
      "Server temporarily unavailable, please try again later."
    );
  });
});
