import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { FilterToolbar } from "./filter-toolbar";

describe("FilterToolbar", () => {
  it("renders a sticky toolbar shell with results and action slots", () => {
    render(
      <FilterToolbar
        resultsLabel="12 results"
        primaryAction={<button type="button">Apply filters</button>}
        secondaryAction={<button type="button">Reset</button>}
      >
        <input aria-label="Search assets" />
      </FilterToolbar>,
    );

    expect(screen.getByLabelText("Search assets")).toBeInTheDocument();
    expect(screen.getByText("12 results")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeInTheDocument();
  });
});
