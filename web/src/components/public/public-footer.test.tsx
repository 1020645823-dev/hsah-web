import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { PublicFooter } from "./public-footer";

describe("PublicFooter", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps footer links at least 44px on mobile", () => {
    render(<PublicFooter />);

    expect(screen.getByRole("link", { name: "Asset Library" })).toHaveClass("min-h-11");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveClass("min-h-11");
    expect(screen.getByRole("link", { name: "About the platform" })).toHaveClass("min-h-11");
  });
});
