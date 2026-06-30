import { screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { render } from "@/test-utils";

import { AssetDetailView } from "./asset-detail-view";

// Detail view fetches attachments; stub fetch so the documents tab settles empty.
vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));

describe("AssetDetailView", () => {
  it("renders shared and sales panels when provided", () => {
    render(
      <AssetDetailView
        slug="test-asset"
        sharedFields={{
          introduction: "Shared overview for stakeholders",
          useCases: ["customer onboarding"],
          liveDemoUrl: "https://example.com/live",
        }}
        salesFields={{
          valueSummary: "Reusable enterprise-safe agent platform.",
          differentiators: ["mesh-native policy control"],
          outcomes: ["faster alignment"],
        }}
      />,
    );

    expect(screen.getByText("Shared overview for stakeholders")).toBeInTheDocument();
    expect(screen.getByText("Reusable enterprise-safe agent platform.")).toBeInTheDocument();
    expect(screen.getByText("customer onboarding")).toBeInTheDocument();
    expect(screen.getByText("mesh-native policy control")).toBeInTheDocument();
  });

  it("renders the media tabs", () => {
    render(
      <AssetDetailView
        slug="test-asset"
        sharedFields={{
          videos: [
            { id: "v1", title: "Overview", videoUrl: "https://example.com/v.mp4", isPrimary: true },
          ],
        }}
      />,
    );

    expect(screen.getByText("Online videos")).toBeInTheDocument();
    expect(screen.getByText("File attachments")).toBeInTheDocument();
  });

  it("omits the shared panel when there is no shared content", () => {
    render(<AssetDetailView slug="test-asset" />);
    expect(screen.queryByText("Shared overview for stakeholders")).not.toBeInTheDocument();
  });
});
