import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { User, Package, SearchX } from "lucide-react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with all props including single action", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={User}
        title="No users found"
        description="Get started by creating a new user."
        action={{ label: "Create User", onClick: handleClick }}
      />
    );

    expect(screen.getByText("No users found")).toBeInTheDocument();
    expect(screen.getByText("Get started by creating a new user.")).toBeInTheDocument();
    const button = screen.getByText("Create User");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders with multiple actions", () => {
    const handlePrimary = vi.fn();
    const handleSecondary = vi.fn();
    render(
      <EmptyState
        icon={SearchX}
        title="No results"
        description="Try adjusting your filters."
        actions={[
          { label: "Clear filters", onClick: handleSecondary, variant: "outline" },
          { label: "Browse all", onClick: handlePrimary },
        ]}
      />
    );

    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filters.")).toBeInTheDocument();

    const clearButton = screen.getByText("Clear filters");
    const browseButton = screen.getByText("Browse all");
    expect(clearButton).toBeInTheDocument();
    expect(browseButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(handleSecondary).toHaveBeenCalledTimes(1);

    fireEvent.click(browseButton);
    expect(handlePrimary).toHaveBeenCalledTimes(1);
  });

  it("renders without action", () => {
    render(
      <EmptyState
        icon={Package}
        title="No assets found"
        description="No assets available."
      />
    );

    expect(screen.getByText("No assets found")).toBeInTheDocument();
    expect(screen.getByText("No assets available.")).toBeInTheDocument();
    expect(screen.queryByText("Create User")).not.toBeInTheDocument();
  });

  it("renders icon with correct attributes", () => {
    render(
      <EmptyState
        icon={User}
        title="Test"
        description="Test description"
      />
    );

    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("stroke-width", "1.5");
  });

  it("renders icon inside a background container", () => {
    render(
      <EmptyState
        icon={SearchX}
        title="Test"
        description="Test description"
      />
    );

    const iconContainer = document.querySelector("div[class*='rounded-2xl']");
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass("bg-muted");
  });
});
