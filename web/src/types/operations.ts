export type OperationsOverview = {
  total_assets: number;
  published_assets: number;
  reviewing_assets: number;
  low_quality_assets: number;
  pending_access_requests: number;
};

export type OperationsTask = {
  asset_id: string;
  slug: string;
  title: string;
  status: string;
  reason: string;
  priority: "high" | "medium" | "low";
  target_url: string;
};

export type OperationsTasks = {
  items: OperationsTask[];
  total: number;
};

export type RecentActivity = {
  id: string;
  asset_id: string;
  asset_title: string;
  action: string;
  from_status: string | null;
  to_status: string;
  reason: string;
  created_at: string;
};

export type RecentActivities = {
  items: RecentActivity[];
  total: number;
};
