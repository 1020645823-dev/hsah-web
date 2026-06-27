import { describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@/test-utils";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

import { AdminTopbar } from "./admin-topbar";

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="Switch to dark mode">Toggle</button>,
}));

describe("AdminTopbar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the provided page title", () => {
    render(<AdminTopbar pageTitle="Assets" />);

    expect(screen.getByText("Assets")).toBeInTheDocument();
  });

  it("renders toggle menu button and login button", () => {
    render(<AdminTopbar pageTitle="Assets" />);

    expect(screen.getByLabelText("Toggle menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });
});
