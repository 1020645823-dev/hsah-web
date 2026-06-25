const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const DEFAULT_PUBLIC_ASSET_LIMIT = 12;
const MAX_PUBLIC_ASSET_LIMIT = 100;

export type PublicAssetQuery = {
  q?: string;
  cloud?: string;
  industry?: string;
  tech?: string;
  assetType?: string;
  limit?: number;
  offset?: number;
  sort?: "title" | "updated_at";
  view?: "grid" | "list";
};

export type PublicAssetSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string;
  cloud_providers: string[];
  industries: string[];
  technologies: string[];
  asset_type: string;
  status: string;
};

export type PublicAssetListResponse = {
  items: PublicAssetSummary[];
  total: number;
  limit: number;
  offset: number;
};

type SearchParamsInput = Record<string, string | string[] | undefined>;

function getFirstSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.find((item) => item.trim() !== "")?.trim();
  }
  return typeof value === "string" ? value.trim() : undefined;
}

function parsePositiveInt(value: string | undefined, fallback: number, min: number, max?: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }
  if (typeof max === "number") {
    return Math.min(parsed, max);
  }
  return parsed;
}

function normalizeText(value: string | undefined) {
  return value && value.trim() !== "" ? value.trim() : undefined;
}

function normalizeQuery(query: PublicAssetQuery): Required<Pick<PublicAssetQuery, "limit" | "offset">> & PublicAssetQuery {
  return {
    q: normalizeText(query.q),
    cloud: normalizeText(query.cloud),
    industry: normalizeText(query.industry),
    tech: normalizeText(query.tech),
    assetType: normalizeText(query.assetType),
    sort: query.sort === "updated_at" ? "updated_at" : "title",
    view: query.view === "list" ? "list" : "grid",
    limit: parsePositiveInt(String(query.limit ?? DEFAULT_PUBLIC_ASSET_LIMIT), DEFAULT_PUBLIC_ASSET_LIMIT, 1, MAX_PUBLIC_ASSET_LIMIT),
    offset: parsePositiveInt(String(query.offset ?? 0), 0, 0),
  };
}

export function parseAssetQueryFromSearchParams(searchParams: SearchParamsInput): PublicAssetQuery {
  return normalizeQuery({
    q: getFirstSearchParamValue(searchParams.q),
    cloud: getFirstSearchParamValue(searchParams.cloud),
    industry: getFirstSearchParamValue(searchParams.industry),
    tech: getFirstSearchParamValue(searchParams.tech),
    assetType: getFirstSearchParamValue(searchParams.asset_type),
    sort: getFirstSearchParamValue(searchParams.sort) as PublicAssetQuery["sort"],
    view: getFirstSearchParamValue(searchParams.view) as PublicAssetQuery["view"],
    limit: parsePositiveInt(getFirstSearchParamValue(searchParams.limit), DEFAULT_PUBLIC_ASSET_LIMIT, 1, MAX_PUBLIC_ASSET_LIMIT),
    offset: parsePositiveInt(getFirstSearchParamValue(searchParams.offset), 0, 0),
  });
}

export function buildAssetSearchQuery(query: PublicAssetQuery) {
  const normalized = normalizeQuery(query);
  const params = new URLSearchParams();

  if (normalized.q) params.set("q", normalized.q);
  if (normalized.cloud) params.set("cloud", normalized.cloud);
  if (normalized.industry) params.set("industry", normalized.industry);
  if (normalized.tech) params.set("tech", normalized.tech);
  if (normalized.assetType) params.set("asset_type", normalized.assetType);
  if (normalized.sort && normalized.sort !== "title") params.set("sort", normalized.sort);
  if (normalized.view && normalized.view !== "grid") params.set("view", normalized.view);
  params.set("limit", String(normalized.limit));
  params.set("offset", String(normalized.offset));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export function getAssetPageFromOffset(offset: number, limit: number) {
  const safeLimit = Math.max(1, limit || DEFAULT_PUBLIC_ASSET_LIMIT);
  const safeOffset = Math.max(0, offset || 0);
  return Math.floor(safeOffset / safeLimit) + 1;
}

export function getAssetOffsetForPage(page: number, limit: number) {
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.max(1, limit || 1);
  return (safePage - 1) * safeLimit;
}

export function getAssetTotalPages(total: number, limit: number) {
  const safeLimit = Math.max(1, limit || DEFAULT_PUBLIC_ASSET_LIMIT);
  return Math.max(1, Math.ceil(Math.max(0, total) / safeLimit));
}

export function hasActiveAssetFilters(query: PublicAssetQuery) {
  const normalized = normalizeQuery(query);
  return Boolean(
    normalized.q ||
      normalized.cloud ||
      normalized.industry ||
      normalized.tech ||
      normalized.assetType,
  );
}

function emptyResponse(query: PublicAssetQuery): PublicAssetListResponse {
  const normalized = normalizeQuery(query);
  return {
    items: [],
    total: 0,
    limit: normalized.limit,
    offset: normalized.offset,
  };
}

function normalizeListResponse(data: unknown, query: PublicAssetQuery): PublicAssetListResponse {
  const normalized = normalizeQuery(query);

  if (Array.isArray(data)) {
    return {
      items: data as PublicAssetSummary[],
      // Old API returns only the current slice. Keep pagination usable until total lands.
      total: normalized.offset + data.length + (data.length === normalized.limit ? 1 : 0),
      limit: normalized.limit,
      offset: normalized.offset,
    };
  }

  if (data && typeof data === "object") {
    const candidate = data as Partial<PublicAssetListResponse>;
    if (Array.isArray(candidate.items)) {
      return {
        items: candidate.items,
        total: typeof candidate.total === "number" ? candidate.total : candidate.items.length,
        limit: typeof candidate.limit === "number" ? candidate.limit : normalized.limit,
        offset: typeof candidate.offset === "number" ? candidate.offset : normalized.offset,
      };
    }
  }

  return emptyResponse(query);
}

export async function fetchPublicAssets(query: PublicAssetQuery): Promise<PublicAssetListResponse> {
  const normalized = normalizeQuery(query);

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets${buildAssetSearchQuery(normalized)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return emptyResponse(normalized);
    }

    const data = (await res.json()) as unknown;
    return normalizeListResponse(data, normalized);
  } catch {
    return emptyResponse(normalized);
  }
}
