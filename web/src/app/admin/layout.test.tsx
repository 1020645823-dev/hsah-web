import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/admin/admin-shell", () => ({
  AdminShell: ({
    children,
    pageTitle,
  }: {
    children: React.ReactNode;
    pageTitle: string;
  }) => (
    <div data-testid="admin-shell" data-page-title={pageTitle}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/route-guard", () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-route-guard">{children}</div>
  ),
}));

import AdminLayout from "./layout";

describe("AdminLayout", () => {
  it("wraps admin pages with RouteGuard and the shared admin shell", () => {
    render(
      <AdminLayout>
        <div>admin content</div>
      </AdminLayout>,
    );

    expect(screen.getByTestId("admin-route-guard")).toBeInTheDocument();
    expect(screen.getByTestId("admin-shell")).toHaveAttribute("data-page-title", "Admin");
    expect(screen.getByText("admin content")).toBeInTheDocument();
  });
});
