export type Metric = {
  label: string;
  value: string;
};

export type NarrativeStep = {
  title: string;
  description: string;
};

export type LinkItem = {
  label: string;
  href: string;
};

export type HomepageContentLane = {
  href: string;
  title: string;
  summary: string;
  audience: string;
};

export type HomepageFeaturedAsset = {
  href: string;
  title: string;
  summary: string;
  eyebrow: string;
  audience: string;
  tags: string[];
};

export type ScenarioItem = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  industry: string;
  businessOutcome: string;
  tags: string[];
  metrics: Metric[];
  phases: NarrativeStep[];
  relatedArchitectureSlugs: string[];
};

export type ArchitectureItem = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  focus: string;
  tags: string[];
  layers: NarrativeStep[];
  governance: string[];
  deploymentNotes: string[];
  relatedScenarioSlugs: string[];
};

export type InsightItem = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  publishDate: string;
  readTime: string;
  keyPoints: string[];
  bodySections: NarrativeStep[];
};

export type CommunityItem = {
  slug: string;
  title: string;
  format: string;
  summary: string;
  audience: string;
  dateLabel: string;
  location: string;
  agenda: NarrativeStep[];
  resources: LinkItem[];
};

export const publicNavLinks = [
  { href: "/scenarios", label: "Nav.scenarios" },
  { href: "/architecture", label: "Nav.architecture" },
  { href: "/insights", label: "Nav.insights" },
  { href: "/community", label: "Nav.community" },
  { href: "/about", label: "Nav.about" },
] as const;

export const featuredAssetSlugs = ["agentic-service-mesh", "knowledge-governance-fabric"] as const;

export const scenarioSlugs = [
  "intelligent-customer-operations",
  "regulated-risk-case-orchestration",
  "field-service-knowledge-acceleration",
] as const;

export const architectureSlugs = [
  "agentic-service-mesh",
  "knowledge-governance-fabric",
  "trust-control-plane",
  "edge-inference-backbone",
] as const;

export const insightSlugs = [
  "from-prototypes-to-governed-ai-products",
  "designing-retrieval-for-high-trust-workflows",
  "why-agent-experience-needs-journey-design",
] as const;

export const communitySlugs = [
  "builders-roundtable-q3",
  "field-ai-practitioner-lab",
  "governed-rag-working-group",
] as const;

export const aboutHighlightKeys = [
  "scenarioLedDelivery",
  "reusableArchitecture",
  "workingCommunity",
] as const;

export function getHomepageFeaturedAssetSlugs(): readonly string[] {
  return featuredAssetSlugs;
}

export function getScenarioSlugs(): readonly string[] {
  return scenarioSlugs;
}

export function getArchitectureSlugs(): readonly string[] {
  return architectureSlugs;
}

export function getInsightSlugs(): readonly string[] {
  return insightSlugs;
}

export function getCommunitySlugs(): readonly string[] {
  return communitySlugs;
}

export function getAboutHighlightKeys(): readonly string[] {
  return aboutHighlightKeys;
}
