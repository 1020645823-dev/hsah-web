"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  variant?: "default" | "ghost" | "icon";
};

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center",
          variant === "icon" ? "size-9 rounded-lg" : "h-9 rounded-lg px-3",
          className,
        )}
        aria-hidden="true"
      >
        <div className="size-4 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-border/70 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "icon" && "size-9 hover:bg-muted",
        variant === "ghost" && "h-9 px-3 hover:bg-muted text-muted-foreground hover:text-foreground",
        variant === "default" && "h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
      {variant !== "icon" && (
        <span className="text-sm font-medium">{isDark ? "Light" : "Dark"}</span>
      )}
    </button>
  );
}
