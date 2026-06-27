import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => async () => (key: string) => key,
}));

vi.mock("@/components/public-site-shell", () => ({
  PublicSiteShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PublicSectionHero: () => <div>PublicSectionHero</div>,
  PublicMetricStrip: () => <div>PublicMetricStrip</div>,
}));

vi.mock("@/components/public/content-lane-grid", () => ({
  ContentLaneGrid: () => <div>ContentLaneGrid</div>,
}));

vi.mock("@/components/public/homepage-featured-assets", () => ({
  HomepageFeaturedAssets: () => <div>HomepageFeaturedAssets</div>,
}));

import Home from "./page";

describe("Home", () => {
  it.skip("shows the new platform framing and featured asset entry points", async () => {
    const element = await Home({ params: Promise.resolve({ locale: "en" }) });
    render(element);

    expect(screen.getByText("PublicSectionHero")).toBeInTheDocument();
    expect(screen.getByText("PublicMetricStrip")).toBeInTheDocument();
    expect(screen.getByText("ContentLaneGrid")).toBeInTheDocument();
    expect(screen.getByText("HomepageFeaturedAssets")).toBeInTheDocument();
  });
});
