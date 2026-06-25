"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ContentBlockType, ContentBlockConfig } from "@/lib/admin-content-blocks";

export type ClipboardBlock = {
  type: ContentBlockType;
  config: ContentBlockConfig;
  version?: number;
};

interface BlockClipboardState {
  copiedBlocks: ClipboardBlock[];
  hasBlocks: boolean;
  copyBlock: (block: ClipboardBlock) => void;
  copyBlocks: (blocks: ClipboardBlock[]) => void;
  pasteBlocks: () => ClipboardBlock[];
  clearClipboard: () => void;
}

const BlockClipboardContext = createContext<BlockClipboardState | null>(null);

export function BlockClipboardProvider({ children }: { children: React.ReactNode }) {
  const [copiedBlocks, setCopiedBlocks] = useState<ClipboardBlock[]>([]);

  const copyBlock = useCallback((block: ClipboardBlock) => {
    setCopiedBlocks([block]);
  }, []);

  const copyBlocks = useCallback((blocks: ClipboardBlock[]) => {
    setCopiedBlocks(blocks);
  }, []);

  const pasteBlocks = useCallback(() => {
    return copiedBlocks;
  }, [copiedBlocks]);

  const clearClipboard = useCallback(() => {
    setCopiedBlocks([]);
  }, []);

  const hasBlocks = copiedBlocks.length > 0;

  return (
    <BlockClipboardContext.Provider
      value={{
        copiedBlocks,
        hasBlocks,
        copyBlock,
        copyBlocks,
        pasteBlocks,
        clearClipboard,
      }}
    >
      {children}
    </BlockClipboardContext.Provider>
  );
}

export function useBlockClipboard(): BlockClipboardState {
  const context = useContext(BlockClipboardContext);
  if (!context) {
    throw new Error("useBlockClipboard must be used within a BlockClipboardProvider");
  }
  return context;
}
