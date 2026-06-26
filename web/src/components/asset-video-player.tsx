"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type VideoItem = {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl?: string | null;
  description?: string;
  isPrimary?: boolean;
};

type AssetVideoPlayerProps = {
  videos: VideoItem[];
};

export function AssetVideoPlayer({ videos }: AssetVideoPlayerProps) {
  const resolved = videos.length > 0 ? videos : [];
  const defaultIndex = Math.max(
    0,
    resolved.findIndex((v) => v.isPrimary),
  );
  const [activeIndex, setActiveIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);

  if (resolved.length === 0) return null;

  const active = resolved[activeIndex];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="space-y-5">
        <div>
          <div className="text-xs font-medium tracking-[0.14em] text-primary uppercase">Demo video</div>
          <h3 className="mt-2 text-xl font-semibold text-foreground">{active.title}</h3>
          {active.description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{active.description}</p>
          ) : null}
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
          <video
            key={active.id}
            src={active.videoUrl}
            poster={active.posterUrl ?? undefined}
            controls
            preload="metadata"
            className="size-full object-contain"
          />
        </div>

        {resolved.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">All videos</h4>
            <div className="flex flex-col gap-2">
              {resolved.map((video, index) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                    index === activeIndex
                      ? "border-primary bg-primary/8 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Play
                    className={cn(
                      "size-4 shrink-0",
                      index === activeIndex ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{video.title}</div>
                    {video.description ? (
                      <div className="text-xs text-muted-foreground truncate">{video.description}</div>
                    ) : null}
                  </div>
                  {video.isPrimary && (
                    <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary uppercase">
                      Primary
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}