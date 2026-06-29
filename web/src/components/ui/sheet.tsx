"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";

/**
 * Sheet — a right-side drawer built on Base UI Dialog.
 *
 * The popup is pinned to the right edge of the viewport. Use the `open` /
 * `onOpenChange` props on the exported `Sheet` wrapper.
 */

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      modal
      // Keep body scroll locked while open, but allow the drawer itself to scroll.
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl outline-none",
            "translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
            "[@media_(prefers-reduced-motion:reduce)]:transition-none",
            className,
          )}
        >
          {(title || description) && (
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
              <div className="space-y-1">
                {title && (
                  <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-foreground">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="text-sm text-muted-foreground">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { DialogPrimitive as Dialog };
