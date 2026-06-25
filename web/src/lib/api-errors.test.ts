import { describe, expect, it } from "vitest";

import { parseApiError, isApiErrorResponse } from "./api-errors";

describe("parseApiError", () => {
  it("categorizes 500 as server error with retryable", () => {
    const error = parseApiError({ message: "Internal Server Error" }, 500);
    expect(error.category).toBe("server");
    expect(error.status).toBe(500);
    expect(error.userMessage).toBe("服务器暂时不可用，请稍后重试。");
    expect(error.retryable).toBe(true);
  });

  it("categorizes 401 as auth error without retryable", () => {
    const error = parseApiError({ message: "Unauthorized" }, 401);
    expect(error.category).toBe("auth");
    expect(error.status).toBe(401);
    expect(error.userMessage).toBe("登录已过期，请重新登录。");
    expect(error.retryable).toBe(false);
  });

  it("categorizes 403 as forbidden error without retryable", () => {
    const error = parseApiError({ message: "Forbidden" }, 403);
    expect(error.category).toBe("forbidden");
    expect(error.status).toBe(403);
    expect(error.userMessage).toBe("您没有权限执行此操作。");
    expect(error.retryable).toBe(false);
  });

  it("categorizes 400 as client error without retryable", () => {
    const error = parseApiError({ message: "Bad Request" }, 400);
    expect(error.category).toBe("client");
    expect(error.status).toBe(400);
    expect(error.userMessage).toBe("Bad Request");
    expect(error.retryable).toBe(false);
  });

  it("categorizes network failure (no status) as network error", () => {
    const error = parseApiError(null, undefined);
    expect(error.category).toBe("network");
    expect(error.status).toBeUndefined();
    expect(error.userMessage).toBe("网络连接异常，请检查网络后重试。");
    expect(error.retryable).toBe(true);
  });

  it("extracts nested detail message", () => {
    const error = parseApiError({ detail: { message: "Nested error" } }, 422);
    expect(error.message).toBe("Nested error");
  });

  it("extracts string detail", () => {
    const error = parseApiError({ detail: "Plain detail" }, 422);
    expect(error.message).toBe("Plain detail");
  });

  it("falls back to default for unknown status", () => {
    const error = parseApiError({}, 418);
    expect(error.category).toBe("client");
    expect(error.userMessage).toBe("请求失败（HTTP 418）。");
  });
});

describe("isApiErrorResponse", () => {
  it("returns true for a failure response shape", () => {
    expect(
      isApiErrorResponse({ ok: false, status: 500, data: null, message: "fail" })
    ).toBe(true);
  });

  it("returns false for a success response shape", () => {
    expect(isApiErrorResponse({ ok: true, data: {} })).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isApiErrorResponse(null)).toBe(false);
    expect(isApiErrorResponse("string")).toBe(false);
    expect(isApiErrorResponse(42)).toBe(false);
  });
});
