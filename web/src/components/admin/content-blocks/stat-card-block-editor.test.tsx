import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { StatCardBlockEditor } from "./stat-card-block-editor";
import type { StatCardBlockConfig } from "@/lib/admin-content-blocks";

describe("StatCardBlockEditor", () => {
  const emptyConfig: StatCardBlockConfig = { items: [] };

  const sampleConfig: StatCardBlockConfig = {
    items: [
      { label: "用户数", value: "1000" },
      { label: "收入", value: "¥50万" },
    ],
  };

  afterEach(() => {
    cleanup();
  });

  describe("渲染", () => {
    it("应该渲染统计项列表", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sampleConfig} onChange={onChange} />);
      expect(screen.getByTestId("stat-card-item-0")).toBeInTheDocument();
      expect(screen.getByTestId("stat-card-item-1")).toBeInTheDocument();
    });

    it("应该在 label 输入框中显示标签", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sampleConfig} onChange={onChange} />);
      const labelInput = screen.getByTestId("stat-card-item-label-0");
      expect(labelInput).toHaveValue("用户数");
    });

    it("应该在 value 输入框中显示数值", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sampleConfig} onChange={onChange} />);
      const valueInput = screen.getByTestId("stat-card-item-value-0");
      expect(valueInput).toHaveValue("1000");
    });

    it("每个统计项应该有删除按钮", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sampleConfig} onChange={onChange} />);
      expect(screen.getByTestId("stat-card-item-delete-0")).toBeInTheDocument();
      expect(screen.getByTestId("stat-card-item-delete-1")).toBeInTheDocument();
    });

    it("应该有添加按钮", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sampleConfig} onChange={onChange} />);
      expect(screen.getByTestId("stat-card-add-item")).toBeInTheDocument();
    });
  });

  describe("空状态", () => {
    it("items 为空时应该显示空状态提示", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={emptyConfig} onChange={onChange} />);
      expect(screen.getByTestId("stat-card-empty-state")).toBeInTheDocument();
    });

    it("items 不为空时不应该显示空状态提示", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sampleConfig} onChange={onChange} />);
      expect(screen.queryByTestId("stat-card-empty-state")).not.toBeInTheDocument();
    });
  });

  describe("添加项目", () => {
    it("点击添加按钮应该调用 onChange 并追加新项", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sampleConfig} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("stat-card-add-item"));
      expect(onChange).toHaveBeenCalledWith({
        items: [
          { label: "用户数", value: "1000" },
          { label: "收入", value: "¥50万" },
          { label: "", value: "" },
        ],
      });
    });

    it("空列表点击添加应该追加一项", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={emptyConfig} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("stat-card-add-item"));
      expect(onChange).toHaveBeenCalledWith({
        items: [{ label: "", value: "" }],
      });
    });
  });

  describe("删除项目", () => {
    it("点击删除按钮应该调用 onChange 并移除对应项", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sampleConfig} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("stat-card-item-delete-0"));
      expect(onChange).toHaveBeenCalledWith({
        items: [{ label: "收入", value: "¥50万" }],
      });
    });

    it("删除最后一项后列表变为空", () => {
      const singleConfig: StatCardBlockConfig = {
        items: [{ label: "唯一", value: "100" }],
      };
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={singleConfig} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("stat-card-item-delete-0"));
      expect(onChange).toHaveBeenCalledWith({ items: [] });
    });
  });

  describe("编辑项目", () => {
    it("修改 label 输入框应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sampleConfig} onChange={onChange} />);
      const labelInput = screen.getByTestId("stat-card-item-label-0");
      fireEvent.change(labelInput, { target: { value: "新标签" } });
      expect(onChange).toHaveBeenCalledWith({
        items: [
          { label: "新标签", value: "1000" },
          { label: "收入", value: "¥50万" },
        ],
      });
    });

    it("修改 value 输入框应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sampleConfig} onChange={onChange} />);
      const valueInput = screen.getByTestId("stat-card-item-value-1");
      fireEvent.change(valueInput, { target: { value: "¥100万" } });
      expect(onChange).toHaveBeenCalledWith({
        items: [
          { label: "用户数", value: "1000" },
          { label: "收入", value: "¥100万" },
        ],
      });
    });
  });

  describe("超过 6 项警告", () => {
    it("items 不超过 6 时不应该显示警告", () => {
      const sixConfig: StatCardBlockConfig = {
        items: Array.from({ length: 6 }, (_, i) => ({
          label: `项${i}`,
          value: `${i}`,
        })),
      };
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sixConfig} onChange={onChange} />);
      expect(screen.queryByTestId("stat-card-warning")).not.toBeInTheDocument();
    });

    it("items 超过 6 时应该显示警告", () => {
      const sevenConfig: StatCardBlockConfig = {
        items: Array.from({ length: 7 }, (_, i) => ({
          label: `项${i}`,
          value: `${i}`,
        })),
      };
      const onChange = vi.fn();
      render(<StatCardBlockEditor config={sevenConfig} onChange={onChange} />);
      const warning = screen.getByTestId("stat-card-warning");
      expect(warning).toBeInTheDocument();
      expect(warning.textContent).toContain("7");
    });
  });
});
