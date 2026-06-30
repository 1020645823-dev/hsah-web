export type Role = {
  id: string;
  name: string;
  description?: string | null;
  user_ids: string[];
  created_at?: string;
};
