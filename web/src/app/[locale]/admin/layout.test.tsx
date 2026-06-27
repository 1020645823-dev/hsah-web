import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

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
  it("wraps admin pages with RouteGuard and the shared admin shell", async () => {
    render(
      await AdminLayout({
        children: <div>admin content</div>,
      }),
    );

    expect(screen.getByTestId("admin-route-guard")).toBeInTheDocument();
    expect(screen.getByTestId("admin-shell")).toHaveAttribute("data-page-title", "layout.defaultTitle");
    expect(screen.getByText("admin content")).toBeInTheDocument();
  });
});
