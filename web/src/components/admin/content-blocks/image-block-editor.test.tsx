import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ImageBlockEditor } from "./image-block-editor";
import type { ImageBlockConfig } from "@/lib/admin-content-blocks";

describe("ImageBlockEditor", () => {
  const emptyConfig: ImageBlockConfig = {
    url: "",
    alt: "",
    caption: "",
    width: 100,
  };

  const configWithUrl: ImageBlockConfig = {
    url: "https://example.com/image.jpg",
    alt: "测试图片",
    caption: "图片说明",
    width: 80,
  };

  afterEach(() => {
    cleanup();
  });

  describe("渲染", () => {
    it("应该渲染 url 输入框", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      expect(screen.getByTestId("image-block-url-input")).toBeInTheDocument();
    });

    it("应该渲染上传按钮", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      expect(screen.getByTestId("image-block-upload-button")).toBeInTheDocument();
      expect(screen.getByText("上传图片")).toBeInTheDocument();
    });

    it("应该渲染 alt 输入框", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      expect(screen.getByTestId("image-block-alt-input")).toBeInTheDocument();
    });

    it("应该渲染 caption 输入框", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      expect(screen.getByTestId("image-block-caption-input")).toBeInTheDocument();
    });

    it("应该渲染宽度滑块", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      expect(screen.getByTestId("image-block-width-slider")).toBeInTheDocument();
    });

    it("应该渲染隐藏的文件输入", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      const fileInput = screen.getByTestId("image-block-file-input");
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("type", "file");
      expect(fileInput).toHaveAttribute("accept", "image/jpeg,image/png,image/gif,image/webp");
    });
  });

  describe("空状态", () => {
    it("url 为空时应该显示空状态", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      expect(screen.getByTestId("image-block-empty-state")).toBeInTheDocument();
      expect(screen.getByText("暂无图片")).toBeInTheDocument();
    });

    it("url 不为空时不应该显示空状态", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={configWithUrl} onChange={onChange} token="test-token" />);
      expect(screen.queryByTestId("image-block-empty-state")).not.toBeInTheDocument();
    });
  });

  describe("预览", () => {
    it("url 不为空时应该显示预览", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={configWithUrl} onChange={onChange} token="test-token" />);
      expect(screen.getByTestId("image-block-preview")).toBeInTheDocument();
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", configWithUrl.url);
      expect(img).toHaveAttribute("alt", configWithUrl.alt);
    });

    it("url 为空时不应该显示预览", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      expect(screen.queryByTestId("image-block-preview")).not.toBeInTheDocument();
    });

    it("有 caption 时应该显示图片说明", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={configWithUrl} onChange={onChange} token="test-token" />);
      expect(screen.getByText(configWithUrl.caption!)).toBeInTheDocument();
    });

    it("没有 caption 时不应该显示图片说明", () => {
      const onChange = vi.fn();
      const config = { ...configWithUrl, caption: "" };
      render(<ImageBlockEditor config={config} onChange={onChange} token="test-token" />);
      expect(screen.queryByText("图片说明")).not.toBeInTheDocument();
    });
  });

  describe("onChange 回调", () => {
    it("url 改变时应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      const urlInput = screen.getByTestId("image-block-url-input");
      fireEvent.change(urlInput, { target: { value: "https://new-url.com/img.png" } });
      expect(onChange).toHaveBeenCalledWith({
        ...emptyConfig,
        url: "https://new-url.com/img.png",
      });
    });

    it("alt 改变时应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      const altInput = screen.getByTestId("image-block-alt-input");
      fireEvent.change(altInput, { target: { value: "新图片" } });
      expect(onChange).toHaveBeenCalledWith({
        ...emptyConfig,
        alt: "新图片",
      });
    });

    it("caption 改变时应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      const captionInput = screen.getByTestId("image-block-caption-input");
      fireEvent.change(captionInput, { target: { value: "新说明" } });
      expect(onChange).toHaveBeenCalledWith({
        ...emptyConfig,
        caption: "新说明",
      });
    });

    it("width 改变时应该调用 onChange", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      const widthSlider = screen.getByTestId("image-block-width-slider");
      fireEvent.change(widthSlider, { target: { value: "50" } });
      expect(onChange).toHaveBeenCalledWith({
        ...emptyConfig,
        width: 50,
      });
    });
  });

  describe("文件上传", () => {
    it("点击上传按钮应该触发文件选择", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      const fileInput = screen.getByTestId("image-block-file-input") as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, "click");
      const uploadButton = screen.getByTestId("image-block-upload-button");
      fireEvent.click(uploadButton);
      expect(clickSpy).toHaveBeenCalled();
    });

    it("应该显示宽度标签", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={emptyConfig} onChange={onChange} token="test-token" />);
      expect(screen.getByText("宽度: 100%")).toBeInTheDocument();
    });

    it("config 有 width 值时应该显示对应宽度", () => {
      const onChange = vi.fn();
      render(<ImageBlockEditor config={configWithUrl} onChange={onChange} token="test-token" />);
      expect(screen.getByText("宽度: 80%")).toBeInTheDocument();
    });
  });
});
