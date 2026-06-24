import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TextBlockEditor, parseMarkdown } from "./text-block-editor";
import type { TextBlockConfig } from "@/lib/admin-content-blocks";

describe("TextBlockEditor", () => {
  const defaultConfig: TextBlockConfig = {
    markdown: "",
  };

  afterEach(() => {
    cleanup();
  });

  describe("渲染", () => {
    it("应该渲染 textarea", () => {
      const onChange = vi.fn();
      render(<TextBlockEditor config={defaultConfig} onChange={onChange} />);
      const textarea = screen.getByTestId("text-block-editor-textarea");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
    });

    it("应该渲染预览区域", () => {
      const onChange = vi.fn();
      render(<TextBlockEditor config={defaultConfig} onChange={onChange} />);
      const preview = screen.getByTestId("text-block-editor-preview");
      expect(preview).toBeInTheDocument();
    });

    it("应该显示空状态提示", () => {
      const onChange = vi.fn();
      render(<TextBlockEditor config={defaultConfig} onChange={onChange} />);
      expect(screen.getByText("暂无内容")).toBeInTheDocument();
    });

    it("应该显示 textarea 中的 markdown 内容", () => {
      const config: TextBlockConfig = {
        markdown: "# Hello World",
      };
      const onChange = vi.fn();
      render(<TextBlockEditor config={config} onChange={onChange} />);
      const textarea = screen.getByTestId("text-block-editor-textarea");
      expect(textarea).toHaveValue("# Hello World");
    });
  });

  describe("onChange 回调", () => {
    it("输入内容时应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<TextBlockEditor config={defaultConfig} onChange={onChange} />);
      const textarea = screen.getByTestId("text-block-editor-textarea");
      fireEvent.change(textarea, { target: { value: "test content" } });
      expect(onChange).toHaveBeenCalledWith({
        markdown: "test content",
      });
    });

    it("多次输入应该多次调用 onChange", () => {
      const onChange = vi.fn();
      render(<TextBlockEditor config={defaultConfig} onChange={onChange} />);
      const textarea = screen.getByTestId("text-block-editor-textarea");
      fireEvent.change(textarea, { target: { value: "first" } });
      fireEvent.change(textarea, { target: { value: "second" } });
      expect(onChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("Markdown 预览", () => {
    it("应该渲染一级标题", () => {
      const config: TextBlockConfig = {
        markdown: "# 主标题",
      };
      const onChange = vi.fn();
      render(<TextBlockEditor config={config} onChange={onChange} />);
      const preview = screen.getByTestId("text-block-editor-preview");
      expect(preview.innerHTML).toContain("<h1>");
      expect(preview.textContent).toContain("主标题");
    });

    it("应该渲染二级标题", () => {
      const config: TextBlockConfig = {
        markdown: "## 二级标题",
      };
      const onChange = vi.fn();
      render(<TextBlockEditor config={config} onChange={onChange} />);
      const preview = screen.getByTestId("text-block-editor-preview");
      expect(preview.innerHTML).toContain("<h2>");
    });

    it("应该渲染三级标题", () => {
      const config: TextBlockConfig = {
        markdown: "### 三级标题",
      };
      const onChange = vi.fn();
      render(<TextBlockEditor config={config} onChange={onChange} />);
      const preview = screen.getByTestId("text-block-editor-preview");
      expect(preview.innerHTML).toContain("<h3>");
    });

    it("应该渲染粗体文本", () => {
      const config: TextBlockConfig = {
        markdown: "这是**粗体**文本",
      };
      const onChange = vi.fn();
      render(<TextBlockEditor config={config} onChange={onChange} />);
      const preview = screen.getByTestId("text-block-editor-preview");
      expect(preview.innerHTML).toContain("<strong>粗体</strong>");
    });

    it("应该渲染斜体文本", () => {
      const config: TextBlockConfig = {
        markdown: "这是*斜体*文本",
      };
      const onChange = vi.fn();
      render(<TextBlockEditor config={config} onChange={onChange} />);
      const preview = screen.getByTestId("text-block-editor-preview");
      expect(preview.innerHTML).toContain("<em>斜体</em>");
    });

    it("应该渲染链接", () => {
      const config: TextBlockConfig = {
        markdown: "[链接文本](https://example.com)",
      };
      const onChange = vi.fn();
      render(<TextBlockEditor config={config} onChange={onChange} />);
      const preview = screen.getByTestId("text-block-editor-preview");
      const link = preview.querySelector("a");
      expect(link).not.toBeNull();
      expect(link?.getAttribute("href")).toBe("https://example.com");
      expect(link?.textContent).toBe("链接文本");
    });

    it("应该渲染无序列表", () => {
      const config: TextBlockConfig = {
        markdown: "- 项目一\n- 项目二\n- 项目三",
      };
      const onChange = vi.fn();
      render(<TextBlockEditor config={config} onChange={onChange} />);
      const preview = screen.getByTestId("text-block-editor-preview");
      expect(preview.innerHTML).toContain("<ul>");
      expect(preview.innerHTML).toContain("<li>");
      expect(preview.textContent).toContain("项目一");
      expect(preview.textContent).toContain("项目二");
    });
  });
});

describe("parseMarkdown", () => {
  it("空字符串应该返回空字符串", () => {
    expect(parseMarkdown("")).toBe("");
  });

  it("应该解析一级标题", () => {
    const result = parseMarkdown("# 标题");
    expect(result).toContain("<h1>");
    expect(result).toContain("标题");
  });

  it("应该解析二级标题", () => {
    const result = parseMarkdown("## 标题");
    expect(result).toContain("<h2>");
  });

  it("应该解析三级标题", () => {
    const result = parseMarkdown("### 标题");
    expect(result).toContain("<h3>");
  });

  it("应该解析粗体", () => {
    const result = parseMarkdown("**粗体**");
    expect(result).toContain("<strong>粗体</strong>");
  });

  it("应该解析斜体", () => {
    const result = parseMarkdown("*斜体*");
    expect(result).toContain("<em>斜体</em>");
  });

  it("应该解析链接", () => {
    const result = parseMarkdown("[文本](https://test.com)");
    expect(result).toContain('href="https://test.com"');
    expect(result).toContain(">文本</a>");
  });

  it("应该解析无序列表", () => {
    const result = parseMarkdown("- 项一\n- 项二");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>项一</li>");
    expect(result).toContain("<li>项二</li>");
  });

  it("应该转义 HTML 特殊字符", () => {
    const result = parseMarkdown("<script>alert('xss')</script>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("应该处理普通段落", () => {
    const result = parseMarkdown("普通文本");
    expect(result).toContain("<p>");
    expect(result).toContain("普通文本");
  });
});
