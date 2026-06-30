export type AccessRequestStatus = "pending" | "approved" | "rejected";

export type AccessRequest = {
  id: string;
  user_id: string;
  asset_id: string;
  purpose: string;
  role: string | null;
  status: AccessRequestStatus;
  decision_reason: string;
  decided_at: string | null;
  created_at: string;
};

export type AccessRequestPayload = {
  purpose: string;
  role?: string | null;
};
