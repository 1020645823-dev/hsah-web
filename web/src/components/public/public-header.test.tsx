import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicHeader } from "./public-header";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("PublicHeader", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue("/assets");
  });

  it("marks the current public route as active", () => {
    render(<PublicHeader ctaHref="/assets" ctaLabel="Explore Asset Library" />);

    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Scenarios" })).not.toHaveAttribute("aria-current");
  });
});
