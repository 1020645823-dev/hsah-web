import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  summary?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, summary, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-border/60 pb-7 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2.5">
        {eyebrow ? (
          <p className="text-[11px] font-medium tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {summary ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-[15px] md:leading-7">
              {summary}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
