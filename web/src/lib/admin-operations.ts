import { adminRequest } from "@/lib/admin";
import type {
  OperationsOverview,
  OperationsTasks,
  RecentActivities,
} from "@/types/operations";

export function fetchOperationsOverview(token: string) {
  return adminRequest<OperationsOverview>("/api/v1/admin/operations/overview", token, {
    method: "GET",
  });
}

export function fetchOperationsTasks(token: string) {
  return adminRequest<OperationsTasks>("/api/v1/admin/operations/tasks", token, {
    method: "GET",
  });
}

export function fetchRecentActivities(token: string) {
  return adminRequest<RecentActivities>("/api/v1/admin/operations/recent-activities", token, {
    method: "GET",
  });
}
