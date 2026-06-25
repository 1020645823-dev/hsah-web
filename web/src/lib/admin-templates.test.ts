import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from "./admin-templates";

const mockTemplate = {
  id: 1,
  name: "Test Template",
  description: "A test template",
  blocks: [
    {
      id: "block-1",
      type: "text" as const,
      order: 0,
      visible: true,
      config: { markdown: "Hello", html: "<p>Hello</p>" },
    },
  ],
  is_builtin: false,
  created_by: 1,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("admin-templates API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("listTemplates fetches templates", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockTemplate],
    });

    const result = await listTemplates("token-123");
    expect(result).toEqual([mockTemplate]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/templates",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      }),
    );
  });

  it("createTemplate sends POST request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTemplate,
    });

    const data = {
      name: "New Template",
      description: "Desc",
      blocks: mockTemplate.blocks,
    };
    const result = await createTemplate("token-123", data);
    expect(result).toEqual(mockTemplate);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/templates",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(data),
        headers: expect.any(Headers),
      }),
    );
  });

  it("getTemplate fetches single template", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTemplate,
    });

    const result = await getTemplate("token-123", 1);
    expect(result).toEqual(mockTemplate);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/templates/1",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      }),
    );
  });

  it("updateTemplate sends PUT request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTemplate,
    });

    const data = { name: "Updated" };
    const result = await updateTemplate("token-123", 1, data);
    expect(result).toEqual(mockTemplate);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/templates/1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(data),
        headers: expect.any(Headers),
      }),
    );
  });

  it("deleteTemplate sends DELETE request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => null,
    });

    await deleteTemplate("token-123", 1);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/templates/1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.any(Headers),
      }),
    );
  });

  it("throws on error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: "Not found" }),
    });

    await expect(listTemplates("token-123")).rejects.toThrow("Not found");
  });
});
