import {
  type ContentBlock,
  validateBlock,
  LATEST_CONTENT_BLOCK_VERSION,
} from "./admin-content-blocks";

export type BlockSearchResult = {
  asset_id: number;
  asset_name: string;
  asset_slug: string;
  block: ContentBlock;
  matched_field: string;
};

export type AssetVideoDraft = {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl: string;
  description: string;
  isPrimary: boolean;
};

export type AssetEditorDraft = {
  slug: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  cloudProviders: string[];
  industries: string[];
  technologies: string[];
  assetType: string;
  status: string;
  visibility: string;
  allowedRoles: string[];
  allowedUsers: string[];
  sharedFields: {
    introduction: string;
    useCases: string[];
    demoVideoUrl: string;
    liveDemoUrl: string;
    videos: AssetVideoDraft[];
  };
  salesFields: {
    valueSummary: string;
    differentiators: string[];
    outcomes: string[];
  };
  deliveryFields: {
    implementationSummary: string;
    prerequisites: string[];
    rolloutSteps: string[];
  };
  deliveryAllowedRoles: string[];
  deliveryAllowedUsers: string[];
  contentSchemaVersion: number;
  contentBlocks: ContentBlock[];
};

export const INITIAL_DRAFT: AssetEditorDraft = {
  slug: "",
  title: "",
  subtitle: "",
  shortDescription: "",
  cloudProviders: [],
  industries: [],
  technologies: [],
  assetType: "solution",
  status: "draft",
  visibility: "public",
  allowedRoles: [],
  allowedUsers: [],
  sharedFields: {
    introduction: "",
    useCases: [],
    demoVideoUrl: "",
    liveDemoUrl: "",
    videos: [],
  },
  salesFields: {
    valueSummary: "",
    differentiators: [],
    outcomes: [],
  },
  deliveryFields: {
    implementationSummary: "",
    prerequisites: [],
    rolloutSteps: [],
  },
  deliveryAllowedRoles: [],
  deliveryAllowedUsers: [],
  contentSchemaVersion: LATEST_CONTENT_BLOCK_VERSION,
  contentBlocks: [],
};

export const ASSET_TYPE_OPTIONS = ["solution", "whitepaper", "demo", "reference-architecture"] as const;
export const ASSET_STATUS_OPTIONS = ["draft", "published", "archived"] as const;
export const ASSET_VISIBILITY_OPTIONS = ["public", "restricted", "internal"] as const;

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export type ValidationError = Partial<Record<keyof AssetEditorDraft, string>>;

