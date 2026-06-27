import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ContentBlockEditor } from "./content-block-editor";
import type { ContentBlock } from "@/lib/admin-content-blocks";
import type { BlockFieldError } from "@/lib/content-block-errors";

function getAddMenuButton(text: string): HTMLElement {
  const buttons = screen.queryAllByText(text);
  const menuButton = buttons.find((b) => b.tagName === "BUTTON" && b.closest(".absolute"));
  if (!menuButton) throw new Error(`Add menu button "${text}" not found`);
  return menuButton;
}

function ContentBlockEditorHarness({
  initialBlocks,
  errors,
}: {
  initialBlocks: ContentBlock[];
  errors: BlockFieldError[];
}) {
  const [blocks, setBlocks] = useState(initialBlocks);
  return <ContentBlockEditor blocks={blocks} errors={errors} onChange={setBlocks} />;
}

describe("ContentBlockEditor", () => {
  const mockOnChange = vi.fn();

  const sampleBlocks: ContentBlock[] = [
    {
      id: "block-1",
      type: "text",
      version: 2,
      order: 0,
      visible: true,
      config: { markdown: "# Hello", html: "" },
    },
    {
      id: "block-2",
      type: "stat_card",
      version: 2,
      order: 1,
      visible: true,
      config: { title: "", stats: [{ label: "Users", value: "100", description: "" }] },
    },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state message", () => {
    render(<ContentBlockEditor blocks={[]} onChange={mockOnChange} />);
    expect(screen.getByText("暂无内容块，点击添加")).toBeInTheDocument();
  });

  it("renders add button", () => {
    render(<ContentBlockEditor blocks={[]} onChange={mockOnChange} />);
    expect(screen.getByText("+ 添加内容块")).toBeInTheDocument();
  });

  it("shows add menu when button clicked", () => {
    render(<ContentBlockEditor blocks={[]} onChange={mockOnChange} />);
    const addButton = screen.getByText("+ 添加内容块");
    fireEvent.click(addButton);
    expect(getAddMenuButton("文本块")).toBeInTheDocument();
    expect(getAddMenuButton("统计卡片")).toBeInTheDocument();
    expect(getAddMenuButton("图片")).toBeInTheDocument();
    expect(getAddMenuButton("代码片段")).toBeInTheDocument();
    expect(getAddMenuButton("提示框")).toBeInTheDocument();
  });

  it("adds text block when text option clicked", () => {
    render(<ContentBlockEditor blocks={[]} onChange={mockOnChange} />);
    const addButton = screen.getByText("+ 添加内容块");
    fireEvent.click(addButton);
    const textOption = getAddMenuButton("文本块");
    fireEvent.click(textOption);
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: "text",
        version: 2,
        order: 0,
        visible: true,
        config: { markdown: "", html: "" },
      }),
    ]);
  });

  it("adds stat_card block when stat_card option clicked", () => {
    render(<ContentBlockEditor blocks={[]} onChange={mockOnChange} />);
    const addButton = screen.getByText("+ 添加内容块");
    fireEvent.click(addButton);
    const statOption = getAddMenuButton("统计卡片");
    fireEvent.click(statOption);
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: "stat_card",
        version: 2,
        order: 0,
        visible: true,
        config: { title: "", stats: [] },
      }),
    ]);
  });

  it("adds image block when image option clicked", () => {
    render(<ContentBlockEditor blocks={[]} onChange={mockOnChange} />);
    const addButton = screen.getByText("+ 添加内容块");
    fireEvent.click(addButton);
    const imageOption = getAddMenuButton("图片");
    fireEvent.click(imageOption);
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: "image",
        version: 2,
        order: 0,
        visible: true,
        config: { src: "", alt: "", caption: "" },
      }),
    ]);
  });

  it("adds code_snippet block when code_snippet option clicked", () => {
    render(<ContentBlockEditor blocks={[]} onChange={mockOnChange} />);
    const addButton = screen.getByText("+ 添加内容块");
    fireEvent.click(addButton);
    const codeOption = getAddMenuButton("代码片段");
    fireEvent.click(codeOption);
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: "code_snippet",
        version: 2,
        order: 0,
        visible: true,
        config: { language: "plaintext", code: "", showLineNumbers: true },
      }),
    ]);
  });

  it("adds callout block when callout option clicked", () => {
    render(<ContentBlockEditor blocks={[]} onChange={mockOnChange} />);
    const addButton = screen.getByText("+ 添加内容块");
    fireEvent.click(addButton);
    const calloutOption = getAddMenuButton("提示框");
    fireEvent.click(calloutOption);
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: "callout",
        version: 2,
        order: 0,
        visible: true,
        config: { tone: "info", title: "", content: "" },
      }),
    ]);
  });

  it("renders existing blocks", () => {
    render(
      <ContentBlockEditor blocks={sampleBlocks} onChange={mockOnChange} />
    );
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Stat Card")).toBeInTheDocument();
  });

  it("renders existing image block", () => {
    const imageBlocks: ContentBlock[] = [
      {
        id: "img-1",
        type: "image",
        version: 2,
        order: 0,
        visible: true,
        config: { src: "", alt: "", caption: "" },
      },
    ];
    render(
      <ContentBlockEditor blocks={imageBlocks} onChange={mockOnChange} />
    );
    expect(screen.getByText("Image")).toBeInTheDocument();
  });

  it("renders existing code_snippet block", () => {
    const codeBlocks: ContentBlock[] = [
      {
        id: "code-1",
        type: "code_snippet",
        version: 2,
        order: 0,
        visible: true,
        config: { language: "javascript", code: "console.log('hi')", showLineNumbers: true },
      },
    ];
    render(
      <ContentBlockEditor blocks={codeBlocks} onChange={mockOnChange} />
    );
    expect(screen.getByText("Code Snippet")).toBeInTheDocument();
  });

  it("renders existing callout block", () => {
    const calloutBlocks: ContentBlock[] = [
      {
        id: "callout-1",
        type: "callout",
        version: 2,
        order: 0,
        visible: true,
        config: { tone: "info", title: "Note", content: "Some content" },
      },
    ];
    render(
      <ContentBlockEditor blocks={calloutBlocks} onChange={mockOnChange} />
    );
    expect(screen.getByText("Callout")).toBeInTheDocument();
  });

  it("toggles block visibility", () => {
    render(
      <ContentBlockEditor blocks={sampleBlocks} onChange={mockOnChange} />
    );
    const visibilityButton = screen.getAllByLabelText("Toggle visibility")[0];
    fireEvent.click(visibilityButton);
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "block-1", visible: false }),
      expect.objectContaining({ id: "block-2", visible: true }),
    ]);
  });

  it("deletes block", () => {
    render(
      <ContentBlockEditor blocks={sampleBlocks} onChange={mockOnChange} />
    );
    const deleteButton = screen.getAllByLabelText("Delete block")[0];
    fireEvent.click(deleteButton);
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "block-2", order: 0 }),
    ]);
  });

  it("moves block up", () => {
    render(
      <ContentBlockEditor blocks={sampleBlocks} onChange={mockOnChange} />
    );
    const moveUpButton = screen.getAllByLabelText("Move up")[1];
    fireEvent.click(moveUpButton);
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "block-2", order: 0 }),
      expect.objectContaining({ id: "block-1", order: 1 }),
    ]);
  });

  it("moves block down", () => {
    render(
      <ContentBlockEditor blocks={sampleBlocks} onChange={mockOnChange} />
    );
    const moveDownButton = screen.getAllByLabelText("Move down")[0];
    fireEvent.click(moveDownButton);
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "block-2", order: 0 }),
      expect.objectContaining({ id: "block-1", order: 1 }),
    ]);
  });

  it("disables move up button for first block", () => {
    render(
      <ContentBlockEditor blocks={sampleBlocks} onChange={mockOnChange} />
    );
    const moveUpButton = screen.getAllByLabelText("Move up")[0];
    expect(moveUpButton).toBeDisabled();
  });

  it("disables move down button for last block", () => {
    render(
      <ContentBlockEditor blocks={sampleBlocks} onChange={mockOnChange} />
    );
    const moveDownButton = screen.getAllByLabelText("Move down")[1];
    expect(moveDownButton).toBeDisabled();
  });

  it("renders summary and block error state from backend validation errors", () => {
    const errors: BlockFieldError[] = [
      {
        blockId: "block-1",
        blockType: "text",
        field: "config.html",
        message: "Content is required",
      },
    ];

    render(<ContentBlockEditor blocks={sampleBlocks} errors={errors} onChange={mockOnChange} />);

    expect(screen.getByTestId("content-block-errors-summary")).toHaveTextContent(
      "1 个内容块存在 1 个字段错误",
    );
    expect(screen.getByTestId("block-error-block-1")).toBeInTheDocument();
  });

  it("clears field errors for a block after editing that block", () => {
    const blocks: ContentBlock[] = [
      {
        id: "image-1",
        type: "image",
        version: 2,
        order: 0,
        visible: true,
        config: { src: "", alt: "", caption: "" },
      },
    ];
    const errors: BlockFieldError[] = [
      {
        blockId: "image-1",
        blockType: "image",
        field: "config.alt",
        message: "Alt text is required",
      },
    ];

    render(<ContentBlockEditorHarness initialBlocks={blocks} errors={errors} />);

    expect(screen.getByTestId("content-block-errors-summary")).toHaveTextContent(
      "1 个内容块存在 1 个字段错误",
    );

    fireEvent.click(screen.getByLabelText("Edit block"));
    expect(screen.getByText("Alt text is required")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("image-block-alt-input"), {
      target: { value: "Decorative chart" },
    });

    expect(screen.queryByText("Alt text is required")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-block-errors-summary")).not.toBeInTheDocument();
  });

  it("updates block audience when editor audience selector changes", () => {
    render(<ContentBlockEditor blocks={sampleBlocks} onChange={mockOnChange} />);

    fireEvent.click(screen.getAllByLabelText("Edit block")[0]);
    fireEvent.change(screen.getByLabelText("Audience"), {
      target: { value: "delivery" },
    });

    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "block-1", audience: "delivery" }),
      expect.objectContaining({ id: "block-2" }),
    ]);
  });
});
