import { render, screen, fireEvent } from "@testing-library/react";
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
    expect(screen.getAllByText("12 results").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeInTheDocument();
  });

  it("renders a mobile filter toggle button", () => {
    render(
      <FilterToolbar resultsLabel="5 results">
        <input aria-label="Search" />
      </FilterToolbar>,
    );

    const toggles = screen.getAllByRole("button", { name: /^Filters$/i });
    expect(toggles.length).toBeGreaterThanOrEqual(1);
    const toggle = toggles[0];
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "filter-panel");
  });

  it("toggles filter panel visibility on mobile when clicked", () => {
    render(
      <FilterToolbar resultsLabel="5 results">
        <input aria-label="Search" />
      </FilterToolbar>,
    );

    const panel = document.getElementById("filter-panel");
    expect(panel).toBeInTheDocument();

    const toggle = screen.getAllByRole("button", { name: /^Filters$/i })[0];
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("renders extra controls slot", () => {
    render(
      <FilterToolbar
        resultsLabel="3 results"
        extraControls={<button type="button">Export</button>}
      >
        <input aria-label="Filter" />
      </FilterToolbar>,
    );

    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });
});