export function validateDraft(draft: AssetEditorDraft): { valid: boolean; errors: ValidationError } {
  const errors: ValidationError = {};

  if (!draft.slug.trim()) {
    errors.slug = "必填";
  } else if (!SLUG_PATTERN.test(draft.slug)) {
    errors.slug = "只能包含小写字母、数字和连字符";
  } else if (draft.slug.length > 200) {
    errors.slug = "最多 200 个字符";
  }

  if (!draft.title.trim()) {
    errors.title = "必填";
  } else if (draft.title.length > 240) {
    errors.title = "最多 240 个字符";
  }

  if (draft.subtitle.length > 300) {
    errors.subtitle = "最多 300 个字符";
  }

  if (!draft.shortDescription.trim()) {
    errors.shortDescription = "必填";
  } else if (draft.shortDescription.length > 500) {
    errors.shortDescription = "最多 500 个字符";
  }

  if (!ASSET_TYPE_OPTIONS.includes(draft.assetType as (typeof ASSET_TYPE_OPTIONS)[number])) {
    errors.assetType = "无效的资产类型";
  }

  if (!ASSET_STATUS_OPTIONS.includes(draft.status as (typeof ASSET_STATUS_OPTIONS)[number])) {
    errors.status = "无效的状态";
  }

  if (!ASSET_VISIBILITY_OPTIONS.includes(draft.visibility as (typeof ASSET_VISIBILITY_OPTIONS)[number])) {
    errors.visibility = "无效的可见性";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function dedupeStrs(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

export function buildPayload(draft: AssetEditorDraft) {
  const subtitle = draft.subtitle.trim();
  return {
    slug: draft.slug.trim(),
    title: draft.title.trim(),
    subtitle: subtitle || null,
    short_description: draft.shortDescription.trim(),
    cloud_providers: dedupeStrs(draft.cloudProviders),
    industries: dedupeStrs(draft.industries),
    technologies: dedupeStrs(draft.technologies),
    asset_type: draft.assetType,
    status: draft.status,
    visibility: draft.visibility,
    allowed_roles: dedupeStrs(draft.allowedRoles),
    allowed_users: dedupeStrs(draft.allowedUsers),
    shared_fields: {
      introduction: draft.sharedFields.introduction.trim(),
      use_cases: dedupeStrs(draft.sharedFields.useCases),
      demo_video_url: draft.sharedFields.demoVideoUrl.trim() || null,
      live_demo_url: draft.sharedFields.liveDemoUrl.trim() || null,
      videos: draft.sharedFields.videos.map((v) => ({
        id: v.id,
        title: v.title.trim(),
        video_url: v.videoUrl.trim(),
        poster_url: v.posterUrl.trim() || null,
        description: v.description.trim(),
        is_primary: v.isPrimary,
      })),
    },
    sales_fields: {
      value_summary: draft.salesFields.valueSummary.trim(),
      differentiators: dedupeStrs(draft.salesFields.differentiators),
      outcomes: dedupeStrs(draft.salesFields.outcomes),
    },
    delivery_fields: {
      implementation_summary: draft.deliveryFields.implementationSummary.trim(),
      prerequisites: dedupeStrs(draft.deliveryFields.prerequisites),
      rollout_steps: dedupeStrs(draft.deliveryFields.rolloutSteps),
    },
    delivery_allowed_roles: dedupeStrs(draft.deliveryAllowedRoles),
    delivery_allowed_users: dedupeStrs(draft.deliveryAllowedUsers),
    content_schema_version: draft.contentSchemaVersion,
    content_blocks: draft.contentBlocks
      .filter(block => block.visible)
      .sort((a, b) => a.order - b.order)
      .map(block => validateBlock(block)),
  };
}

export function parseAssetToDraft(asset: Record<string, unknown>): AssetEditorDraft {
  const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  const record = (v: unknown): Record<string, unknown> => (typeof v === "object" && v !== null && !Array.isArray(v) ? v as Record<string, unknown> : {});
  const sharedFields = record(asset.shared_fields);
  const salesFields = record(asset.sales_fields);
  const deliveryFields = record(asset.delivery_fields);

  return {
    slug: str(asset.slug),
    title: str(asset.title),
    subtitle: str(asset.subtitle),
    shortDescription: str(asset.short_description),
    cloudProviders: strArr(asset.cloud_providers),
    industries: strArr(asset.industries),
    technologies: strArr(asset.technologies),
    assetType: str(asset.asset_type) || INITIAL_DRAFT.assetType,
    status: str(asset.status) || INITIAL_DRAFT.status,
    visibility: str(asset.visibility) || INITIAL_DRAFT.visibility,
    allowedRoles: strArr(asset.allowed_roles),
    allowedUsers: strArr(asset.allowed_users),
    sharedFields: {
      introduction: str(sharedFields.introduction),
      useCases: strArr(sharedFields.use_cases),
      demoVideoUrl: str(sharedFields.demo_video_url),
      liveDemoUrl: str(sharedFields.live_demo_url),
      videos: Array.isArray(sharedFields.videos)
        ? (sharedFields.videos as Array<Record<string, unknown>>).map((v) => ({
            id: typeof v.id === "string" ? v.id : crypto.randomUUID(),
            title: typeof v.title === "string" ? v.title : "",
            videoUrl: typeof v.video_url === "string" ? v.video_url : "",
            posterUrl: typeof v.poster_url === "string" ? v.poster_url : "",
            description: typeof v.description === "string" ? v.description : "",
            isPrimary: Boolean(v.is_primary),
          }))
        : [],
    },
    salesFields: {
      valueSummary: str(salesFields.value_summary),
      differentiators: strArr(salesFields.differentiators),
      outcomes: strArr(salesFields.outcomes),
    },
    deliveryFields: {
      implementationSummary: str(deliveryFields.implementation_summary),
      prerequisites: strArr(deliveryFields.prerequisites),
      rolloutSteps: strArr(deliveryFields.rollout_steps),
    },
    deliveryAllowedRoles: strArr(asset.delivery_allowed_roles),
    deliveryAllowedUsers: strArr(asset.delivery_allowed_users),
    contentSchemaVersion:
      typeof asset.content_schema_version === "number" && Number.isInteger(asset.content_schema_version)
        ? asset.content_schema_version
        : INITIAL_DRAFT.contentSchemaVersion,
    contentBlocks: parseContentBlocks(asset.content_blocks),
  };
}

function parseContentBlocks(raw: unknown): ContentBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const block = item as Record<string, unknown>;
      if (
        block.type !== "text" &&
        block.type !== "stat_card" &&
        block.type !== "image" &&
        block.type !== "code_snippet" &&
        block.type !== "callout"
      ) {
        return null;
      }
      try {
        return validateBlock(item);
      } catch {
        return null;
      }
    })
    .filter((b): b is ContentBlock => b !== null);
}

export async function searchBlocks(
  token: string,
  keyword: string,
  type?: string
): Promise<BlockSearchResult[]> {
  const params = new URLSearchParams();
  params.set("q", keyword);
  if (type) params.set("type", type);
  const res = await fetch(`/api/v1/admin/assets/search-blocks?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export function areDraftsEqual(a: AssetEditorDraft, b: AssetEditorDraft): boolean {
  const keys = Object.keys(INITIAL_DRAFT) as (keyof AssetEditorDraft)[];
  return keys.every((key) => {
    const va = a[key];
    const vb = b[key];
    if (Array.isArray(va) && Array.isArray(vb)) {
      if (va.length !== vb.length) return false;
      if (key === "contentBlocks") {
        return JSON.stringify(va) === JSON.stringify(vb);
      }
      return va.every((item, i) => item === vb[i]);
    }
    if (typeof va === "object" && va !== null && typeof vb === "object" && vb !== null) {
      return JSON.stringify(va) === JSON.stringify(vb);
    }
    return va === vb;
  });
}
