import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders card variant", () => {
    render(<Skeleton variant="card" />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders table-row variant", () => {
    render(<Skeleton variant="table-row" />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders text-line variant", () => {
    render(<Skeleton variant="text-line" />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders block variant", () => {
    render(<Skeleton variant="block" />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders multiple items with count prop", () => {
    render(<Skeleton variant="card" count={3} />);
    const pulses = document.querySelectorAll(".animate-pulse");
    expect(pulses.length).toBeGreaterThan(0);
  });

  it("applies custom className", () => {
    render(<Skeleton variant="text-line" className="custom-class" />);
    const container = screen.getByText((_, element) => {
      return element?.classList.contains("custom-class") ?? false;
    });
    expect(container).toBeInTheDocument();
  });
});
