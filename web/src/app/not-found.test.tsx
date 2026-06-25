import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("renders 404 text and page not found message", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByText("The page you are looking for does not exist or has been moved.")).toBeInTheDocument();
  });

  it("renders back to home link", () => {
    render(<NotFound />);

    const homeLinks = screen.getAllByRole("link", { name: /back to home/i });
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    expect(homeLinks[0]).toHaveAttribute("href", "/");
  });

  it("renders explore assets link", () => {
    render(<NotFound />);

    const assetsLinks = screen.getAllByRole("link", { name: /explore assets/i });
    expect(assetsLinks.length).toBeGreaterThanOrEqual(1);
    expect(assetsLinks[0]).toHaveAttribute("href", "/assets");
  });
});
