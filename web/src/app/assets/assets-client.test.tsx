import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AssetsClient } from "./assets-client";

const push = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/assets",
  useRouter: () => ({ push }),
}));

describe("AssetsClient", () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state when no items exist", () => {
    render(
      <AssetsClient
        initialResponse={{ items: [], total: 0, limit: 12, offset: 0 }}
        initialQuery={{ limit: 12, offset: 0 }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Asset Library" })).toBeInTheDocument();
    expect(
      screen.getByText("Search reusable demos, architectures, and implementation references."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Search assets")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeInTheDocument();
    expect(
      screen.getByText("No assets matched the current filters."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Clear the active filters or return to featured assets."),
    ).toBeInTheDocument();
  });

  it("pushes search and filter params back to the assets url", () => {
    render(
      <AssetsClient
        initialResponse={{
          items: [
            {
              id: "asset-1",
              slug: "agent-hub",
              title: "Agent Hub",
              subtitle: null,
              short_description: "Production-ready agent workflow starter.",
              cloud_providers: ["aws"],
              industries: ["banking"],
              technologies: ["ai"],
              asset_type: "solution",
              status: "published",
            },
          ],
          total: 1,
          limit: 12,
          offset: 0,
        }}
        initialQuery={{ limit: 12, offset: 0 }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Search assets"), {
      target: { value: "agent" },
    });
    fireEvent.change(screen.getByLabelText("Cloud"), {
      target: { value: "aws" },
    });
    fireEvent.change(screen.getByLabelText("Asset type"), {
      target: { value: "solution" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(push).toHaveBeenCalledWith("/assets?q=agent&cloud=aws&asset_type=solution&limit=12&offset=0");
  });

  it("renders result cards and paginates with next page offset", () => {
    render(
      <AssetsClient
        initialResponse={{
          items: [
            {
              id: "asset-1",
              slug: "agent-hub",
              title: "Agent Hub",
              subtitle: null,
              short_description: "Production-ready agent workflow starter.",
              cloud_providers: ["aws"],
              industries: ["banking"],
              technologies: ["ai", "search"],
              asset_type: "solution",
              status: "published",
            },
          ],
          total: 25,
          limit: 12,
          offset: 0,
        }}
        initialQuery={{ limit: 12, offset: 0 }}
      />,
    );

    expect(screen.getByText("Agent Hub")).toBeInTheDocument();
    expect(screen.getByText("25 results")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(push).toHaveBeenCalledWith("/assets?limit=12&offset=12");
  });

  it("shows an actionable empty state for active filters", () => {
    render(
      <AssetsClient
        initialResponse={{ items: [], total: 0, limit: 12, offset: 0 }}
        initialQuery={{ q: "missing", limit: 12, offset: 0 }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(push).toHaveBeenCalledWith("/assets?limit=12&offset=0");
  });

  it("renders sort and view controls when items are present", () => {
    render(
      <AssetsClient
        initialResponse={{
          items: [
            {
              id: "asset-1",
              slug: "agent-hub",
              title: "Agent Hub",
              subtitle: null,
              short_description: "Production-ready agent workflow starter.",
              cloud_providers: ["aws"],
              industries: ["banking"],
              technologies: ["ai", "search"],
              asset_type: "solution",
              status: "published",
            },
          ],
          total: 1,
          limit: 12,
          offset: 0,
        }}
        initialQuery={{ limit: 12, offset: 0 }}
      />,
    );

    expect(screen.getByLabelText("Sort by")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List view" })).toBeInTheDocument();
  });

  it("switches view mode and pushes updated query", () => {
    render(
      <AssetsClient
        initialResponse={{
          items: [
            {
              id: "asset-1",
              slug: "agent-hub",
              title: "Agent Hub",
              subtitle: null,
              short_description: "Production-ready agent workflow starter.",
              cloud_providers: ["aws"],
              industries: ["banking"],
              technologies: ["ai", "search"],
              asset_type: "solution",
              status: "published",
            },
          ],
          total: 1,
          limit: 12,
          offset: 0,
        }}
        initialQuery={{ limit: 12, offset: 0 }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "List view" }));

    expect(push).toHaveBeenCalledWith("/assets?view=list&limit=12&offset=0");
  });
});
