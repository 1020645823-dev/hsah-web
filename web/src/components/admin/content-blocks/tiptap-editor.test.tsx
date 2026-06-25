import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TiptapEditor } from "./tiptap-editor";

vi.mock("@tiptap/react", async () => {
  const actual = await vi.importActual<typeof import("@tiptap/react")>("@tiptap/react");
  return {
    ...actual,
    useEditor: vi.fn(),
    EditorContent: vi.fn(({ editor }) => (
      <div data-testid="editor-content">{editor?.getHTML()}</div>
    )),
  };
});

import { useEditor } from "@tiptap/react";

function createMockEditor(html: string) {
  return {
    getHTML: () => html,
    getAttributes: () => ({ href: undefined }),
    isActive: () => false,
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: vi.fn() }),
        toggleItalic: () => ({ run: vi.fn() }),
        toggleHeading: () => ({ run: vi.fn() }),
        toggleBulletList: () => ({ run: vi.fn() }),
        toggleOrderedList: () => ({ run: vi.fn() }),
        extendMarkRange: () => ({
          unsetLink: () => ({ run: vi.fn() }),
          setLink: () => ({ run: vi.fn() }),
        }),
      }),
    }),
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
  };
}

describe("TiptapEditor", () => {
  it("renders toolbar buttons", () => {
    const mockEditor = createMockEditor("<p>test</p>") as unknown as ReturnType<typeof useEditor>;
    (useEditor as ReturnType<typeof vi.fn>).mockReturnValue(mockEditor);

    const onChange = vi.fn();
    render(<TiptapEditor content="<p>test</p>" onChange={onChange} />);

    expect(screen.getByTestId("tiptap-bold")).toBeInTheDocument();
    expect(screen.getByTestId("tiptap-italic")).toBeInTheDocument();
    expect(screen.getByTestId("tiptap-h1")).toBeInTheDocument();
    expect(screen.getByTestId("tiptap-h2")).toBeInTheDocument();
    expect(screen.getByTestId("tiptap-bullet-list")).toBeInTheDocument();
    expect(screen.getByTestId("tiptap-ordered-list")).toBeInTheDocument();
    expect(screen.getByTestId("tiptap-link")).toBeInTheDocument();
  });

  it("shows loading state when editor is not ready", () => {
    (useEditor as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const onChange = vi.fn();
    render(<TiptapEditor content="" onChange={onChange} />);

    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  it("calls onChange when editor updates", () => {
    const onChange = vi.fn();
    const mockEditor = createMockEditor("<p>hello</p>") as unknown as ReturnType<typeof useEditor>;

    let updateHandler: (({ editor }: { editor: typeof mockEditor }) => void) | undefined;
    (useEditor as ReturnType<typeof vi.fn>).mockImplementation((options) => {
      updateHandler = options.onUpdate;
      return mockEditor;
    });

    render(<TiptapEditor content="" onChange={onChange} />);

    expect(updateHandler).toBeDefined();
    updateHandler?.({ editor: mockEditor });
    expect(onChange).toHaveBeenCalledWith("<p>hello</p>");
  });
});
