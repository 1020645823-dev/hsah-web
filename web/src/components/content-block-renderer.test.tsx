import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createElement, type ComponentPropsWithoutRef } from "react";
import { ContentBlockRenderer } from "./content-block-renderer";

type MockNextImageProps = ComponentPropsWithoutRef<"img"> & {
  src: string;
  alt?: string;
  unoptimized?: boolean;
};

vi.mock("next/image", () => {
  return {
    default: (props: MockNextImageProps) => {
      const imageProps = {
        ...props,
        alt: props.alt ?? "",
      };
      delete imageProps.unoptimized;

      return createElement("img", imageProps);
    },
  };
});

describe("ContentBlockRenderer (phase9 schema)", () => {
  it("renders stat_card using stats", () => {
    render(
      <ContentBlockRenderer
        blocks={[
          {
            id: "stat-1",
            type: "stat_card",
            version: 2,
            order: 0,
            visible: true,
            config: {
              title: "Key Metrics",
              stats: [{ label: "ROI", value: "28%", description: "" }],
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("28%")).toBeInTheDocument();
    expect(screen.getByText("ROI")).toBeInTheDocument();
  });

  it("renders image using src", () => {
    render(
      <ContentBlockRenderer
        blocks={[
          {
            id: "img-1",
            type: "image",
            version: 2,
            order: 0,
            visible: true,
            config: {
              src: "https://example.com/image.png",
              alt: "Example image",
              caption: "Caption",
            },
          },
        ]}
      />,
    );

    expect(screen.getByAltText("Example image")).toBeInTheDocument();
    expect(screen.getByText("Caption")).toBeInTheDocument();
  });

  it("renders image block safely when alt is missing", () => {
    render(
      <ContentBlockRenderer
        blocks={[
          {
            id: "img-2",
            type: "image",
            version: 2,
            order: 0,
            visible: true,
            config: {
              src: "https://example.com/fallback.png",
              caption: "Fallback caption",
            },
          },
        ]}
      />,
    );

    expect(screen.getByRole("presentation")).toBeInTheDocument();
    expect(screen.getByText("Fallback caption")).toBeInTheDocument();
  });

  it("renders callout using tone", () => {
    render(
      <ContentBlockRenderer
        blocks={[
          {
            id: "callout-1",
            type: "callout",
            version: 2,
            order: 0,
            visible: true,
            config: {
              tone: "success",
              title: "Heads up",
              content: "Important info",
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("Heads up")).toBeInTheDocument();
    expect(screen.getByText("Important info")).toBeInTheDocument();
  });

  it("renders code snippet filename and respects line numbers flag", () => {
    render(
      <ContentBlockRenderer
        blocks={[
          {
            id: "code-1",
            type: "code_snippet",
            version: 2,
            order: 0,
            visible: true,
            config: {
              language: "python",
              filename: "demo.py",
              code: "print('hi')",
              showLineNumbers: false,
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("demo.py")).toBeInTheDocument();
    expect(screen.getByText("python")).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("shows shared and sales blocks in sales mode only", () => {
    render(
      <ContentBlockRenderer
        mode="sales"
        blocks={[
          {
            id: "shared-1",
            type: "text",
            version: 2,
            order: 0,
            visible: true,
            audience: "shared",
            config: {
              markdown: "",
              html: "<p>Shared narrative</p>",
            },
          },
          {
            id: "sales-1",
            type: "text",
            version: 2,
            order: 1,
            visible: true,
            audience: "sales",
            config: {
              markdown: "",
              html: "<p>Sales storyline</p>",
            },
          },
          {
            id: "delivery-1",
            type: "text",
            version: 2,
            order: 2,
            visible: true,
            audience: "delivery",
            config: {
              markdown: "",
              html: "<p>Delivery runbook</p>",
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("Shared narrative")).toBeInTheDocument();
    expect(screen.getByText("Sales storyline")).toBeInTheDocument();
    expect(screen.queryByText("Delivery runbook")).not.toBeInTheDocument();
  });

  it("shows shared and delivery blocks in delivery mode only", () => {
    render(
      <ContentBlockRenderer
        mode="delivery"
        blocks={[
          {
            id: "legacy-1",
            type: "text",
            version: 2,
            order: 0,
            visible: true,
            config: {
              markdown: "",
              html: "<p>Legacy public block</p>",
            },
          },
          {
            id: "shared-2",
            type: "text",
            version: 2,
            order: 1,
            visible: true,
            audience: "shared",
            config: {
              markdown: "",
              html: "<p>Shared implementation notes</p>",
            },
          },
          {
            id: "sales-2",
            type: "text",
            version: 2,
            order: 2,
            visible: true,
            audience: "sales",
            config: {
              markdown: "",
              html: "<p>Sales value points</p>",
            },
          },
          {
            id: "delivery-2",
            type: "text",
            version: 2,
            order: 3,
            visible: true,
            audience: "delivery",
            config: {
              markdown: "",
              html: "<p>Delivery checklist</p>",
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("Shared implementation notes")).toBeInTheDocument();
    expect(screen.getByText("Delivery checklist")).toBeInTheDocument();
    expect(screen.queryByText("Legacy public block")).not.toBeInTheDocument();
    expect(screen.queryByText("Sales value points")).not.toBeInTheDocument();
  });
});
