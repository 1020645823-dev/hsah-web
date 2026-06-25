import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/assets",
}));

import { AdminShell } from "./admin-shell";

describe("AdminShell", () => {
  it("renders a sidebar, topbar, and page content slot", () => {
    render(
      <AdminShell pageTitle="Overview">
        <div>Page body</div>
      </AdminShell>,
    );

    expect(screen.getByRole("navigation", { name: "Admin sections" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute("href", "/admin/assets");
    expect(screen.getByText("Page body")).toBeInTheDocument();
  });
});
