import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-sans" }),
  JetBrains_Mono: () => ({ variable: "--font-mono" }),
}));

vi.mock("@/components/query-provider", () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("applies product layout classes at the html and body level", () => {
    const tree = RootLayout({
      children: <div>content</div>,
    });

    expect(tree.props.className).toContain("--font-sans");
    expect(tree.props.className).toContain("--font-mono");
    expect(tree.props.className).toContain("h-full");
    expect(tree.props.className).not.toContain("dark");

    const body = tree.props.children;

    expect(body.type).toBe("body");
    expect(body.props.className).toContain("min-h-full");
    expect(body.props.className).toContain("bg-background");
    expect(body.props.className).toContain("text-foreground");
  });
});
