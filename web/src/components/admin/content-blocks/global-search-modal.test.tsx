import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { GlobalSearchModal } from "./global-search-modal";
import * as adminAssetEditor from "@/lib/admin-asset-editor";
import type { BlockSearchResult } from "@/lib/admin-asset-editor";

vi.mock("@/lib/admin-asset-editor", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-asset-editor")>("@/lib/admin-asset-editor");
  return {
    ...actual,
    searchBlocks: vi.fn(),
  };
});

describe("GlobalSearchModal", () => {
  const mockOnClose = vi.fn();
  const mockOnInsert = vi.fn();
  const mockToken = "test-token";

  const mockResults: BlockSearchResult[] = [
    {
      asset_id: 1,
      asset_name: "Test Asset",
      asset_slug: "test-asset",
      block: {
        id: "block-1",
        type: "text",
        order: 0,
        visible: true,
        config: { markdown: "Hello world", html: "<p>Hello world</p>" },
      },
      matched_field: "markdown",
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockOnClose.mockClear();
    mockOnInsert.mockClear();
    vi.mocked(adminAssetEditor.searchBlocks).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("renders search input when open", () => {
    render(
      <GlobalSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onInsert={mockOnInsert}
        token={mockToken}
      />
    );
    expect(screen.getByPlaceholderText("输入关键词搜索...")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <GlobalSearchModal
        isOpen={false}
        onClose={mockOnClose}
        onInsert={mockOnInsert}
        token={mockToken}
      />
    );
    expect(screen.queryByPlaceholderText("输入关键词搜索...")).not.toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    render(
      <GlobalSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onInsert={mockOnInsert}
        token={mockToken}
      />
    );
    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows results after search", async () => {
    vi.mocked(adminAssetEditor.searchBlocks).mockResolvedValue(mockResults);

    render(
      <GlobalSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onInsert={mockOnInsert}
        token={mockToken}
      />
    );

    const input = screen.getByPlaceholderText("输入关键词搜索...");
    await act(async () => {
      fireEvent.change(input, { target: { value: "hello" } });
      vi.advanceTimersByTime(400);
    });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Test Asset")).toBeInTheDocument();
    });
    expect(screen.getByText("text")).toBeInTheDocument();
    expect(screen.getByText("匹配: markdown")).toBeInTheDocument();
  });

  it("calls onInsert when insert button clicked", async () => {
    vi.mocked(adminAssetEditor.searchBlocks).mockResolvedValue(mockResults);

    render(
      <GlobalSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onInsert={mockOnInsert}
        token={mockToken}
      />
    );

    const input = screen.getByPlaceholderText("输入关键词搜索...");
    await act(async () => {
      fireEvent.change(input, { target: { value: "hello" } });
      vi.advanceTimersByTime(400);
    });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("插入到当前")).toBeInTheDocument();
    });

    const insertButton = screen.getByText("插入到当前");
    fireEvent.click(insertButton);

    expect(mockOnInsert).toHaveBeenCalledWith(mockResults[0].block);
  });

  it("shows empty state when no results", async () => {
    vi.mocked(adminAssetEditor.searchBlocks).mockResolvedValue([]);

    render(
      <GlobalSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onInsert={mockOnInsert}
        token={mockToken}
      />
    );

    const input = screen.getByPlaceholderText("输入关键词搜索...");
    await act(async () => {
      fireEvent.change(input, { target: { value: "xyz" } });
      vi.advanceTimersByTime(400);
    });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("未找到匹配的内容块")).toBeInTheDocument();
    });
  });

  it("shows error state when search fails", async () => {
    vi.mocked(adminAssetEditor.searchBlocks).mockRejectedValue(new Error("Network error"));

    render(
      <GlobalSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onInsert={mockOnInsert}
        token={mockToken}
      />
    );

    const input = screen.getByPlaceholderText("输入关键词搜索...");
    await act(async () => {
      fireEvent.change(input, { target: { value: "hello" } });
      vi.advanceTimersByTime(400);
    });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});