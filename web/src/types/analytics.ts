export type AnalyticsOverview = {
  content: {
    total_assets: number;
    published_assets: number;
    reviewing_assets: number;
    low_quality_assets: number;
  };
  experience: {
    views: number;
    favorites: number;
    feedback: number;
    access_requests: number;
  };
  workflow: {
    review_records: number;
    rejects: number;
    approved_requests: number;
    rejected_requests: number;
  };
  quality: {
    average_score: number;
    low_quality_assets: number;
  };
  governance: {
    pending_access_requests: number;
    total_access_requests: number;
  };
};

export type AuditLog = {
  id: string;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
};
