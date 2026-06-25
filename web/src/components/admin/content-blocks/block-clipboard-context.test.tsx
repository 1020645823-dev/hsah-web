import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { BlockClipboardProvider, useBlockClipboard } from "./block-clipboard-context";
import type { ClipboardBlock } from "./block-clipboard-context";

describe("BlockClipboardContext", () => {
  it("initial state has no blocks", () => {
    const { result } = renderHook(() => useBlockClipboard(), {
      wrapper: BlockClipboardProvider,
    });

    expect(result.current.copiedBlocks).toEqual([]);
    expect(result.current.hasBlocks).toBe(false);
  });

  it("copyBlock stores correct type and config", () => {
    const { result } = renderHook(() => useBlockClipboard(), {
      wrapper: BlockClipboardProvider,
    });

    const block: ClipboardBlock = {
      type: "text",
      config: { markdown: "# Hello", html: "<h1>Hello</h1>" },
    };

    act(() => {
      result.current.copyBlock(block);
    });

    expect(result.current.copiedBlocks).toEqual([block]);
    expect(result.current.hasBlocks).toBe(true);
  });

  it("pasteBlocks returns copied blocks", () => {
    const { result } = renderHook(() => useBlockClipboard(), {
      wrapper: BlockClipboardProvider,
    });

    const block: ClipboardBlock = {
      type: "callout",
      config: { variant: "info", title: "Note", content: "Important" },
    };

    act(() => {
      result.current.copyBlock(block);
    });

    const pasted = result.current.pasteBlocks();
    expect(pasted).toEqual([block]);
  });

  it("clearClipboard empties state", () => {
    const { result } = renderHook(() => useBlockClipboard(), {
      wrapper: BlockClipboardProvider,
    });

    const block: ClipboardBlock = {
      type: "image",
      config: { url: "https://example.com/img.png", alt: "Example" },
    };

    act(() => {
      result.current.copyBlock(block);
    });

    expect(result.current.hasBlocks).toBe(true);

    act(() => {
      result.current.clearClipboard();
    });

    expect(result.current.copiedBlocks).toEqual([]);
    expect(result.current.hasBlocks).toBe(false);
  });

  it("copyBlocks replaces previous copied blocks with multiple blocks", () => {
    const { result } = renderHook(() => useBlockClipboard(), {
      wrapper: BlockClipboardProvider,
    });

    const blocks: ClipboardBlock[] = [
      { type: "text", config: { markdown: "A", html: "A" } },
      { type: "stat_card", config: { items: [{ label: "L", value: "V" }] } },
    ];

    act(() => {
      result.current.copyBlocks(blocks);
    });

    expect(result.current.copiedBlocks).toEqual(blocks);
    expect(result.current.hasBlocks).toBe(true);
  });
});
