import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { AuthRedirectPanel } from "./auth-redirect-panel";

describe("AuthRedirectPanel", () => {
  it("renders the redirect heading and message", () => {
    render(
      <AuthRedirectPanel message="You need to sign in before accessing admin routes." />,
    );

    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Redirecting to sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You need to sign in before accessing admin routes."),
    ).toBeInTheDocument();
    expect(screen.getByText("Workspace context")).toBeInTheDocument();
    expect(screen.getByText("Library return path")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to public library" })).toHaveAttribute(
      "href",
      "/assets",
    );
  });
});
