import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  PublicDetailHero,
  PublicProseSection,
  PublicRelatedLinks,
  PublicSiteShell,
} from "@/components/public-site-shell";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Community" });

  const item = t.raw(`items.${slug}`) as Record<string, unknown> | undefined;
  if (!item) {
    notFound();
  }

  const agenda = (item.agenda as { title: string; description: string }[]) || [];
  const resources = (item.resources as { label: string; href: string }[]) || [];

  return (
    <PublicSiteShell ctaHref="/about" ctaLabel={t("readInsights")}>
      <div className="space-y-8">
        <PublicDetailHero
          backHref="/community"
          backLabel={t("allPrograms")}
          eyebrow={(item.format as string).toUpperCase()}
          title={item.title as string}
          summary={item.summary as string}
          meta={[
            item.audience as string,
            `${item.dateLabel} · ${item.location}`,
          ]}
        />

        <PublicProseSection
          title={t("agenda")}
          items={agenda}
        />

        {resources.length > 0 && (
          <PublicRelatedLinks
            title={t("resources")}
            links={resources.map((r) => ({
              href: r.href,
              label: r.label,
            }))}
          />
        )}
      </div>
    </PublicSiteShell>
  );
}
