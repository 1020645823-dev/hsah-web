import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps default buttons at least 44px on mobile", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("min-h-11");
  });

  it("keeps icon buttons at least 44px on mobile", () => {
    render(<Button size="icon" aria-label="Open menu" />);

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveClass("size-11");
  });
});
