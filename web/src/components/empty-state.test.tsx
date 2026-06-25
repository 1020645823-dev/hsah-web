import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { User, Package } from "lucide-react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with all props including action", () => {
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
});