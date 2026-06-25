import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CalloutBlockEditor } from "./callout-block-editor";
import type { CalloutBlockConfig } from "@/lib/admin-content-blocks";

describe("CalloutBlockEditor", () => {
  const defaultConfig: CalloutBlockConfig = {
    tone: "info",
    title: "",
    content: "",
  };

  const sampleConfig: CalloutBlockConfig = {
    tone: "warning",
    title: "注意",
    content: "这是一条警告信息",
  };

  afterEach(() => {
    cleanup();
  });

  describe("渲染", () => {
    it("应该渲染四个变体按钮", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={defaultConfig} onChange={onChange} />);
      expect(screen.getByTestId("callout-variant-info")).toBeInTheDocument();
      expect(screen.getByTestId("callout-variant-warning")).toBeInTheDocument();
      expect(screen.getByTestId("callout-variant-error")).toBeInTheDocument();
      expect(screen.getByTestId("callout-variant-tip")).toBeInTheDocument();
    });

    it("应该渲染标题输入框", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={defaultConfig} onChange={onChange} />);
      expect(screen.getByTestId("callout-title-input")).toBeInTheDocument();
    });

    it("应该渲染内容文本框", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={defaultConfig} onChange={onChange} />);
      expect(screen.getByTestId("callout-content-textarea")).toBeInTheDocument();
    });

    it("应该渲染预览区域", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={defaultConfig} onChange={onChange} />);
      expect(screen.getByTestId("callout-preview")).toBeInTheDocument();
    });
  });

  describe("变体选择", () => {
    it("当前选中的变体应该高亮显示", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      const warningButton = screen.getByTestId("callout-variant-warning");
      expect(warningButton.className).toContain("border-[var(--color-electric-purple)]");
    });

    it("未选中的变体不应该高亮显示", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      const infoButton = screen.getByTestId("callout-variant-info");
      expect(infoButton.className).not.toContain("border-[var(--color-electric-purple)]");
    });

    it("点击变体按钮应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={defaultConfig} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("callout-variant-tip"));
      expect(onChange).toHaveBeenCalledWith({
        tone: "success",
        title: "",
        content: "",
      });
    });

    it("切换变体应该保留标题和内容", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("callout-variant-error"));
      expect(onChange).toHaveBeenCalledWith({
        tone: "error",
        title: "注意",
        content: "这是一条警告信息",
      });
    });
  });

  describe("标题输入", () => {
    it("应该显示当前标题", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      expect(screen.getByTestId("callout-title-input")).toHaveValue("注意");
    });

    it("修改标题应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      fireEvent.change(screen.getByTestId("callout-title-input"), {
        target: { value: "新标题" },
      });
      expect(onChange).toHaveBeenCalledWith({
        tone: "warning",
        title: "新标题",
        content: "这是一条警告信息",
      });
    });

    it("标题为空时应该显示空字符串", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={defaultConfig} onChange={onChange} />);
      expect(screen.getByTestId("callout-title-input")).toHaveValue("");
    });
  });

  describe("内容输入", () => {
    it("应该显示当前内容", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      expect(screen.getByTestId("callout-content-textarea")).toHaveValue("这是一条警告信息");
    });

    it("修改内容应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      fireEvent.change(screen.getByTestId("callout-content-textarea"), {
        target: { value: "新的内容" },
      });
      expect(onChange).toHaveBeenCalledWith({
        tone: "warning",
        title: "注意",
        content: "新的内容",
      });
    });
  });

  describe("预览", () => {
    it("预览应该显示当前变体的图标", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      const preview = screen.getByTestId("callout-preview");
      expect(preview).toBeInTheDocument();
    });

    it("预览应该显示标题", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      expect(screen.getByText("注意")).toBeInTheDocument();
    });

    it("预览应该显示内容", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      const preview = screen.getByTestId("callout-preview");
      expect(preview).toHaveTextContent("这是一条警告信息");
    });

    it("内容为空时应该显示占位文本", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={defaultConfig} onChange={onChange} />);
      expect(screen.getByText("暂无内容")).toBeInTheDocument();
    });

    it("预览应该应用正确的变体样式", () => {
      const onChange = vi.fn();
      render(<CalloutBlockEditor config={sampleConfig} onChange={onChange} />);
      const preview = screen.getByTestId("callout-preview");
      expect(preview.className).toContain("border-amber-500");
      expect(preview.className).toContain("bg-amber-500/10");
    });

    it("切换变体后预览样式应该更新", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <CalloutBlockEditor config={sampleConfig} onChange={onChange} />
      );
      
      const newConfig: CalloutBlockConfig = {
        tone: "error",
        title: "错误",
        content: "出错了",
      };
      
      rerender(<CalloutBlockEditor config={newConfig} onChange={onChange} />);
      
      const preview = screen.getByTestId("callout-preview");
      expect(preview.className).toContain("border-red-500");
      expect(preview.className).toContain("bg-red-500/10");
    });
  });
});
