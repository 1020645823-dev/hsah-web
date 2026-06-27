import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@/test-utils";
import "@testing-library/jest-dom/vitest";

import { TemplateManager } from "./template-manager";
import * as adminTemplates from "@/lib/admin-templates";

vi.mock("@/lib/admin-templates", () => ({
  listTemplates: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}));

describe("TemplateManager", () => {
  const mockTemplates = [
    {
      id: 1,
      name: "Built-in Template",
      description: "A built-in template",
      blocks: [
        { id: "b1", type: "text" as const, order: 0, visible: true, config: { markdown: "Hello" } },
      ],
      is_builtin: true,
      created_by: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Custom Template",
      description: "My custom template",
      blocks: [
        { id: "b2", type: "image" as const, order: 0, visible: true, config: { url: "", alt: "" } },
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

  it("renders templates list", async () => {
    render(<TemplateManager token="token-123" />);

    await waitFor(() => {
      expect(screen.getByText("Built-in Template")).toBeInTheDocument();
    });

    expect(screen.getByText("Custom Template")).toBeInTheDocument();
    expect(screen.getByText("Built-in")).toBeInTheDocument();
  });

  it("shows delete confirmation and deletes template", async () => {
    vi.mocked(adminTemplates.deleteTemplate).mockResolvedValue(undefined);
    render(<TemplateManager token="token-123" />);

    await waitFor(() => {
      expect(screen.getByText("Custom Template")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTitle("Confirm delete")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Confirm delete"));

    await waitFor(() => {
      expect(adminTemplates.deleteTemplate).toHaveBeenCalledWith("token-123", 2);
    });
  });

  it("creates template from current blocks", async () => {
    vi.mocked(adminTemplates.createTemplate).mockResolvedValue(mockTemplates[0]);
    const blocks = [
      { id: "b1", type: "text" as const, order: 0, visible: true, config: { markdown: "Hello" } },
    ];

    render(<TemplateManager token="token-123" initialBlocks={blocks} />);

    await waitFor(() => {
      expect(screen.getByText("Built-in Template")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create from current content"));

    await waitFor(() => {
      expect(screen.getByText("Save as template")).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("Template name");
    fireEvent.change(nameInput, { target: { value: "My New Template" } });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(adminTemplates.createTemplate).toHaveBeenCalledWith("token-123", {
        name: "My New Template",
        blocks,
      });
    });
  });

  it("allows editing custom template name", async () => {
    vi.mocked(adminTemplates.updateTemplate).mockResolvedValue(mockTemplates[1]);
    render(<TemplateManager token="token-123" />);

    await waitFor(() => {
      expect(screen.getByText("Custom Template")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle("Edit");
    fireEvent.click(editButtons[0]);

    const nameInput = screen.getByDisplayValue("Custom Template");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(adminTemplates.updateTemplate).toHaveBeenCalledWith("token-123", 2, {
        name: "Updated Name",
        description: "My custom template",
      });
    });
  });
});
