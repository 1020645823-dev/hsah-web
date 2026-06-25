import { describe, expect, it } from "vitest";

import {
  clearBlockErrors,
  getErrorSummary,
  getFieldError,
  groupBlockErrors,
  type BlockFieldError,
} from "./content-block-errors";

describe("content block error helpers", () => {
  const errors: BlockFieldError[] = [
    {
      blockId: "image-1",
      blockType: "image",
      field: "config.alt",
      message: "Alt text is required",
    },
    {
      blockId: "image-1",
      blockType: "image",
      field: "config.src",
      message: "Image source is required",
    },
    {
      blockId: "text-1",
      blockType: "text",
      field: "config.html",
      message: "Content is required",
    },
  ];

  it("groups backend validation errors by block id", () => {
    const grouped = groupBlockErrors(errors);

    expect(grouped["image-1"]).toHaveLength(2);
    expect(getFieldError(grouped["image-1"], "config.alt")).toBe("Alt text is required");
    expect(getFieldError(grouped["text-1"], "config.html")).toBe("Content is required");
  });

  it("returns summary counts and clears a single block", () => {
    expect(getErrorSummary(errors)).toEqual({
      totalFieldErrors: 3,
      totalBlocksWithErrors: 2,
    });

    expect(clearBlockErrors(errors, "image-1")).toEqual([
      {
        blockId: "text-1",
        blockType: "text",
        field: "config.html",
        message: "Content is required",
      },
    ]);
  });
});
