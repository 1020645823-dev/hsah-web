import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@/test-utils";
import { AssetVideoManager } from "./asset-video-manager";
import type { AssetVideoDraft } from "@/lib/admin-asset-editor";

afterEach(cleanup);

const baseVideo: AssetVideoDraft = {
  id: "v1",
  title: "Overview",
  videoUrl: "https://example.com/v.mp4",
  posterUrl: "",
  description: "desc",
  isPrimary: true,
};

describe("AssetVideoManager", () => {
  it("renders empty state with add button when no videos", () => {
    const onChange = vi.fn();
    render(<AssetVideoManager videos={[]} onChange={onChange} />);
    expect(screen.getByText(/Add video/)).toBeTruthy();
  });

  it("renders video cards with title and url", () => {
    const onChange = vi.fn();
    render(<AssetVideoManager videos={[baseVideo]} onChange={onChange} />);
    expect(screen.getByDisplayValue("Overview")).toBeTruthy();
    expect(screen.getByDisplayValue("https://example.com/v.mp4")).toBeTruthy();
  });

  it("calls onChange with new video when add is clicked", () => {
    const onChange = vi.fn();
    render(<AssetVideoManager videos={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText(/Add video/));
    expect(onChange).toHaveBeenCalledTimes(1);
    const newVideos = onChange.mock.calls[0][0] as AssetVideoDraft[];
    expect(newVideos).toHaveLength(1);
    expect(newVideos[0].videoUrl).toBe("");
  });

  it("calls onChange without deleted video when remove is clicked", () => {
    const onChange = vi.fn();
    render(<AssetVideoManager videos={[baseVideo]} onChange={onChange} />);
    fireEvent.click(screen.getByText(/Delete/));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("sets primary correctly when set-primary is clicked", () => {
    const video2: AssetVideoDraft = { ...baseVideo, id: "v2", title: "Alt", isPrimary: false };
    const onChange = vi.fn();
    render(
      <AssetVideoManager videos={[baseVideo, video2]} onChange={onChange} />,
    );
    const setPrimaryButtons = screen.getAllByText(/Set as primary/);
    fireEvent.click(setPrimaryButtons[0]);
    const updated = onChange.mock.calls[0][0] as AssetVideoDraft[];
    expect(updated.find((v) => v.id === "v2")?.isPrimary).toBe(true);
    expect(updated.find((v) => v.id === "v1")?.isPrimary).toBe(false);
  });
});
