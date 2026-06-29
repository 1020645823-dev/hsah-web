"use client";

import { useTranslations } from "next-intl";
import type { MatrixCell } from "@/lib/admin-permission-matrix";

type PermissionMatrixTableProps = {
  roleNames: string[];
  permissionKeys: string[];
  cells: Record<string, Record<string, MatrixCell>>;
  selectedKey: string | null;
  onSelect: (permission: string, roleName: string) => void;
};

function getCellTone(decision: MatrixCell["decision"], selected: boolean) {
  if (decision === "deny") {
    return selected
      ? "border-red-400/80 bg-red-500/20 text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.35)]"
      : "border-red-500/25 bg-red-500/10 text-red-200 hover:border-red-400/45";
  }

  if (decision === "allow") {
    return selected
      ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-50 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/45";
  }

  return selected
    ? "border-[rgb(167_139_250_/70%)] bg-[rgb(123_63_242_/20%)] text-[var(--color-text-primary)] shadow-[0_0_0_1px_rgba(167,139,250,0.3)]"
    : "border-border bg-input/35 text-[var(--color-text-secondary)] hover:border-[rgb(123_63_242_/35%)]";
}

function getDecisionLabel(decision: MatrixCell["decision"], t: (key: string) => string) {
  if (decision === "deny") return t("permissionMatrix.deny");
  if (decision === "allow") return t("permissionMatrix.allow");
  return t("permissionMatrix.implicit");
}

export function PermissionMatrixTable({
  roleNames,
  permissionKeys,
  cells,
  selectedKey,
  onSelect,
}: PermissionMatrixTableProps) {
  const t = useTranslations("Admin");

  if (permissionKeys.length === 0 || roleNames.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-black/10 px-4 py-8 text-sm text-[var(--color-text-secondary)]">
        {t("permissionMatrix.emptyFilter")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-border/80 bg-black/10">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 min-w-[220px] border-b border-border/80 bg-card px-4 py-3 text-left text-xs tracking-[0.14em] text-[var(--color-text-tertiary)] backdrop-blur">
              {t("permissionMatrix.permissionHeader")}
            </th>
            {roleNames.map((roleName) => (
              <th
                key={roleName}
                className="min-w-[148px] border-b border-border/80 bg-muted px-3 py-3 text-center text-xs tracking-[0.14em] text-[var(--color-text-tertiary)] backdrop-blur"
              >
                {roleName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissionKeys.map((permissionKey) => (
            <tr key={permissionKey}>
              <th className="sticky left-0 z-10 border-b border-border/70 bg-card px-4 py-3 text-left align-middle backdrop-blur">
                <div className="text-sm font-medium text-[var(--color-text-primary)]">{permissionKey}</div>
              </th>
              {roleNames.map((roleName) => {
                const cell = cells[permissionKey]?.[roleName];
                if (!cell) {
                  return (
                    <td
                      key={`${permissionKey}:${roleName}`}
                      className="border-b border-border/70 px-3 py-3"
                    />
                  );
                }

                const compositeKey = `${permissionKey}::${roleName}`;
                const selected = compositeKey === selectedKey;

                return (
                  <td
                    key={`${permissionKey}:${roleName}`}
                    className="border-b border-border/70 px-3 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(permissionKey, roleName)}
                      className={`flex w-full flex-col items-center justify-center rounded-2xl border px-3 py-3 text-center text-xs transition-colors ${getCellTone(cell.decision, selected)}`}
                    >
                      <span className="font-medium tracking-[0.08em] uppercase">
                        {getDecisionLabel(cell.decision, t)}
                      </span>
                      <span className="mt-1 text-[11px] opacity-80">
                        {cell.matchedPolicies.length > 0
                          ? t("permissionMatrix.policiesCount", { count: cell.matchedPolicies.length })
                          : t("permissionMatrix.noPolicy")}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
