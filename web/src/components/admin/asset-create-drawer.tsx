"use client";

import { useTranslations } from "next-intl";

import { Sheet } from "@/components/ui/sheet";
import { AssetEditorForm } from "@/components/admin/asset-editor-form";

type AssetCreateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  token: string;
};

export function AssetCreateDrawer({ open, onOpenChange, onCreated, token }: AssetCreateDrawerProps) {
  const t = useTranslations("Admin");

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("newAsset.title")}
      description={t("newAsset.summary")}
    >
      <AssetEditorForm mode="create" token={token} onCreated={onCreated} />
    </Sheet>
  );
}
