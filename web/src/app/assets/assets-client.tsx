"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Blocks, List, LayoutGrid } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { FilterToolbar } from "@/components/product/filter-toolbar";
import { PageHeader } from "@/components/product/page-header";
import {
  DEFAULT_PUBLIC_ASSET_LIMIT,
  buildAssetSearchQuery,
  getAssetOffsetForPage,
  getAssetPageFromOffset,
  getAssetTotalPages,
  hasActiveAssetFilters,
  type PublicAssetListResponse,
  type PublicAssetQuery,
} from "@/lib/public-assets";

type AssetsClientProps = {
  initialResponse: PublicAssetListResponse;
  initialQuery: PublicAssetQuery;
};

type AssetFilterState = {
  q: string;
  cloud: string;
  industry: string;
  tech: string;
  assetType: string;
  limit: number;
  offset: number;
  sort: "title" | "updated_at";
  view: "grid" | "list";
};

type SortOption = { value: AssetFilterState["sort"]; label: string };

const SORT_OPTIONS: readonly SortOption[] = [
  { value: "title", label: "Title" },
  { value: "updated_at", label: "Recently updated" },
];

function toFilterState(query: PublicAssetQuery): AssetFilterState {
  return {
    q: query.q ?? "",
    cloud: query.cloud ?? "",
    industry: query.industry ?? "",
    tech: query.tech ?? "",
    assetType: query.assetType ?? "",
    limit: query.limit ?? DEFAULT_PUBLIC_ASSET_LIMIT,
    offset: query.offset ?? 0,
    sort: (query.sort as AssetFilterState["sort"]) ?? "title",
    view: (query.view as AssetFilterState["view"]) ?? "grid",
  };
}

