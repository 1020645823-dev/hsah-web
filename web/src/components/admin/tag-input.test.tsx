import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "./tag-input";

afterEach(cleanup);

function renderControlled(initial: string[] = [], suggestions?: string[]) {
  const handleChange = vi.fn();
  function Wrapper() {
    const [value, setValue] = React.useState(initial);
    return (
      <TagInput
        value={value}
        onChange={(next) => {
          handleChange(next);
          setValue(next);
        }}
        suggestions={suggestions}
        placeholder="Add tags..."
      />
    );
  }
  return { handleChange, Wrapper };
}

describe("TagInput", () => {
  it("渲染空输入框", () => {
    const { Wrapper } = renderControlled();
    render(<Wrapper />);
    const input = screen.getByPlaceholderText("Add tags...");
    expect(input).toBeTruthy();
    expect(screen.queryAllByTestId("tag-chip")).toHaveLength(0);
  });

  it("渲染已有 values 的 chips", () => {
    const { Wrapper } = renderControlled(["alpha", "beta"]);
    render(<Wrapper />);
    const chips = screen.getAllByTestId("tag-chip");
    expect(chips).toHaveLength(2);
    expect(chips[0].textContent).toContain("alpha");
    expect(chips[1].textContent).toContain("beta");
  });

  it("Enter 键添加 tag", async () => {
    const user = userEvent.setup();
    const { handleChange, Wrapper } = renderControlled();
    render(<Wrapper />);
    const input = screen.getByPlaceholderText("Add tags...");
    await user.type(input, "hello");
    await user.keyboard("{Enter}");
    expect(handleChange).toHaveBeenCalledWith(["hello"]);
  });

  it("逗号分隔添加 tag", async () => {
    const user = userEvent.setup();
    const { handleChange, Wrapper } = renderControlled();
    render(<Wrapper />);
    const input = screen.getByPlaceholderText("Add tags...");
    await user.type(input, "foo,bar,");
    expect(handleChange).toHaveBeenNthCalledWith(1, ["foo"]);
    expect(handleChange).toHaveBeenNthCalledWith(2, ["foo", "bar"]);
  });

  it("去重 tags", async () => {
    const user = userEvent.setup();
    const { handleChange, Wrapper } = renderControlled(["alpha"]);
    render(<Wrapper />);
    const input = screen.getByPlaceholderText("Add tags...");
    await user.type(input, "alpha");
    await user.keyboard("{Enter}");
    expect(handleChange).toHaveBeenCalledWith(["alpha"]);
  });

  it("通过 × 按钮删除 tag", async () => {
    const user = userEvent.setup();
    const { handleChange, Wrapper } = renderControlled(["alpha", "beta"]);
    render(<Wrapper />);
    const removeButtons = screen.getAllByTestId("tag-remove");
    expect(removeButtons).toHaveLength(2);
    await user.click(removeButtons[0]);
    expect(handleChange).toHaveBeenCalledWith(["beta"]);
  });
});
