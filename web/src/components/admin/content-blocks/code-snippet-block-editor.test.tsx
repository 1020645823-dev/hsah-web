import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CodeSnippetBlockEditor } from "./code-snippet-block-editor";
import type { CodeSnippetBlockConfig } from "@/lib/admin-content-blocks";

describe("CodeSnippetBlockEditor", () => {
  const defaultConfig: CodeSnippetBlockConfig = {
    language: "plaintext",
    code: "",
    showLineNumbers: true,
  };

  const sampleConfig: CodeSnippetBlockConfig = {
    language: "typescript",
    code: "const x = 1;\nconst y = 2;\nconsole.log(x + y);",
    showLineNumbers: true,
  };

  afterEach(() => {
    cleanup();
  });

  describe("渲染", () => {
    it("应该渲染语言选择器", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      const select = screen.getByTestId("code-snippet-language-select");
      expect(select).toBeInTheDocument();
      expect(select.tagName).toBe("SELECT");
    });

    it("语言选择器应该包含所有支持的语言", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      const select = screen.getByTestId("code-snippet-language-select");
      const options = Array.from(select.querySelectorAll("option")).map(
        (o) => o.textContent,
      );
      expect(options).toEqual([
        "plaintext",
        "javascript",
        "typescript",
        "python",
        "java",
        "go",
        "rust",
        "html",
        "css",
        "sql",
        "bash",
        "json",
        "yaml",
      ]);
    });

    it("语言选择器应该显示当前语言", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={sampleConfig} onChange={onChange} />);
      const select = screen.getByTestId("code-snippet-language-select");
      expect(select).toHaveValue("typescript");
    });

    it("应该渲染代码 textarea", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      const textarea = screen.getByTestId("code-snippet-textarea");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
    });

    it("textarea 应该显示当前代码内容", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={sampleConfig} onChange={onChange} />);
      const textarea = screen.getByTestId("code-snippet-textarea");
      expect(textarea).toHaveValue(sampleConfig.code);
    });

    it("textarea 应该禁用拼写检查", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      const textarea = screen.getByTestId("code-snippet-textarea");
      expect(textarea).toHaveAttribute("spellcheck", "false");
    });

    it("应该渲染行号复选框", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      const checkbox = screen.getByTestId("code-snippet-line-numbers-checkbox");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it("应该渲染预览区域", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={sampleConfig} onChange={onChange} />);
      expect(screen.getByTestId("code-snippet-preview")).toBeInTheDocument();
    });

    it("应该渲染文件名输入框", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      expect(screen.getByTestId("code-snippet-filename-input")).toBeInTheDocument();
    });

    it("预览区域应该显示语言标签", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={sampleConfig} onChange={onChange} />);
      const langLabel = screen.getByTestId("code-snippet-preview-language");
      expect(langLabel).toHaveTextContent("typescript");
    });

    it("预览区域应该显示行数", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={sampleConfig} onChange={onChange} />);
      const lineCount = screen.getByTestId("code-snippet-preview-line-count");
      expect(lineCount).toHaveTextContent("3 行");
    });
  });

  describe("行号显示", () => {
    it("showLineNumbers 为 true 时应该显示行号", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={sampleConfig} onChange={onChange} />);
      const lineNumbers = screen.getByTestId("code-snippet-line-numbers");
      expect(lineNumbers).toBeInTheDocument();
      expect(lineNumbers.textContent).toContain("1");
      expect(lineNumbers.textContent).toContain("2");
      expect(lineNumbers.textContent).toContain("3");
    });

    it("showLineNumbers 为 false 时不应该显示行号", () => {
      const config: CodeSnippetBlockConfig = {
        ...sampleConfig,
        showLineNumbers: false,
      };
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={config} onChange={onChange} />);
      expect(screen.queryByTestId("code-snippet-line-numbers")).not.toBeInTheDocument();
    });
  });

  describe("onChange 回调", () => {
    it("修改代码时应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      const textarea = screen.getByTestId("code-snippet-textarea");
      fireEvent.change(textarea, { target: { value: "new code" } });
      expect(onChange).toHaveBeenCalledWith({
        language: "plaintext",
        code: "new code",
        showLineNumbers: true,
      });
    });

    it("修改语言时应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      const select = screen.getByTestId("code-snippet-language-select");
      fireEvent.change(select, { target: { value: "python" } });
      expect(onChange).toHaveBeenCalledWith({
        language: "python",
        code: "",
        showLineNumbers: true,
      });
    });

    it("切换行号复选框时应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={sampleConfig} onChange={onChange} />);
      const checkbox = screen.getByTestId("code-snippet-line-numbers-checkbox");
      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith({
        language: "typescript",
        code: sampleConfig.code,
        showLineNumbers: false,
      });
    });

    it("多次修改应该多次调用 onChange", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      const textarea = screen.getByTestId("code-snippet-textarea");
      fireEvent.change(textarea, { target: { value: "first" } });
      fireEvent.change(textarea, { target: { value: "second" } });
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("修改文件名时应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      const input = screen.getByTestId("code-snippet-filename-input");
      fireEvent.change(input, { target: { value: "demo.py" } });
      expect(onChange).toHaveBeenCalledWith({
        language: "plaintext",
        code: "",
        showLineNumbers: true,
        filename: "demo.py",
      });
    });
  });

  describe("预览内容", () => {
    it("空代码时应该显示暂无代码", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      expect(screen.getByText("暂无代码")).toBeInTheDocument();
    });

    it("有代码时应该显示代码内容", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={sampleConfig} onChange={onChange} />);
      const preview = screen.getByTestId("code-snippet-preview");
      expect(preview.textContent).toContain("const x = 1");
      expect(preview.textContent).toContain("console.log(x + y)");
    });

    it("空代码时应该显示 1 行", () => {
      const onChange = vi.fn();
      render(<CodeSnippetBlockEditor config={defaultConfig} onChange={onChange} />);
      const lineCount = screen.getByTestId("code-snippet-preview-line-count");
      expect(lineCount).toHaveTextContent("1 行");
    });
  });
});
