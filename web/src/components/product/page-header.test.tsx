import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders title, summary, eyebrow, and actions in a compact header", () => {
    render(
      <PageHeader
        eyebrow="ASSET LIBRARY"
        title="Asset Library"
        summary="Explore reusable demos and architectures."
        actions={<button type="button">Primary action</button>}
      />,
    );

    expect(screen.getByText("ASSET LIBRARY")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Asset Library" })).toBeInTheDocument();
    expect(screen.getByText("Explore reusable demos and architectures.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Primary action" })).toBeInTheDocument();
  });
});
