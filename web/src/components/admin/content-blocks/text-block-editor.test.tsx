import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TextBlockEditor, parseMarkdown } from "./text-block-editor";
import type { TextBlockConfig } from "@/lib/admin-content-blocks";

vi.mock("./tiptap-editor", () => ({
  TiptapEditor: vi.fn(({ content, onChange }) => (
    <div data-testid="tiptap-editor-mock">
      <div data-testid="tiptap-content">{content}</div>
      <button
        data-testid="tiptap-simulate-change"
        onClick={() => onChange("<p>new content</p>")}
      >
        Simulate Change
      </button>
    </div>
  )),
}));

describe("TextBlockEditor", () => {
  const defaultConfig: TextBlockConfig = {
    markdown: "",
    html: "",
  };

  afterEach(() => {
    cleanup();
  });

  describe("渲染", () => {
    it("应该渲染 TiptapEditor", () => {
      const onChange = vi.fn();
      render(<TextBlockEditor config={defaultConfig} onChange={onChange} />);
      const editor = screen.getByTestId("tiptap-editor-mock");
      expect(editor).toBeInTheDocument();
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

    it("应该显示 html 预览内容", () => {
      const config: TextBlockConfig = {
        markdown: "",
        html: "<p>Hello World</p>",
      };
      const onChange = vi.fn();
      render(<TextBlockEditor config={config} onChange={onChange} />);
      const preview = screen.getByTestId("text-block-editor-preview");
      expect(preview.innerHTML).toContain("<p>Hello World</p>");
    });

    it("应该回退到 markdown 预览当 html 为空", () => {
      const config: TextBlockConfig = {
        markdown: "# Hello World",
        html: "",
      };
      const onChange = vi.fn();
      render(<TextBlockEditor config={config} onChange={onChange} />);
      const preview = screen.getByTestId("text-block-editor-preview");
      expect(preview.innerHTML).toContain("<h1>");
      expect(preview.textContent).toContain("Hello World");
    });
  });

  describe("onChange 回调", () => {
    it("编辑器内容变化时应该调用 onChange 并设置 html", () => {
      const onChange = vi.fn();
      render(<TextBlockEditor config={defaultConfig} onChange={onChange} />);
      const btn = screen.getByTestId("tiptap-simulate-change");
      btn.click();
      expect(onChange).toHaveBeenCalledWith({
        markdown: "",
        html: "<p>new content</p>",
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
});
