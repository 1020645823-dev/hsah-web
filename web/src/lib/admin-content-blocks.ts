export type TextBlockConfig = {
  markdown: string;
  html: string;
};

export type StatCardItem = {
  label: string;
  value: string;
  description: string;
};

export type StatCardBlockConfig = {
  title?: string;
  stats?: StatCardItem[];
  items?: StatCardItem[];
};

export type ImageBlockConfig = {
  src: string;
  alt: string;
  caption: string;
  url?: string;
  width?: number;
};

export type CodeSnippetBlockConfig = {
  language: string;
  code: string;
  showLineNumbers: boolean;
  filename?: string;
};

export type CalloutBlockConfig = {
  tone: "info" | "warning" | "success" | "error";
  title: string;
  content: string;
  variant?: "info" | "warning" | "error" | "tip";
};

export type ContentBlockType = "text" | "stat_card" | "image" | "code_snippet" | "callout";

export type ContentBlockConfig = TextBlockConfig | StatCardBlockConfig | ImageBlockConfig | CodeSnippetBlockConfig | CalloutBlockConfig;

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  version: number;
  order: number;
  visible: boolean;
  config: ContentBlockConfig;
};

const VALID_TYPES: ContentBlockType[] = ["text", "stat_card", "image", "code_snippet", "callout"];
export const LATEST_CONTENT_BLOCK_VERSION = 2;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isContentBlock(value: unknown): value is ContentBlock {
  if (!isPlainObject(value)) return false;
  if (typeof value.id !== "string" || value.id.length === 0) return false;
  if (typeof value.type !== "string" || !VALID_TYPES.includes(value.type as ContentBlockType)) return false;
  if (
    "version" in value &&
    (typeof value.version !== "number" || !Number.isInteger(value.version) || value.version < 1)
  ) {
    return false;
  }
  if (typeof value.order !== "number" || value.order < 0) return false;
  if (typeof value.visible !== "boolean") return false;
  if (!isPlainObject(value.config)) return false;

  if (value.type === "text") {
    const cfg = value.config as TextBlockConfig;
    if (typeof cfg.markdown !== "string") return false;
    if ("html" in cfg && typeof cfg.html !== "string") return false;
    return true;
  }
  if (value.type === "stat_card") {
    const cfg = value.config as StatCardBlockConfig;
    if (typeof cfg.title !== "string" || !Array.isArray(cfg.stats)) return false;
    return cfg.stats.every(
      (item) =>
        isPlainObject(item) &&
        typeof item.label === "string" &&
        typeof item.value === "string" &&
        typeof item.description === "string",
    );
  }
  if (value.type === "image") {
    const cfg = value.config as ImageBlockConfig;
    return (
      typeof cfg.src === "string" &&
      typeof cfg.alt === "string" &&
      typeof cfg.caption === "string"
    );
  }
  if (value.type === "code_snippet") {
    const cfg = value.config as CodeSnippetBlockConfig;
    return (
      typeof cfg.language === "string" &&
      typeof cfg.code === "string" &&
      typeof cfg.showLineNumbers === "boolean"
    );
  }
  if (value.type === "callout") {
    const cfg = value.config as CalloutBlockConfig;
    const validVariants = ["info", "warning", "success", "error"];
    return (
      typeof cfg.content === "string" &&
      typeof cfg.title === "string" &&
      typeof cfg.tone === "string" &&
      validVariants.includes(cfg.tone)
    );
  }
  return false;
}

export function createDefaultBlock(type: ContentBlockType): ContentBlock {
  if (type === "text") {
    return {
      id: crypto.randomUUID(),
      type: "text",
      version: LATEST_CONTENT_BLOCK_VERSION,
      order: 0,
      visible: true,
      config: { markdown: "", html: "" },
    };
  }
  if (type === "stat_card") {
    return {
      id: crypto.randomUUID(),
      type: "stat_card",
      version: LATEST_CONTENT_BLOCK_VERSION,
      order: 0,
      visible: true,
      config: { title: "", stats: [] },
    };
  }
  if (type === "image") {
    return {
      id: crypto.randomUUID(),
      type: "image",
      version: LATEST_CONTENT_BLOCK_VERSION,
      order: 0,
      visible: true,
      config: { src: "", alt: "", caption: "" },
    };
  }
  if (type === "code_snippet") {
    return {
      id: crypto.randomUUID(),
      type: "code_snippet",
      version: LATEST_CONTENT_BLOCK_VERSION,
      order: 0,
      visible: true,
      config: { language: "plaintext", code: "", showLineNumbers: true },
    };
  }
  return {
    id: crypto.randomUUID(),
    type: "callout",
    version: LATEST_CONTENT_BLOCK_VERSION,
    order: 0,
    visible: true,
    config: { tone: "info", title: "", content: "" },
  };
}

