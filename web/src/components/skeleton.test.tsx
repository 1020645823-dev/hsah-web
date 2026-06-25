import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  Skeleton,
  AssetCardSkeleton,
  AssetListSkeleton,
  AssetGridSkeleton,
  AssetListViewSkeleton,
} from "./skeleton";

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

describe("AssetCardSkeleton", () => {
  it("renders with animate-pulse", () => {
    render(<AssetCardSkeleton />);
    const pulses = document.querySelectorAll(".animate-pulse");
    expect(pulses.length).toBeGreaterThan(0);
  });
});

describe("AssetListSkeleton", () => {
  it("renders with animate-pulse", () => {
    render(<AssetListSkeleton />);
    const pulses = document.querySelectorAll(".animate-pulse");
    expect(pulses.length).toBeGreaterThan(0);
  });
});

describe("AssetGridSkeleton", () => {
  it("renders default count of card skeletons", () => {
    render(<AssetGridSkeleton />);
    const cards = document.querySelectorAll(".animate-pulse");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("renders custom count of card skeletons", () => {
    render(<AssetGridSkeleton count={3} />);
    const cards = document.querySelectorAll(".animate-pulse");
    expect(cards.length).toBeGreaterThan(0);
  });
});

describe("AssetListViewSkeleton", () => {
  it("renders default count of list skeletons", () => {
    render(<AssetListViewSkeleton />);
    const items = document.querySelectorAll(".animate-pulse");
    expect(items.length).toBeGreaterThan(0);
  });

  it("renders custom count of list skeletons", () => {
    render(<AssetListViewSkeleton count={3} />);
    const items = document.querySelectorAll(".animate-pulse");
    expect(items.length).toBeGreaterThan(0);
  });
});
