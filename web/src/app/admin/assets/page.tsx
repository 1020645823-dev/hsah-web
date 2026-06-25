"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  archiveAsset,
  adminPaginatedRequest,
  adminRequest,
  batchDeleteAssets,
  extractPaginatedPayload,
  extractArrayPayload,
  getStoredAdminToken,
  isAdminRecord,
  publishAsset,
  restoreAsset,
  unpublishAsset,
} from "@/lib/admin";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination } from "@/components/admin/pagination";
import { BatchActionBar } from "@/components/admin/batch-action-bar";
import { Skeleton } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/product/page-header";
import { Package } from "lucide-react";

type AssetRow = {
  id: string;
  slug: string;
  title: string;
  asset_type: string;
  status: string;
  visibility: string;
  cloud_providers: string[];
};

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    draft: "bg-gray-500/10 text-gray-400",
    published: "bg-green-500/10 text-green-400",
    archived: "bg-amber-500/10 text-amber-400",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
};

export default function AdminAssetsPage() {
  const [token] = useState<string | null>(() => getStoredAdminToken());
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<AssetRow | null>(null);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const fetchAssets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await adminPaginatedRequest<AssetRow>(
        "/api/v1/admin/assets",
        token,
        { limit: pageSize, offset },
      );
      if (!result.ok) {
        setMessage({ type: "error", text: result.message });
        setRows([]);
        setTotal(0);
      } else {
        const paginated = extractPaginatedPayload<AssetRow>(result.data);
        if (paginated) {
          setRows(paginated.items);
          setTotal(paginated.total);
        } else {
          const fallback = extractArrayPayload(result.data, ["assets"]) as AssetRow[];
          setRows(fallback);
          setTotal(fallback.length);
        }
        setMessage(null);
      }
    } catch {
      setMessage({ type: "error", text: "获取资产列表失败，请检查网络连接。" });
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, pageSize, offset]);

  const didInitRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (didInitRef.current) return;
    didInitRef.current = true;
    fetchAssets();
  }, [token, fetchAssets]);

  useEffect(() => {
    if (!didInitRef.current) return;
    fetchAssets();
  }, [page, pageSize, fetchAssets]);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (prev.size === rows.length) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function openDelete(asset: AssetRow) {
    setDeletingAsset(asset);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!token || !deletingAsset) return;
    const res = await adminRequest(`/api/v1/admin/assets/${deletingAsset.id}`, token, { method: "DELETE" });
    if (!res.ok) {
      showMessage("error", res.message);
    } else {
      await fetchAssets();
      showMessage("success", "资产已删除");
    }
    setConfirmOpen(false);
    setDeletingAsset(null);
  }

  async function handleBatchDelete() {
    if (!token || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const result = await batchDeleteAssets(token, ids);
    if (!result.ok) {
      showMessage("error", result.message);
      return;
    }

    const { deleted, failed } = result.data;
    setSelectedIds(new Set());
    setBatchConfirmOpen(false);
    await fetchAssets();
    showMessage(
      failed.length > 0 ? "error" : "success",
      failed.length > 0 ? `已删除 ${deleted} 个资产，${failed.length} 个失败` : `已删除 ${deleted} 个资产`,
    );
  }

  async function handleStatusAction(
    assetId: string,
    action: "publish" | "archive" | "unpublish" | "restore",
  ) {
    if (!token) return;

    const actionMap = {
      publish: publishAsset,
      archive: archiveAsset,
      unpublish: unpublishAsset,
      restore: restoreAsset,
    } as const;
    const result = await actionMap[action](token, assetId);

    if (!result.ok) {
      if (
        action === "publish" &&
        result.status === 422 &&
        isAdminRecord(result.data) &&
        isAdminRecord(result.data.detail)
      ) {
        const fields = Array.isArray(result.data.detail.fields)
          ? result.data.detail.fields.filter((field): field is string => typeof field === "string").join("、")
          : "";
        showMessage("error", fields ? `发布失败，请完善：${fields}` : "发布失败，请先完善必填内容。");
      } else {
        showMessage("error", result.message);
      }
      return;
    }

    const successMessages = {
      publish: "资产已发布",
      archive: "资产已归档",
      unpublish: "资产已转为草稿",
      restore: "资产已恢复为草稿",
    } as const;
    await fetchAssets();
    showMessage("success", successMessages[action]);
  }

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < rows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ADMIN / ASSETS"
        title="Assets"
        summary="Manage discovery, publication, and lifecycle for reusable platform assets."
        actions={
          <Link
            href="/admin/assets/new"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            New asset
          </Link>
        }
      />

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-500"
              : "border-red-500/30 bg-red-500/10 text-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[800px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[40px_1fr_120px_120px_120px_140px_100px] gap-4 border-b border-border px-5 py-3 text-xs font-medium tracking-[0.12em] text-muted-foreground">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={toggleSelectAll}
                className="h-4 w-4 cursor-pointer accent-[var(--color-electric-purple)]"
              />
            </div>
            <div>Title</div>
            <div>Type</div>
            <div>Status</div>
            <div>Visibility</div>
            <div>Cloud</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-border/70">
            {loading ? (
              <Skeleton variant="table-row" count={4} className="px-5 py-8" />
            ) : (
              rows.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-[40px_1fr_120px_120px_120px_140px_100px] items-center gap-4 px-5 py-4 text-sm text-foreground transition-colors duration-150 hover:bg-muted/30"
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      className="h-4 w-4 cursor-pointer accent-[var(--color-electric-purple)]"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate">{a.title}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{a.slug}</div>
                  </div>
                  <div className="text-muted-foreground">{a.asset_type}</div>
                  <div>{getStatusBadge(a.status)}</div>
                  <div className="text-muted-foreground">{a.visibility}</div>
                  <div className="text-muted-foreground">
                    {a.cloud_providers.map((c) => c.toUpperCase()).join(" / ")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/assets/${a.id}/edit`}
                      className="text-sm text-[var(--color-electric-purple)] hover:underline"
                    >
                      Edit
                    </Link>
                    {a.status === "draft" ? (
                      <button
                        onClick={() => handleStatusAction(a.id, "publish")}
                        className="text-sm text-green-400 hover:underline"
                      >
                        Publish
                      </button>
                    ) : null}
                    {a.status === "published" ? (
                      <button
                        onClick={() => handleStatusAction(a.id, "unpublish")}
                        className="text-sm text-amber-300 hover:underline"
                      >
                        Unpublish
                      </button>
                    ) : null}
                    {a.status === "archived" ? (
                      <button
                        onClick={() => handleStatusAction(a.id, "restore")}
                        className="text-sm text-blue-300 hover:underline"
                      >
                        Restore
                      </button>
                    ) : null}
                    {a.status !== "archived" ? (
                      <button
                        onClick={() => handleStatusAction(a.id, "archive")}
                        className="text-sm text-amber-300 hover:underline"
                      >
                        Archive
                      </button>
                    ) : null}
                    <button
                      onClick={() => openDelete(a)}
                      className="text-sm text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
            {!loading && rows.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No assets found"
                description="Get started by creating a new asset."
              />
            ) : null}
          </div>
          <div className="border-t border-border/70">
            <Pagination
              total={total}
              pageSize={pageSize}
              currentPage={page}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="确认删除"
        message={deletingAsset ? `确定要删除资产 "${deletingAsset.title}" 吗？此操作不可撤销。` : "确定要删除此资产吗？"}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeletingAsset(null);
        }}
      />

      <ConfirmDialog
        isOpen={batchConfirmOpen}
        title="确认批量删除"
        message={`确定要删除选中的 ${selectedIds.size} 个资产吗？此操作不可撤销。`}
        onConfirm={handleBatchDelete}
        onCancel={() => {
          setBatchConfirmOpen(false);
        }}
      />

      <BatchActionBar
        selectedCount={selectedIds.size}
        onDelete={() => setBatchConfirmOpen(true)}
        onClear={clearSelection}
      />
    </div>
  );
}
