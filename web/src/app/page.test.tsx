import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("shows the new platform framing and featured asset entry points", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /A branded content platform for AI delivery assets/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Explore Asset Library/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Featured assets/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Choose your path/i,
      }),
    ).toBeInTheDocument();
  });
});
