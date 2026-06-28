export type ApiErrorCategory = "network" | "server" | "auth" | "forbidden" | "client" | "unknown";

export interface ApiErrorInfo {
  category: ApiErrorCategory;
  status?: number;
  message: string;
  userMessage: string;
  iconName: string;
  retryable: boolean;
}

function categorizeError(status?: number): ApiErrorCategory {
  if (status === undefined || status === 0) return "network";
  if (status >= 500) return "server";
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status >= 400 && status < 500) return "client";
  return "unknown";
}

function pickMessage(data: unknown, status?: number): string {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const direct =
      typeof record.message === "string" && record.message.trim()
        ? record.message.trim()
        : undefined;
    if (direct) return direct;

    if (record.detail && typeof record.detail === "object") {
      const detail = record.detail as Record<string, unknown>;
      const nested =
        typeof detail.message === "string" && detail.message.trim()
          ? detail.message.trim()
          : undefined;
      if (nested) return nested;
    }

    if (typeof record.detail === "string" && record.detail.trim()) {
      return record.detail.trim();
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }
  }
  if (typeof data === "string" && data.trim()) return data.trim();
  if (status === 401) return "登录已失效，请重新登录后重试。";
  if (status === 403) return "当前账号没有访问该管理能力的权限。";
  if (status && status >= 500) return `服务器内部错误（HTTP ${status}）。`;
  if (status) return `请求失败（HTTP ${status}）。`;
  return "网络请求失败，请检查网络连接后重试。";
}

export function parseApiError(data: unknown, status?: number): ApiErrorInfo {
  const category = categorizeError(status);
  const message = pickMessage(data, status);

  const map: Record<ApiErrorCategory, { userMessage: string; iconName: string; retryable: boolean }> = {
    network: {
      userMessage: "网络连接异常，请检查网络后重试。",
      iconName: "wifi-off",
      retryable: true,
    },
    server: {
      userMessage: "服务器暂时不可用，请稍后重试。",
      iconName: "alert-triangle",
      retryable: true,
    },
    auth: {
      userMessage: "登录已过期，请重新登录。",
      iconName: "lock",
      retryable: false,
    },
    forbidden: {
      userMessage: "您没有权限执行此操作。",
      iconName: "shield-alert",
      retryable: false,
    },
    client: {
      userMessage: message,
      iconName: "alert-triangle",
      retryable: false,
    },
    unknown: {
      userMessage: "发生未知错误，请稍后重试。",
      iconName: "alert-triangle",
      retryable: true,
    },
  };

  const mapped = map[category];

  return {
    category,
    status,
    message,
    userMessage: category === "client" ? message : mapped.userMessage,
    iconName: mapped.iconName,
    retryable: mapped.retryable,
  };
}

export function isApiErrorResponse(value: unknown): value is { ok: false; status: number; data: unknown; message: string } {
  return (
    value !== null &&
    typeof value === "object" &&
    "ok" in value &&
    value.ok === false &&
    "status" in value &&
    typeof (value as Record<string, unknown>).status === "number" &&
    "data" in value
  );
}
