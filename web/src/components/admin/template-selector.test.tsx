import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { TemplateSelector } from "./template-selector";
import * as adminTemplates from "@/lib/admin-templates";

vi.mock("@/lib/admin-templates", () => ({
  listTemplates: vi.fn(),
}));

describe("TemplateSelector", () => {
  const mockTemplates = [
    {
      id: 1,
      name: "Landing Page",
      description: "A landing page template",
      blocks: [
        { id: "b1", type: "text" as const, order: 0, visible: true, config: { markdown: "Hello" } },
        { id: "b2", type: "image" as const, order: 1, visible: true, config: { url: "", alt: "" } },
      ],
      is_builtin: true,
      created_by: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Blog Post",
      description: null,
      blocks: [
        { id: "b3", type: "text" as const, order: 0, visible: true, config: { markdown: "Title" } },
      ],
      is_builtin: false,
      created_by: 1,
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    cleanup();
    vi.mocked(adminTemplates.listTemplates).mockResolvedValue(mockTemplates);
  });

  it("renders template cards when opened", async () => {
    render(
      <TemplateSelector isOpen={true} onClose={vi.fn()} onApply={vi.fn()} token="token-123" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Landing Page")).toBeInTheDocument();
    });

    expect(screen.getByText("Blog Post")).toBeInTheDocument();
    expect(screen.getByText("A landing page template")).toBeInTheDocument();
    expect(screen.getByText("内置")).toBeInTheDocument();
  });

  it("calls onApply with cloned blocks when apply button is clicked", async () => {
    const onApply = vi.fn();
    render(
      <TemplateSelector isOpen={true} onClose={vi.fn()} onApply={onApply} token="token-123" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Landing Page")).toBeInTheDocument();
    });

    const applyButtons = screen.getAllByText("应用");
    fireEvent.click(applyButtons[0]);

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1);
    });

    const appliedBlocks = onApply.mock.calls[0][0];
    expect(appliedBlocks).toHaveLength(2);
    expect(appliedBlocks[0].id).not.toBe("b1");
    expect(appliedBlocks[0].order).toBe(0);
    expect(appliedBlocks[1].order).toBe(1);
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <TemplateSelector isOpen={true} onClose={onClose} onApply={vi.fn()} token="token-123" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Landing Page")).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows loading state while fetching", () => {
    vi.mocked(adminTemplates.listTemplates).mockImplementation(
      () => new Promise(() => {}),
    );

    render(
      <TemplateSelector isOpen={true} onClose={vi.fn()} onApply={vi.fn()} token="token-123" />,
    );

    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <TemplateSelector isOpen={false} onClose={vi.fn()} onApply={vi.fn()} token="token-123" />,
    );

    expect(container.firstChild).toBeNull();
  });
});
