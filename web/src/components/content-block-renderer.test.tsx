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
});
