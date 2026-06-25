import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { AuthRedirectPanel } from "./auth-redirect-panel";

describe("AuthRedirectPanel", () => {
  it("renders the redirect heading and message", () => {
    render(
      <AuthRedirectPanel message="You need to sign in before accessing admin routes." />,
    );

    expect(screen.getByText("AUTHENTICATION")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Redirecting to sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You need to sign in before accessing admin routes."),
    ).toBeInTheDocument();
  });
});
