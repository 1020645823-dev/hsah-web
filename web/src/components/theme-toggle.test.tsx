import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle";

const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({ setTheme: mockSetTheme, resolvedTheme: "light" });
  });

  afterEach(() => {
    cleanup();
    mockSetTheme.mockReset();
    mockUseTheme.mockReset();
  });

  it("keeps icon toggle at least 44px on mobile", async () => {
    render(<ThemeToggle />);

    const toggle = await screen.findByRole("button", { name: "Switch to dark mode" });
    expect(toggle).toHaveClass("size-11", "min-h-11");
  });

  it("keeps text toggle at least 44px on mobile", async () => {
    render(<ThemeToggle variant="ghost" />);

    const toggle = await screen.findByRole("button", { name: "Switch to dark mode" });
    expect(toggle).toHaveClass("min-h-11");
  });
});
