import { describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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

  it("renders the provided page title and workspace label", () => {
    render(<AdminTopbar pageTitle="Assets" />);

    expect(screen.getByText("ADMIN WORKSPACE")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assets" })).toBeInTheDocument();
  });

  it("renders breadcrumb trail when breadcrumb items are provided", () => {
    render(
      <AdminTopbar
        pageTitle="Assets"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Assets", href: "/admin/assets" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Admin" })).toHaveTextContent("Admin");
    expect(screen.getByText("Assets", { selector: 'span[aria-current="page"]' })).toBeInTheDocument();
  });

  it("renders the theme toggle", () => {
    render(<AdminTopbar pageTitle="Assets" />);

    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });
});
