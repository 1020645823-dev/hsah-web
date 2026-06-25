import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { AdminTopbar } from "./admin-topbar";

describe("AdminTopbar", () => {
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
});
