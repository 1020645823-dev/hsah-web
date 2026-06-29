"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { List, LayoutGrid, ArrowUpRight, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

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
  type PublicAssetSummary,
  type PublicCollectionSummary,
} from "@/lib/public-assets";
import { AssetGridSkeleton, AssetListViewSkeleton } from "@/components/skeleton";
import { AssetCollectionRail } from "@/components/public/asset-collection-rail";
import { RecommendedAssetsRail } from "@/components/public/recommended-assets-rail";

type AssetsClientProps = {
  initialResponse: PublicAssetListResponse;
  initialQuery: PublicAssetQuery;
  collections?: PublicCollectionSummary[];
  recommended?: PublicAssetSummary[];
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

type SortOption = { value: AssetFilterState["sort"]; labelKey: "sortTitle" | "sortRecentlyUpdated" };

const SORT_OPTIONS: readonly SortOption[] = [
  { value: "title", labelKey: "sortTitle" },
  { value: "updated_at", labelKey: "sortRecentlyUpdated" },
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

function AssetTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-secondary/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground">
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPublished = status === "published";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
        isPublished
          ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400"
      }`}
    >
      <span
        className={`mr-1.5 inline-block h-1 w-1 rounded-full ${
          isPublished ? "bg-emerald-500 dark:bg-emerald-400" : "bg-amber-500 dark:bg-amber-400"
        }`}
      />
      {status}
    </span>
  );
}

function CloudBadge({ provider }: { provider: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/60">
      {provider.toUpperCase()}
    </span>
  );
}

function TechBadge({ technology }: { technology: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/15 transition-colors hover:bg-primary/12">
      {technology}
    </span>
  );
}

export function AssetsClient({
  initialResponse,
  initialQuery,
  collections = [],
  recommended = [],
}: AssetsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Assets");
  const tCommon = useTranslations("Common");
  const [filters, setFilters] = useState<AssetFilterState>(() => toFilterState(initialQuery));

  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        summary={t("summary")}
        actions={
          <button
            type="button"
            className="inline-flex h-11 items-center rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {t("savedFilters")}
          </button>
        }
      />

      {!hasActiveAssetFilters(filters) && (collections.length > 0 || recommended.length > 0) ? (
        <div className="space-y-10">
          {recommended.length > 0 && <RecommendedAssetsRail assets={recommended} />}
          {collections.length > 0 && <AssetCollectionRail collections={collections} />}
        </div>
      ) : null}

      <FilterToolbar
        resultsLabel={t("results", { count: initialResponse.total })}
        persistentControl={
          <label className="space-y-2 text-sm text-foreground/70">
            <span>{t("searchLabel")}</span>
            <input
              aria-label={t("searchLabel")}
              value={filters.q}
              onChange={(event) => updateField("q", event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-foreground/50 outline-none transition-colors focus:border-primary"
            />
          </label>
        }
        secondaryAction={
          hasActiveAssetFilters(filters) ? (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-lg border border-border px-4 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {tCommon("clearFilters")}
            </button>
          ) : undefined
        }
        primaryAction={
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tCommon("applyFilters")}
          </button>
        }
        extraControls={
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground sm:flex-none">
              <span>{t("sortBy")}</span>
              <select
                aria-label={t("sortBy")}
                value={filters.sort}
                onChange={(event) => changeSort(event.target.value as AssetFilterState["sort"])}
                className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary sm:flex-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <button
                type="button"
                aria-label={t("gridView")}
                onClick={() => changeView("grid")}
                className={`inline-flex size-11 items-center justify-center rounded-md transition-colors sm:size-8 ${
                  filters.view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={t("listView")}
                onClick={() => changeView("list")}
                className={`inline-flex size-11 items-center justify-center rounded-md transition-colors sm:size-8 ${
                  filters.view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      >
        <label className="space-y-2 text-sm text-foreground/70">
          <span>{t("cloud")}</span>
          <select
            aria-label={t("cloud")}
            value={filters.cloud}
            onChange={(event) => updateField("cloud", event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">{tCommon("allClouds")}</option>
            {cloudOptions.map((option) => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-foreground/70">
          <span>{t("industry")}</span>
          <select
            aria-label={t("industry")}
            value={filters.industry}
            onChange={(event) => updateField("industry", event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">{tCommon("allIndustries")}</option>
            {industryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-foreground/70">
          <span>{t("technology")}</span>
          <select
            aria-label={t("technology")}
            value={filters.tech}
            onChange={(event) => updateField("tech", event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">{tCommon("allTechnologies")}</option>
            {techOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-foreground/70">
          <span>{t("assetType")}</span>
          <select
            aria-label={t("assetType")}
            value={filters.assetType}
            onChange={(event) => updateField("assetType", event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">{tCommon("allAssetTypes")}</option>
            {assetTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </FilterToolbar>

      {isLoading ? (
        filters.view === "grid" ? (
          <AssetGridSkeleton count={initialResponse.limit} />
        ) : (
          <AssetListViewSkeleton count={initialResponse.limit} />
        )
      ) : initialResponse.items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <EmptyState
            icon={SearchX}
            title={t("emptyClearTitle")}
            description={t("emptyClearDescription")}
            actions={[
              {
                label: tCommon("clearFilters"),
                onClick: clearFilters,
                variant: "outline",
              },
              {
                label: tCommon("browseAll"),
                onClick: () => router.push("/assets"),
              },
            ]}
          />
        </div>
      ) : filters.view === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {initialResponse.items.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.slug}`}
              className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-border hover:shadow-[var(--shadow-card-hover)] hover:ring-1 hover:ring-primary/10"
            >
              <div className="flex items-start justify-between gap-3">
                <AssetTypeBadge type={asset.asset_type} />
                <StatusBadge status={asset.status} />
              </div>

              <div className="mt-4 flex-1">
                <h3 className="text-lg font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary">
                  {asset.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {asset.short_description}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {asset.cloud_providers.map((provider) => (
                  <CloudBadge key={provider} provider={provider} />
                ))}
                {asset.technologies.slice(0, 2).map((technology) => (
                  <TechBadge key={technology} technology={technology} />
                ))}
                {asset.technologies.length > 2 && (
                  <span className="inline-flex items-center rounded-md bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    +{asset.technologies.length - 2}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <span>{tCommon("viewDetails")}</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
              className="group flex items-center gap-5 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:border-border hover:bg-muted/30 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-card-foreground transition-colors group-hover:text-primary">
                    {asset.title}
                  </h3>
                  <AssetTypeBadge type={asset.asset_type} />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-1">
                  {asset.short_description}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {asset.cloud_providers.map((provider) => (
                    <CloudBadge key={provider} provider={provider} />
                  ))}
                  {asset.technologies.slice(0, 2).map((technology) => (
                    <TechBadge key={technology} technology={technology} />
                  ))}
                  {asset.technologies.length > 2 && (
                    <span className="inline-flex items-center rounded-md bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      +{asset.technologies.length - 2}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={asset.status} />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)]">
        <div className="text-sm text-muted-foreground">
          {t("pageIndicator", { currentPage, totalPages })}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("previousPage")}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-11 rounded-lg border border-border px-4 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {tCommon("previous")}
          </button>
          <button
            type="button"
            aria-label={t("nextPage")}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-11 rounded-lg border border-border px-4 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {tCommon("next")}
          </button>
        </div>
      </div>
    </div>
  );
}
