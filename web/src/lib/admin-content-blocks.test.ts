import { describe, expect, it } from "vitest";

import {
  type ContentBlock,
  createDefaultBlock,
  isContentBlock,
  validateBlock,
  searchBlockContent,
} from "./admin-content-blocks";

describe("isContentBlock", () => {
  const validTextBlock: ContentBlock = {
    id: "block-1",
    type: "text",
    version: 2,
    order: 0,
    visible: true,
    config: { markdown: "# Hello", html: "" },
  };

  const validStatCardBlock: ContentBlock = {
    id: "block-2",
    type: "stat_card",
    version: 2,
    order: 1,
    visible: false,
    config: { title: "", stats: [{ label: "Revenue", value: "$1M", description: "" }] },
  };

  it("returns true for a valid text block", () => {
    expect(isContentBlock(validTextBlock)).toBe(true);
  });

  it("returns true for a valid text block with html", () => {
    expect(
      isContentBlock({ ...validTextBlock, config: { markdown: "# Hello", html: "<p>Hello</p>" } }),
    ).toBe(true);
  });

  it("returns false for a text block with invalid html type", () => {
    expect(
      isContentBlock({ ...validTextBlock, config: { markdown: "# Hello", html: 123 } }),
    ).toBe(false);
  });

  it("returns true for a valid stat_card block", () => {
    expect(isContentBlock(validStatCardBlock)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isContentBlock(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isContentBlock(undefined)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isContentBlock("not a block")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isContentBlock(42)).toBe(false);
  });

  it("returns false for an empty object", () => {
    expect(isContentBlock({})).toBe(false);
  });

  it("returns false when id is missing", () => {
      const blockWithoutId = { type: "text", order: 0, visible: true, config: { markdown: "test", html: "" } };
      expect(isContentBlock(blockWithoutId)).toBe(false);
    });

  it("returns false when id is empty string", () => {
    expect(isContentBlock({ ...validTextBlock, id: "" })).toBe(false);
  });

  it("returns false when type is invalid", () => {
    expect(isContentBlock({ ...validTextBlock, type: "video" })).toBe(false);
  });

  it("returns false when order is negative", () => {
    expect(isContentBlock({ ...validTextBlock, order: -1 })).toBe(false);
  });

  it("returns false when order is not a number", () => {
    expect(isContentBlock({ ...validTextBlock, order: "0" })).toBe(false);
  });

  it("returns false when visible is not a boolean", () => {
    expect(isContentBlock({ ...validTextBlock, visible: 1 })).toBe(false);
  });

  it("returns false when text block config is missing markdown", () => {
    expect(isContentBlock({ ...validTextBlock, config: { html: "" } })).toBe(false);
  });

  it("returns false when text block markdown is not a string", () => {
    expect(isContentBlock({ ...validTextBlock, config: { markdown: 123, html: "" } })).toBe(false);
  });

  it("returns false when stat_card config items is not an array", () => {
    expect(
      isContentBlock({ ...validStatCardBlock, config: { title: "", stats: "not array" } }),
    ).toBe(false);
  });

  it("returns false when stat_card items have invalid shape", () => {
    expect(
      isContentBlock({
        ...validStatCardBlock,
        config: { title: "", stats: [{ label: "x" }] },
      }),
    ).toBe(false);
  });

  it("returns true for stat_card block with empty items array", () => {
    expect(
      isContentBlock({ ...validStatCardBlock, config: { title: "", stats: [] } }),
    ).toBe(true);
  });

  it("returns true for a valid image block", () => {
    const block: ContentBlock = {
      id: "block-img",
      type: "image",
      version: 2,
      order: 0,
      visible: true,
      config: { src: "https://example.com/img.png", alt: "An image", caption: "" },
    };
    expect(isContentBlock(block)).toBe(true);
  });

  it("returns true for a valid code_snippet block", () => {
    const block: ContentBlock = {
      id: "block-code",
      type: "code_snippet",
      version: 2,
      order: 0,
      visible: true,
      config: { language: "typescript", code: "const x = 1;", showLineNumbers: true },
    };
    expect(isContentBlock(block)).toBe(true);
  });

  it("returns true for a valid callout block", () => {
    const block: ContentBlock = {
      id: "block-callout",
      type: "callout",
      version: 2,
      order: 0,
      visible: true,
      config: { tone: "warning", title: "Heads up", content: "Be careful" },
    };
    expect(isContentBlock(block)).toBe(true);
  });

  it("returns false when image block is missing url", () => {
    expect(
      isContentBlock({
        id: "block-img",
        type: "image",
        order: 0,
        visible: true,
        config: { alt: "An image" },
      }),
    ).toBe(false);
  });

  it("returns false when image block is missing alt", () => {
    expect(
      isContentBlock({
        id: "block-img",
        type: "image",
        order: 0,
        visible: true,
        config: { src: "https://example.com/img.png" },
      }),
    ).toBe(false);
  });

  it("returns false when code_snippet block is missing language", () => {
    expect(
      isContentBlock({
        id: "block-code",
        type: "code_snippet",
        order: 0,
        visible: true,
        config: { code: "const x = 1;", showLineNumbers: true },
      }),
    ).toBe(false);
  });

  it("returns false when code_snippet showLineNumbers is not boolean", () => {
    expect(
      isContentBlock({
        id: "block-code",
        type: "code_snippet",
        order: 0,
        visible: true,
        config: { language: "js", code: "x", showLineNumbers: "yes" },
      }),
    ).toBe(false);
  });

  it("returns false when callout tone is invalid", () => {
    expect(
      isContentBlock({
        id: "block-callout",
        type: "callout",
        order: 0,
        visible: true,
        config: { tone: "danger", content: "Oops", title: "" },
      }),
    ).toBe(false);
  });

  it("returns false when callout block is missing content", () => {
    expect(
      isContentBlock({
        id: "block-callout",
        type: "callout",
        order: 0,
        visible: true,
        config: { tone: "info", title: "" },
      }),
    ).toBe(false);
  });
});

describe("createDefaultBlock", () => {
  it("creates a text block with empty markdown and html", () => {
    const block = createDefaultBlock("text");
    expect(block.type).toBe("text");
    expect(block.config).toEqual({ markdown: "", html: "" });
    expect(block.order).toBe(0);
    expect(block.visible).toBe(true);
    expect(typeof block.id).toBe("string");
    expect(block.id.length).toBeGreaterThan(0);
  });

  it("creates a stat_card block with empty items array", () => {
    const block = createDefaultBlock("stat_card");
    expect(block.type).toBe("stat_card");
    expect(block.version).toBe(2);
    expect(block.config).toEqual({ title: "", stats: [] });
    expect(block.order).toBe(0);
    expect(block.visible).toBe(true);
    expect(typeof block.id).toBe("string");
    expect(block.id.length).toBeGreaterThan(0);
  });

  it("generates unique ids for different blocks", () => {
    const block1 = createDefaultBlock("text");
    const block2 = createDefaultBlock("text");
    expect(block1.id).not.toBe(block2.id);
  });

  it("produces blocks that pass isContentBlock", () => {
    expect(isContentBlock(createDefaultBlock("text"))).toBe(true);
    expect(isContentBlock(createDefaultBlock("stat_card"))).toBe(true);
    expect(isContentBlock(createDefaultBlock("image"))).toBe(true);
    expect(isContentBlock(createDefaultBlock("code_snippet"))).toBe(true);
    expect(isContentBlock(createDefaultBlock("callout"))).toBe(true);
  });

  it("creates an image block with default config", () => {
    const block = createDefaultBlock("image");
    expect(block.type).toBe("image");
    expect(block.version).toBe(2);
    expect(block.config).toEqual({ src: "", alt: "", caption: "" });
    expect(block.order).toBe(0);
    expect(block.visible).toBe(true);
    expect(typeof block.id).toBe("string");
    expect(block.id.length).toBeGreaterThan(0);
  });

  it("creates a code_snippet block with default config", () => {
    const block = createDefaultBlock("code_snippet");
    expect(block.type).toBe("code_snippet");
    expect(block.version).toBe(2);
    expect(block.config).toEqual({ language: "plaintext", code: "", showLineNumbers: true });
    expect(block.order).toBe(0);
    expect(block.visible).toBe(true);
    expect(typeof block.id).toBe("string");
    expect(block.id.length).toBeGreaterThan(0);
  });

  it("creates a callout block with default config", () => {
    const block = createDefaultBlock("callout");
    expect(block.type).toBe("callout");
    expect(block.version).toBe(2);
    expect(block.config).toEqual({ tone: "info", title: "", content: "" });
    expect(block.order).toBe(0);
    expect(block.visible).toBe(true);
    expect(typeof block.id).toBe("string");
    expect(block.id.length).toBeGreaterThan(0);
  });
});

describe("validateBlock", () => {
  it("returns a valid block unchanged", () => {
    const block: ContentBlock = {
      id: "block-1",
      type: "text",
      version: 2,
      order: 0,
      visible: true,
      config: { markdown: "# Hello", html: "" },
    };
    const result = validateBlock(block);
    expect(result).toEqual({ ...block, version: 2 });
  });

  it("fills in defaults for a text block with missing fields", () => {
    const result = validateBlock({ type: "text" });
    expect(result.type).toBe("text");
    expect(result.config).toEqual({ markdown: "", html: "" });
    expect(result.order).toBe(0);
    expect(result.visible).toBe(true);
    expect(typeof result.id).toBe("string");
    expect(result.id.length).toBeGreaterThan(0);
  });

  it("fills in defaults for a stat_card block with missing fields", () => {
    const result = validateBlock({ type: "stat_card" });
    expect(result.type).toBe("stat_card");
    expect(result.version).toBe(2);
    expect(result.config).toEqual({ title: "", stats: [] });
    expect(result.order).toBe(0);
    expect(result.visible).toBe(true);
  });

  it("defaults to text type when type is invalid", () => {
    const result = validateBlock({ type: "video" });
    expect(result.type).toBe("text");
    expect(result.config).toEqual({ markdown: "", html: "" });
  });

  it("preserves valid fields and only fixes missing ones", () => {
    const result = validateBlock({
      id: "custom-id",
      type: "text",
      order: 5,
      config: { markdown: "# Title", html: "<p>Title</p>" },
    });
    expect(result.id).toBe("custom-id");
    expect(result.type).toBe("text");
    expect(result.order).toBe(5);
    expect(result.visible).toBe(true);
    expect(result.config).toEqual({ markdown: "# Title", html: "<p>Title</p>" });
  });

  it("filters out invalid items from stat_card config", () => {
    const result = validateBlock({
      id: "block-1",
      type: "stat_card",
      order: 0,
      visible: true,
      config: {
        items: [
          { label: "Good", value: "100" },
          { label: "Missing value" },
          "invalid",
          { value: "No label" },
          { label: "Also good", value: "200" },
        ],
      },
    });
    expect(result.config).toEqual({
      title: "",
      stats: [
        { label: "Good", value: "100", description: "" },
        { label: "Also good", value: "200", description: "" },
      ],
    });
  });

  it("ignores non-string markdown in text config", () => {
    const result = validateBlock({
      id: "block-1",
      type: "text",
      order: 0,
      visible: true,
      config: { markdown: 42, html: 42 },
    });
    expect(result.config).toEqual({ markdown: "", html: "" });
  });

  it("resets order to 0 when negative", () => {
    const result = validateBlock({
      id: "block-1",
      type: "text",
      order: -3,
      visible: true,
      config: { markdown: "", html: "" },
    });
    expect(result.order).toBe(0);
  });

  it("throws when input is not a plain object", () => {
    expect(() => validateBlock(null)).toThrow();
    expect(() => validateBlock("string")).toThrow();
    expect(() => validateBlock(42)).toThrow();
    expect(() => validateBlock([])).toThrow();
  });

  it("resets items to empty array when not an array in stat_card", () => {
    const result = validateBlock({
      id: "block-1",
      type: "stat_card",
      order: 0,
      visible: true,
      config: { items: "not-array" },
    });
    expect(result.config).toEqual({ title: "", stats: [] });
  });

  it("resets config to defaults when config is missing", () => {
    const result = validateBlock({
      id: "block-1",
      type: "text",
      order: 0,
      visible: true,
    });
    expect(result.config).toEqual({ markdown: "", html: "" });
  });

  it("fills in defaults for an image block with missing fields", () => {
    const result = validateBlock({ type: "image" });
    expect(result.type).toBe("image");
    expect(result.version).toBe(2);
    expect(result.config).toEqual({ src: "", alt: "", caption: "" });
    expect(result.order).toBe(0);
    expect(result.visible).toBe(true);
    expect(typeof result.id).toBe("string");
    expect(result.id.length).toBeGreaterThan(0);
  });

  it("fills in defaults for a code_snippet block with missing fields", () => {
    const result = validateBlock({ type: "code_snippet" });
    expect(result.type).toBe("code_snippet");
    expect(result.version).toBe(2);
    expect(result.config).toEqual({ language: "plaintext", code: "", showLineNumbers: true });
    expect(result.order).toBe(0);
    expect(result.visible).toBe(true);
  });

  it("fills in defaults for a callout block with missing fields", () => {
    const result = validateBlock({ type: "callout" });
    expect(result.type).toBe("callout");
    expect(result.version).toBe(2);
    expect(result.config).toEqual({ tone: "info", title: "", content: "" });
    expect(result.order).toBe(0);
    expect(result.visible).toBe(true);
  });

  it("preserves valid image fields and only fixes missing ones", () => {
    const result = validateBlock({
      id: "img-1",
      type: "image",
      order: 2,
      visible: false,
      config: { url: "https://example.com/photo.jpg" },
    });
    expect(result.id).toBe("img-1");
    expect(result.type).toBe("image");
    expect(result.order).toBe(2);
    expect(result.visible).toBe(false);
    expect(result.config).toEqual({ src: "https://example.com/photo.jpg", alt: "", caption: "" });
  });

  it("resets callout tone to info when invalid", () => {
    const result = validateBlock({
      id: "callout-1",
      type: "callout",
      order: 0,
      visible: true,
      config: { variant: "danger", content: "Oops" },
    });
    expect(result.config).toEqual({ tone: "info", title: "", content: "Oops" });
  });
});

describe("searchBlockContent", () => {
  it("returns true for empty keyword", () => {
    const block: ContentBlock = {
      id: "block-1",
      type: "text",
      order: 0,
      visible: true,
      config: { markdown: "Hello world", html: "<p>Hello world</p>" },
    };
    expect(searchBlockContent(block, "")).toBe(true);
    expect(searchBlockContent(block, "   ")).toBe(true);
  });

  it("matches text block html and markdown", () => {
    const block: ContentBlock = {
      id: "block-1",
      type: "text",
      order: 0,
      visible: true,
      config: { markdown: "Hello world", html: "<p>Hello world</p>" },
    };
    expect(searchBlockContent(block, "hello")).toBe(true);
    expect(searchBlockContent(block, "WORLD")).toBe(true);
    expect(searchBlockContent(block, "missing")).toBe(false);
  });

  it("matches stat_card items label and value", () => {
    const block: ContentBlock = {
      id: "block-2",
      type: "stat_card",
      version: 2,
      order: 1,
      visible: true,
      config: { title: "", stats: [{ label: "Revenue", value: "$1M", description: "" }] },
    };
    expect(searchBlockContent(block, "revenue")).toBe(true);
    expect(searchBlockContent(block, "1M")).toBe(true);
    expect(searchBlockContent(block, "profit")).toBe(false);
  });

  it("matches image alt and caption", () => {
    const block: ContentBlock = {
      id: "block-img",
      type: "image",
      version: 2,
      order: 0,
      visible: true,
      config: { src: "https://example.com/img.png", alt: "A cat", caption: "Cute cat" },
    };
    expect(searchBlockContent(block, "cat")).toBe(true);
    expect(searchBlockContent(block, "cute")).toBe(true);
    expect(searchBlockContent(block, "dog")).toBe(false);
  });

  it("matches code_snippet code", () => {
    const block: ContentBlock = {
      id: "block-code",
      type: "code_snippet",
      version: 2,
      order: 0,
      visible: true,
      config: { language: "typescript", code: "const x = 1;", showLineNumbers: true },
    };
    expect(searchBlockContent(block, "const")).toBe(true);
    expect(searchBlockContent(block, "let")).toBe(false);
  });

  it("matches callout title and content", () => {
    const block: ContentBlock = {
      id: "block-callout",
      type: "callout",
      version: 2,
      order: 0,
      visible: true,
      config: { tone: "info", title: "Important", content: "Please read this" },
    };
    expect(searchBlockContent(block, "important")).toBe(true);
    expect(searchBlockContent(block, "please")).toBe(true);
    expect(searchBlockContent(block, "warning")).toBe(false);
  });
});

describe("phase9 versioned block schema", () => {
  it("creates default blocks with a versioned wrapper and latest config keys", () => {
    expect(createDefaultBlock("stat_card")).toMatchObject({
      type: "stat_card",
      version: 2,
      config: { title: "", stats: [] },
    });
    expect(createDefaultBlock("image")).toMatchObject({
      type: "image",
      version: 2,
      config: { src: "", alt: "", caption: "" },
    });
    expect(createDefaultBlock("code_snippet")).toMatchObject({
      type: "code_snippet",
      version: 2,
      config: { language: "plaintext", code: "", showLineNumbers: true },
    });
    expect(createDefaultBlock("callout")).toMatchObject({
      type: "callout",
      version: 2,
      config: { tone: "info", title: "", content: "" },
    });
  });

  it("normalizes legacy config aliases into the latest schema", () => {
    expect(
      validateBlock({
        id: "legacy-image",
        type: "image",
        config: { url: "https://example.com/image.png", alt: "Image alt", caption: "Caption" },
      }),
    ).toMatchObject({
      id: "legacy-image",
      type: "image",
      version: 2,
      config: { src: "https://example.com/image.png", alt: "Image alt", caption: "Caption" },
    });

    expect(
      validateBlock({
        id: "legacy-callout",
        type: "callout",
        config: { variant: "tip", title: "Heads up", content: "Info" },
      }),
    ).toMatchObject({
      id: "legacy-callout",
      type: "callout",
      version: 2,
      config: { tone: "info", title: "Heads up", content: "Info" },
    });
  });

  it("preserves filename and defaults showLineNumbers", () => {
    expect(
      validateBlock({
        id: "legacy-code",
        type: "code_snippet",
        config: { language: "python", code: "print('hi')", filename: "demo.py" },
      }),
    ).toMatchObject({
      id: "legacy-code",
      type: "code_snippet",
      version: 2,
      config: { language: "python", code: "print('hi')", showLineNumbers: true, filename: "demo.py" },
    });
  });
});