function uniqueOptions(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function toQuery(state: AssetFilterState): PublicAssetQuery {
  return {
    q: state.q,
    cloud: state.cloud,
    industry: state.industry,
    tech: state.tech,
    assetType: state.assetType,
    limit: state.limit,
    offset: state.offset,
    sort: state.sort,
    view: state.view,
  };
}

export function AssetsClient({ initialResponse, initialQuery }: AssetsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<AssetFilterState>(() => toFilterState(initialQuery));

  const totalPages = getAssetTotalPages(initialResponse.total, initialResponse.limit);
  const currentPage = getAssetPageFromOffset(initialResponse.offset, initialResponse.limit);

  const cloudOptions = useMemo(
    () =>
      uniqueOptions([
        ...initialResponse.items.flatMap((item) => item.cloud_providers),
        filters.cloud,
      ]),
    [filters.cloud, initialResponse.items],
  );
  const industryOptions = useMemo(
    () =>
      uniqueOptions([
        ...initialResponse.items.flatMap((item) => item.industries),
        filters.industry,
      ]),
    [filters.industry, initialResponse.items],
  );
  const techOptions = useMemo(
    () =>
      uniqueOptions([
        ...initialResponse.items.flatMap((item) => item.technologies),
        filters.tech,
      ]),
    [filters.tech, initialResponse.items],
  );
  const assetTypeOptions = useMemo(
    () =>
      uniqueOptions([
        ...initialResponse.items.map((item) => item.asset_type),
        filters.assetType,
      ]),
    [filters.assetType, initialResponse.items],
  );

  function navigate(nextState: AssetFilterState) {
    router.push(`${pathname}${buildAssetSearchQuery(toQuery(nextState))}`);
  }

  function updateField<Key extends keyof AssetFilterState>(key: Key, value: AssetFilterState[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters() {
    navigate({ ...filters, offset: 0 });
  }

  function clearFilters() {
    const cleared = {
      q: "",
      cloud: "",
      industry: "",
      tech: "",
      assetType: "",
      limit: filters.limit,
      offset: 0,
      sort: filters.sort,
      view: filters.view,
    };
    setFilters(cleared);
    navigate(cleared);
  }

  function goToPage(page: number) {
    navigate({
      ...filters,
      limit: initialResponse.limit,
      offset: getAssetOffsetForPage(page, initialResponse.limit),
    });
  }

  function changeView(nextView: AssetFilterState["view"]) {
    const nextState = { ...filters, view: nextView };
    setFilters(nextState);
    navigate(nextState);
  }

  function changeSort(nextSort: AssetFilterState["sort"]) {
    const nextState = { ...filters, sort: nextSort };
    setFilters(nextState);
    navigate(nextState);
  }

  const showViewToggle = initialResponse.items.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ASSET LIBRARY"
        title="Asset Library"
        summary="Search reusable demos, architectures, and implementation references."
        actions={
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Saved filters
          </button>
        }
      />

      <FilterToolbar
        resultsLabel={`${initialResponse.total} results`}
        secondaryAction={
          hasActiveAssetFilters(filters) ? (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-lg border border-border px-4 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Clear filters
            </button>
          ) : undefined
        }
        primaryAction={
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Apply filters
          </button>
        }
        extraControls={
          showViewToggle ? (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Sort by</span>
                <select
                  aria-label="Sort by"
                  value={filters.sort}
                  onChange={(event) => changeSort(event.target.value as AssetFilterState["sort"])}
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                <button
                  type="button"
                  aria-label="Grid view"
                  onClick={() => changeView("grid")}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    filters.view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  onClick={() => changeView("list")}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    filters.view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        <label className="space-y-2 text-sm text-foreground/70">
          <span>Search assets</span>
          <input
            aria-label="Search assets"
            value={filters.q}
            onChange={(event) => updateField("q", event.target.value)}
            placeholder="Search by title or description"
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-foreground/50 outline-none transition-colors focus:border-primary"
          />
        </label>

        <label className="space-y-2 text-sm text-foreground/70">
          <span>Cloud</span>
          <select
            aria-label="Cloud"
            value={filters.cloud}
            onChange={(event) => updateField("cloud", event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">All clouds</option>
            {cloudOptions.map((option) => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-foreground/70">
          <span>Industry</span>
          <select
            aria-label="Industry"
            value={filters.industry}
            onChange={(event) => updateField("industry", event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">All industries</option>
            {industryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-foreground/70">
          <span>Technology</span>
          <select
            aria-label="Technology"
            value={filters.tech}
            onChange={(event) => updateField("tech", event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">All technologies</option>
            {techOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-foreground/70">
          <span>Asset type</span>
          <select
            aria-label="Asset type"
            value={filters.assetType}
            onChange={(event) => updateField("assetType", event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">All asset types</option>
            {assetTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </FilterToolbar>

      {initialResponse.items.length === 0 ? (
        <div className="rounded-[28px] border border-border bg-card shadow-[var(--shadow-card)]">
          <EmptyState
            icon={Blocks}
            title="No assets matched the current filters."
            description="Clear the active filters or return to featured assets."
          />
        </div>
      ) : filters.view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {initialResponse.items.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.slug}`}
              className="group rounded-[26px] border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/72%)] p-6 shadow-[var(--shadow-card)] transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs tracking-[0.16em] text-[var(--color-text-tertiary)]">
                  {asset.asset_type.toUpperCase()}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">{asset.status.toUpperCase()}</div>
              </div>
              <div className="mt-5">
                <div className="text-xl font-semibold text-[var(--color-text-primary)] transition-colors group-hover:text-white">
                  {asset.title}
                </div>
                <div className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {asset.short_description}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {asset.cloud_providers.map((provider) => (
                  <span
                    key={provider}
                    className="rounded-full border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/4%)] px-2.5 py-1 text-xs text-[var(--color-periwinkle)]"
                  >
                    {provider.toUpperCase()}
                  </span>
                ))}
                {asset.technologies.slice(0, 2).map((technology) => (
                  <span
                    key={technology}
                    className="rounded-full border border-[rgb(123_63_242_/35%)] bg-[rgb(123_63_242_/12%)] px-2.5 py-1 text-xs text-[var(--color-periwinkle)]"
                  >
                    {technology}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {initialResponse.items.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.slug}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/72%)] px-5 py-4 shadow-[var(--shadow-card)] transition-colors hover:bg-white/5"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">{asset.title}</div>
                <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{asset.short_description}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-[var(--color-text-tertiary)]">{asset.asset_type.toUpperCase()}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{asset.status.toUpperCase()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[rgb(212_218_245_/12%)] bg-[rgb(18_18_26_/72%)] px-5 py-4 shadow-[var(--shadow-card)] backdrop-blur-[24px]">
        <div className="text-sm text-[var(--color-text-secondary)]">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-10 rounded-full border border-[rgb(212_218_245_/12%)] px-4 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            aria-label="Next page"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-10 rounded-full border border-[rgb(212_218_245_/12%)] px-4 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
