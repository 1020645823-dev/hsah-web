export type Asset = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string;
  cloud_providers: string[];
  industries: string[];
  technologies: string[];
  asset_type: string;
  type?: string;
  status: string;
  visibility: string;
  created_at?: string;
  updated_at?: string;
  content_blocks: Array<Record<string, unknown>>;
  shared_fields: {
    introduction?: string;
    use_cases?: string[];
    demo_video_url?: string | null;
    live_demo_url?: string | null;
    videos?: Array<{
      id: string;
      title: string;
      video_url: string;
      poster_url?: string | null;
      description?: string;
      is_primary?: boolean;
    }>;
  };
  sales_fields: {
    value_summary?: string;
    differentiators?: string[];
    outcomes?: string[];
  };
  delivery_fields: {
    implementation_summary?: string;
    prerequisites?: string[];
    rollout_steps?: string[];
  } | null;
};
