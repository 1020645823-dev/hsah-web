import { render, screen } from "@/test-utils";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { PublicSectionHero } from "./public-site-shell";

describe("PublicSectionHero", () => {
  it("uses semantic text colors so hero copy follows the active theme", () => {
    render(
      <PublicSectionHero
        eyebrow="HSAH PLATFORM"
        title="A branded content platform for AI delivery assets"
        summary="Move from discovery to reuse through shared public shell."
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-foreground");
    expect(screen.getByText("Move from discovery to reuse through shared public shell.")).toHaveClass(
      "text-muted-foreground",
    );
    expect(screen.getByText("HSAH PLATFORM")).toHaveClass("text-primary");
  });
});
