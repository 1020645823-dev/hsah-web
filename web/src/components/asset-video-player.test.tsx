import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { AssetVideoPlayer } from "./asset-video-player";

const videos = [
  { id: "v1", title: "Overview", videoUrl: "https://example.com/v1.mp4", posterUrl: "https://example.com/poster.jpg", description: "Main walkthrough", isPrimary: true },
  { id: "v2", title: "Deep Dive", videoUrl: "https://example.com/v2.mp4", posterUrl: null, description: "Step by step", isPrimary: false },
];

describe("AssetVideoPlayer", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when videos array is empty", () => {
    const { container } = render(<AssetVideoPlayer videos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the primary video by default", () => {
    const { container } = render(<AssetVideoPlayer videos={videos} />);
    expect(screen.getByRole("heading", { name: "Overview" })).toBeTruthy();
    expect(screen.getAllByText("Main walkthrough").length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to first video when no primary is set", () => {
    const noPrimary = videos.map((v) => ({ ...v, isPrimary: false }));
    render(<AssetVideoPlayer videos={noPrimary} />);
    expect(screen.getByRole("heading", { name: "Overview" })).toBeTruthy();
  });

  it("switches video when a different item is clicked", () => {
    render(<AssetVideoPlayer videos={videos} />);
    const deepDiveButtons = screen.getAllByText("Deep Dive");
    const button = deepDiveButtons.find((el) => el.closest("button"));
    fireEvent.click(button!);
    expect(screen.getByRole("heading", { name: "Deep Dive" })).toBeTruthy();
    expect(screen.getAllByText("Step by step").length).toBeGreaterThanOrEqual(1);
  });

  it("renders video element with correct src", () => {
    const { container } = render(<AssetVideoPlayer videos={videos} />);
    const video = container.querySelector("video");
    expect(video).toBeTruthy();
    expect(video?.getAttribute("src")).toBe("https://example.com/v1.mp4");
  });

  it("renders poster attribute when posterUrl is present", () => {
    const { container } = render(<AssetVideoPlayer videos={videos} />);
    const video = container.querySelector("video");
    expect(video?.getAttribute("poster")).toBe("https://example.com/poster.jpg");
  });
});