export function validateBlock(block: unknown): ContentBlock {
  if (isContentBlock(block)) return block;

  if (!isPlainObject(block)) {
    throw new Error("Invalid content block: expected an object");
  }

  const type = VALID_TYPES.includes(block.type as ContentBlockType)
    ? (block.type as ContentBlockType)
    : "text";

  const id = typeof block.id === "string" && block.id.length > 0 ? block.id : crypto.randomUUID();
  const version =
    typeof block.version === "number" && Number.isInteger(block.version) && block.version > 0
      ? block.version
      : LATEST_CONTENT_BLOCK_VERSION;
  const order = typeof block.order === "number" && block.order >= 0 ? block.order : 0;
  const visible = typeof block.visible === "boolean" ? block.visible : true;

  let config: ContentBlockConfig;
  if (type === "text") {
    const markdown =
      isPlainObject(block.config) && typeof block.config.markdown === "string"
        ? block.config.markdown
        : "";
    const html =
      isPlainObject(block.config) && typeof block.config.html === "string"
        ? block.config.html
        : "";
    config = { markdown, html };
  } else if (type === "stat_card") {
    const rawItems = isPlainObject(block.config)
      ? Array.isArray(block.config.stats)
        ? block.config.stats
        : Array.isArray(block.config.items)
          ? block.config.items
          : []
      : [];
    const stats: StatCardItem[] = rawItems
      .filter(
        (item): item is StatCardItem =>
          isPlainObject(item) &&
          typeof item.label === "string" &&
          typeof item.value === "string",
      );
    config = {
      title: isPlainObject(block.config) && typeof block.config.title === "string"
        ? block.config.title
        : "",
      stats: stats.map((item) => ({
        label: item.label,
        value: item.value,
        description:
          "description" in item && typeof item.description === "string" ? item.description : "",
      })),
    };
  } else if (type === "image") {
    const src = isPlainObject(block.config) && typeof block.config.src === "string"
      ? block.config.src
      : isPlainObject(block.config) && typeof block.config.url === "string"
        ? block.config.url
      : "";
    const alt = isPlainObject(block.config) && typeof block.config.alt === "string"
      ? block.config.alt
      : "";
    const caption = isPlainObject(block.config) && typeof block.config.caption === "string"
      ? block.config.caption
      : "";
    config = { src, alt, caption };
  } else if (type === "code_snippet") {
    const language = isPlainObject(block.config) && typeof block.config.language === "string"
      ? block.config.language
      : "plaintext";
    const code = isPlainObject(block.config) && typeof block.config.code === "string"
      ? block.config.code
      : "";
    const showLineNumbers =
      isPlainObject(block.config) && typeof block.config.showLineNumbers === "boolean"
        ? block.config.showLineNumbers
        : true;
    const filename = isPlainObject(block.config) && typeof block.config.filename === "string"
      ? block.config.filename
      : "";
    config = filename
      ? { language, code, showLineNumbers, filename }
      : { language, code, showLineNumbers };
  } else {
    const tone = normalizeCalloutTone(
      isPlainObject(block.config) && typeof block.config.tone === "string"
        ? block.config.tone
        : isPlainObject(block.config) && typeof block.config.variant === "string"
          ? block.config.variant
          : "info",
    );
    const title = isPlainObject(block.config) && typeof block.config.title === "string"
      ? block.config.title
      : "";
    const content = isPlainObject(block.config) && typeof block.config.content === "string"
      ? block.config.content
      : "";
    config = { tone, title, content };
  }

  return { id, type, version, order, visible, config };
}

function normalizeCalloutTone(value: string): CalloutBlockConfig["tone"] {
  if (value === "warning" || value === "success" || value === "error") {
    return value;
  }
  return "info";
}

export function searchBlockContent(block: ContentBlock, keyword: string): boolean {
  if (!keyword || keyword.trim() === "") return true;

  const lowerKeyword = keyword.toLowerCase();

  switch (block.type) {
    case "text": {
      const cfg = block.config as TextBlockConfig;
      return (
        (cfg.html?.toLowerCase().includes(lowerKeyword) ?? false) ||
        (cfg.markdown?.toLowerCase().includes(lowerKeyword) ?? false)
      );
    }
    case "stat_card": {
      const cfg = block.config as StatCardBlockConfig;
      const stats = Array.isArray(cfg.stats)
        ? cfg.stats
        : Array.isArray((block.config as { items?: StatCardItem[] }).items)
          ? (block.config as { items: StatCardItem[] }).items
          : [];
      return stats.some(
        (item) =>
          item.label.toLowerCase().includes(lowerKeyword) ||
          item.value.toLowerCase().includes(lowerKeyword) ||
          item.description.toLowerCase().includes(lowerKeyword),
      );
    }
    case "image": {
      const cfg = block.config as ImageBlockConfig;
      return (
        (cfg.alt?.toLowerCase().includes(lowerKeyword) ?? false) ||
        (cfg.caption?.toLowerCase().includes(lowerKeyword) ?? false)
      );
    }
    case "code_snippet": {
      const cfg = block.config as CodeSnippetBlockConfig;
      return cfg.code.toLowerCase().includes(lowerKeyword);
    }
    case "callout": {
      const cfg = block.config as CalloutBlockConfig;
      return (
        (cfg.title?.toLowerCase().includes(lowerKeyword) ?? false) ||
        cfg.content.toLowerCase().includes(lowerKeyword)
      );
    }
    default:
      return false;
  }
}
