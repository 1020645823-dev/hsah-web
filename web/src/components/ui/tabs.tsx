"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

/**
 * Tabs — thin wrapper over Base UI Tabs.
 * Controlled via `value` / `onValueChange`, or uncontrolled via `defaultValue`.
 */

export function Tabs(props: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root {...props} />;
}

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border/70 bg-muted/60 p-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors outline-none",
        "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
        "data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function TabsPanel({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Panel>) {
  return (
    <TabsPrimitive.Panel
      className={cn("mt-6 outline-none focus-visible:ring-2 focus-visible:ring-ring/50", className)}
      {...props}
    />
  );
}
