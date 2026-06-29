export type Policy = {
  id: string;
  name: string;
  effect: "allow" | "deny";
  permissions: string[];
  role_names: string[];
  resource_type?: string | null;
  resource_visibility?: string | null;
  created_at?: string;
};
