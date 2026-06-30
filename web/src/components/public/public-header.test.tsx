import { render, screen, cleanup } from "@/test-utils";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PublicHeader } from "./public-header";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => mockUsePathname(),
  useParams: () => ({ locale: "en" }),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="Switch to dark mode">Toggle</button>,
}));

describe("PublicHeader", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue("/assets");
  });

  afterEach(() => {
    cleanup();
  });

  it("marks the current public route as active", () => {
    render(<PublicHeader ctaHref="/assets" ctaLabel="Explore Asset Library" />);

    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Scenarios" })).not.toHaveAttribute("aria-current");
  });

  it("renders the theme toggle", () => {
    render(<PublicHeader ctaHref="/assets" ctaLabel="Explore Asset Library" />);

    const toggles = screen.getAllByRole("button", { name: "Switch to dark mode" });
    expect(toggles.length).toBeGreaterThanOrEqual(1);
  });
});
