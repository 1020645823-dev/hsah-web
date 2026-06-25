import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BlockFilterBar } from "./block-filter-bar";

describe("BlockFilterBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders search input and type select", () => {
    render(<BlockFilterBar onFilterChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("搜索内容...")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("calls onFilterChange with keyword", () => {
    const onFilterChange = vi.fn();
    render(<BlockFilterBar onFilterChange={onFilterChange} />);

    const input = screen.getByPlaceholderText("搜索内容...");
    fireEvent.change(input, { target: { value: "hello" } });

    expect(onFilterChange).toHaveBeenCalledWith({ keyword: "hello", type: "" });
  });

  it("calls onFilterChange with type", () => {
    const onFilterChange = vi.fn();
    render(<BlockFilterBar onFilterChange={onFilterChange} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "text" } });

    expect(onFilterChange).toHaveBeenCalledWith({ keyword: "", type: "text" });
  });

  it("clear button resets filters", () => {
    const onFilterChange = vi.fn();
    render(<BlockFilterBar onFilterChange={onFilterChange} />);

    const input = screen.getByPlaceholderText("搜索内容...");
    fireEvent.change(input, { target: { value: "test" } });

    expect(onFilterChange).toHaveBeenCalledWith({ keyword: "test", type: "" });

    const clearButton = screen.getByText("清除");
    fireEvent.click(clearButton);

    expect(onFilterChange).toHaveBeenLastCalledWith({ keyword: "", type: "" });
    expect(input).toHaveValue("");
  });
});
