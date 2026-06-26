import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { AssetDetailView } from "./asset-detail-view";

const blocks = [
  {
    id: "shared-1",
    type: "text" as const,
    version: 2,
    order: 0,
    visible: true,
    audience: "shared" as const,
    config: {
      markdown: "",
      html: "<p>Shared architecture context</p>",
    },
  },
  {
    id: "sales-1",
    type: "text" as const,
    version: 2,
    order: 1,
    visible: true,
    audience: "sales" as const,
    config: {
      markdown: "",
      html: "<p>Sales proof points</p>",
    },
  },
  {
    id: "delivery-1",
    type: "text" as const,
    version: 2,
    order: 2,
    visible: true,
    audience: "delivery" as const,
    config: {
      markdown: "",
      html: "<p>Delivery deployment checklist</p>",
    },
  },
];

describe("AssetDetailView", () => {
  it("defaults to sales mode and renders audience-filtered blocks", () => {
    render(
      <AssetDetailView
        blocks={blocks}
        deliveryAccess="request_access"
        sharedFields={{
          introduction: "Shared overview for both audiences",
          useCases: ["customer onboarding"],
          demoVideoUrl: "https://example.com/demo.mp4",
          liveDemoUrl: "https://example.com/live",
        }}
        salesFields={{
          valueSummary: "Sales framing for decision-makers",
          differentiators: ["Faster presales"],
          outcomes: ["Shorter cycle"],
        }}
        deliveryFields={{
          implementationSummary: "Delivery checklist",
          prerequisites: ["Kubernetes"],
          rolloutSteps: ["Provision cluster"],
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Sales" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Shared overview for both audiences")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Watch demo video" })).toHaveAttribute("href", "https://example.com/demo.mp4");
    expect(screen.getByRole("link", { name: "Open live demo" })).toHaveAttribute("href", "https://example.com/live");
    expect(screen.getByText("Sales framing for decision-makers")).toBeInTheDocument();
    expect(screen.getByText("Sales proof points")).toBeInTheDocument();
    expect(screen.getByText("Shared architecture context")).toBeInTheDocument();
    expect(screen.queryByText("Delivery deployment checklist")).not.toBeInTheDocument();
  });

  it("shows a controlled delivery panel when delivery access is not granted", async () => {
    const user = userEvent.setup();

    const view = render(
      <AssetDetailView
        blocks={blocks}
        deliveryAccess="signin_required"
        sharedFields={{ introduction: "Shared overview" }}
        salesFields={{ valueSummary: "Sales framing" }}
        deliveryFields={{ implementationSummary: "Delivery checklist" }}
      />,
    );
    const queries = within(view.container);

    await user.click(queries.getByRole("button", { name: "Delivery" }));

    expect(screen.getByRole("heading", { name: "Delivery implementation access" })).toBeInTheDocument();
    expect(
      screen.getByText("Sign in with an approved role to review runbooks, deployment steps, and delivery notes."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/login");
    expect(screen.queryByText("Delivery deployment checklist")).not.toBeInTheDocument();
  });

  it("renders delivery blocks after switching when delivery access is granted", async () => {
    const user = userEvent.setup();

    const view = render(
      <AssetDetailView
        blocks={blocks}
        deliveryAccess="granted"
        sharedFields={{ introduction: "Shared overview" }}
        salesFields={{ valueSummary: "Sales framing" }}
        deliveryFields={{
          implementationSummary: "Delivery checklist",
          prerequisites: ["Kubernetes"],
          rolloutSteps: ["Provision cluster"],
        }}
      />,
    );
    const queries = within(view.container);

    await user.click(queries.getByRole("button", { name: "Delivery" }));

    expect(queries.getByRole("button", { name: "Delivery" })).toHaveAttribute("aria-pressed", "true");
    expect(queries.getByText("Delivery checklist")).toBeInTheDocument();
    expect(queries.getByText("Kubernetes")).toBeInTheDocument();
    expect(queries.getByText("Provision cluster")).toBeInTheDocument();
    expect(queries.getByText("Shared architecture context")).toBeInTheDocument();
    expect(queries.getByText("Delivery deployment checklist")).toBeInTheDocument();
    expect(queries.queryByText("Sales proof points")).not.toBeInTheDocument();
  });
});
