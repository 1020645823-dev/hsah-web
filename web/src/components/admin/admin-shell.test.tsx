import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test-utils";
import "@testing-library/jest-dom/vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/assets",
  useParams: () => ({ locale: "en" }),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

import { AdminShell } from "./admin-shell";

describe("AdminShell", () => {
  it("renders a sidebar, topbar, and page content slot", () => {
    render(
      <AdminShell pageTitle="Overview">
        <div>Page body</div>
      </AdminShell>,
    );

    expect(screen.getByLabelText("Admin modules")).toBeInTheDocument();
    expect(screen.getAllByText("Overview").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute("href", "/admin/assets");
    expect(screen.getByText("Page body")).toBeInTheDocument();
  });
});
