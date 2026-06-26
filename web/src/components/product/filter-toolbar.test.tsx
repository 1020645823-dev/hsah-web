import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { FilterToolbar } from "./filter-toolbar";

describe("FilterToolbar", () => {
  afterEach(() => {
    cleanup();
  });

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
    expect(screen.getAllByRole("button", { name: "Reset" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: "Apply filters" }).length).toBeGreaterThanOrEqual(1);
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

    expect(screen.getAllByRole("button", { name: "Export" }).length).toBeGreaterThanOrEqual(1);
  });

  it("keeps the search control outside the collapsible filter panel", () => {
    render(
      <FilterToolbar
        resultsLabel="8 results"
        persistentControl={<input aria-label="Search assets" />}
      >
        <select aria-label="Cloud" />
      </FilterToolbar>,
    );

    const panel = document.getElementById("filter-panel");
    const search = screen.getByLabelText("Search assets");

    expect(panel).toBeInTheDocument();
    expect(panel).not.toContainElement(search);
    expect(search).toBeInTheDocument();
  });

  it("renders mobile panel actions with apply clear sort and view controls", () => {
    render(
      <FilterToolbar
        resultsLabel="8 results"
        persistentControl={<input aria-label="Search assets" />}
        primaryAction={<button type="button">Apply filters</button>}
        secondaryAction={<button type="button">Clear filters</button>}
        extraControls={
          <div>
            <select aria-label="Sort by" />
            <button type="button">Grid view</button>
          </div>
        }
      >
        <select aria-label="Cloud" />
      </FilterToolbar>,
    );

    const panel = document.getElementById("filter-panel");

    expect(panel).toContainElement(screen.getAllByRole("button", { name: "Apply filters" })[0]);
    expect(panel).toContainElement(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(panel).toContainElement(screen.getAllByLabelText("Sort by")[0]);
    expect(panel).toContainElement(screen.getAllByRole("button", { name: "Grid view" })[0]);
  });
});
