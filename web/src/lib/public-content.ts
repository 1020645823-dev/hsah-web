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
  { href: "/scenarios", label: "Scenarios" },
  { href: "/architecture", label: "Architecture" },
  { href: "/insights", label: "Insights" },
  { href: "/community", label: "Community" },
  { href: "/about", label: "About" },
] as const;

export const homepageContentLanes: HomepageContentLane[] = [
  {
    href: "/scenarios",
    title: "Scenarios",
    summary: "Start from business journeys and measurable AI outcomes before you enter implementation detail.",
    audience: "Business and delivery leads",
  },
  {
    href: "/architecture",
    title: "Architecture",
    summary: "Move into trust, orchestration, knowledge, and implementation patterns that scale beyond pilots.",
    audience: "Platform and solution architects",
  },
  {
    href: "/insights",
    title: "Insights",
    summary: "Use short reads to align sponsors and teams on operating-model choices, risks, and tradeoffs.",
    audience: "Program sponsors and strategists",
  },
  {
    href: "/community",
    title: "Community",
    summary: "Connect with working groups, labs, and reusable delivery practices shared by practitioners.",
    audience: "Capability teams and practitioners",
  },
];

export const featuredAssetSlugs = ["agentic-service-mesh", "knowledge-governance-fabric"] as const;

export const scenarios: ScenarioItem[] = [
  {
    slug: "intelligent-customer-operations",
    title: "Intelligent Customer Operations",
    eyebrow: "Scenario",
    summary:
      "Reframe service operations around grounded copilots, policy-aware automation, and continuous quality loops.",
    industry: "Telecom",
    businessOutcome: "Reduce handling time while raising first-contact resolution across digital and voice channels.",
    tags: ["Contact Center", "Agent Assist", "Knowledge Grounding"],
    metrics: [
      { label: "Average Handle Time", value: "-28%" },
      { label: "FCR Lift", value: "+17 pts" },
      { label: "Knowledge Reuse", value: "3.2x" },
    ],
    phases: [
      {
        title: "Observe and prioritize",
        description:
          "Map high-volume intents, exception paths, policy dependencies, and current leakage points across channels.",
      },
      {
        title: "Ground and automate",
        description:
          "Introduce retrieval-backed copilots, guided resolution playbooks, and event-driven follow-up actions.",
      },
      {
        title: "Measure and optimize",
        description:
          "Track containment quality, escalations, and sentiment recovery through weekly improvement loops.",
      },
    ],
    relatedArchitectureSlugs: ["agentic-service-mesh", "knowledge-governance-fabric"],
  },
  {
    slug: "regulated-risk-case-orchestration",
    title: "Regulated Risk Case Orchestration",
    eyebrow: "Scenario",
    summary:
      "Coordinate document review, analyst workbenches, and human approvals for high-trust financial workflows.",
    industry: "Banking",
    businessOutcome: "Shorten risk review lead time without weakening traceability, approvals, or policy controls.",
    tags: ["Risk Ops", "Human in the Loop", "Policy Control"],
    metrics: [
      { label: "Case Cycle Time", value: "-41%" },
      { label: "Analyst Capacity", value: "+22%" },
      { label: "Audit Readiness", value: "99.5%" },
    ],
    phases: [
      {
        title: "Standardize evidence intake",
        description:
          "Normalize documents, transaction records, and reviewer notes into a consistent case timeline.",
      },
      {
        title: "Assist decision preparation",
        description:
          "Surface anomalies, pre-populate rationales, and align recommendations with internal control language.",
      },
      {
        title: "Close with lineage",
        description:
          "Persist every decision, override, and supporting artifact for downstream audit and model governance.",
      },
    ],
    relatedArchitectureSlugs: ["trust-control-plane", "knowledge-governance-fabric"],
  },
  {
    slug: "field-service-knowledge-acceleration",
    title: "Field Service Knowledge Acceleration",
    eyebrow: "Scenario",
    summary:
      "Equip technicians with multimodal guidance, parts intelligence, and job-completion capture in the flow of work.",
    industry: "Industrial",
    businessOutcome: "Lift first-time fix rates and compress onboarding time for newly trained field teams.",
    tags: ["Field Service", "Vision Assist", "Work Instructions"],
    metrics: [
      { label: "First-Time Fix", value: "+13 pts" },
      { label: "Onboarding Time", value: "-35%" },
      { label: "Repeat Visits", value: "-18%" },
    ],
    phases: [
      {
        title: "Digitize tacit knowledge",
        description:
          "Capture expert procedures, parts dependencies, and exception handling into guided digital playbooks.",
      },
      {
        title: "Assist on site",
        description:
          "Blend asset history, troubleshooting trees, and visual recognition into a single field experience.",
      },
      {
        title: "Feed the loop",
        description:
          "Convert job outcomes and technician feedback into refreshed content and improved dispatch logic.",
      },
    ],
    relatedArchitectureSlugs: ["edge-inference-backbone"],
  },
];

export const architectures: ArchitectureItem[] = [
  {
    slug: "agentic-service-mesh",
    title: "Agentic Service Mesh",
    eyebrow: "Reference Architecture",
    summary:
      "A modular orchestration pattern for copilots and automations that separates policy, memory, routing, and execution.",
    focus: "Enterprise service operations",
    tags: ["Orchestration", "Observability", "Human Approval"],
    layers: [
      {
        title: "Experience layer",
        description:
          "Desktop, CRM, portal, and channel integrations surface task context, recommendations, and approvals.",
      },
      {
        title: "Agent orchestration layer",
        description:
          "Intent routing, prompt composition, tool calling, fallback logic, and supervisor controls live here.",
      },
      {
        title: "Knowledge and memory layer",
        description:
          "Document retrieval, semantic memory, conversation state, and policy references are versioned and governed.",
      },
      {
        title: "Execution layer",
        description:
          "Workflow engines and enterprise systems execute updates, case actions, notifications, and data writes.",
      },
    ],
    governance: [
      "Separate prompt assets from policy assets for independent review.",
      "Log every tool call, approval handoff, and generated rationale.",
      "Maintain rollback controls for model and retrieval changes.",
    ],
    deploymentNotes: [
      "Start with a narrow domain and one channel before broadening tool access.",
      "Use shared tracing identifiers across orchestration and downstream systems.",
      "Treat confidence thresholds as business controls, not model-only settings.",
    ],
    relatedScenarioSlugs: ["intelligent-customer-operations"],
  },
  {
    slug: "knowledge-governance-fabric",
    title: "Knowledge Governance Fabric",
    eyebrow: "Reference Architecture",
    summary:
      "A governed content pipeline for high-trust retrieval use cases where freshness, lineage, and approval matter.",
    focus: "Knowledge-intensive regulated workflows",
    tags: ["RAG", "Lineage", "Content Lifecycle"],
    layers: [
      {
        title: "Source ingestion",
        description:
          "Policies, documents, tickets, and expert notes are normalized, classified, and version controlled on ingest.",
      },
      {
        title: "Curation layer",
        description:
          "Editorial workflows detect conflicts, missing metadata, and stale assets before publication to retrieval.",
      },
      {
        title: "Serving layer",
        description:
          "Search indexes, embeddings, and authorization-aware retrieval deliver context by persona and workflow state.",
      },
      {
        title: "Feedback loop",
        description:
          "Usage analytics, missing-answer reports, and reviewer overrides feed ongoing curation and retirement decisions.",
      },
    ],
    governance: [
      "Attach source lineage and review status to every retrievable artifact.",
      "Enforce access scopes before retrieval and before answer generation.",
      "Measure retrieval quality with human review on sensitive use cases.",
    ],
    deploymentNotes: [
      "Define a publication SLA for high-volatility policy domains.",
      "Separate draft, approved, and retired knowledge states in storage and UX.",
      "Use business ownership for content freshness, not only platform ownership.",
    ],
    relatedScenarioSlugs: [
      "intelligent-customer-operations",
      "regulated-risk-case-orchestration",
    ],
  },
  {
    slug: "trust-control-plane",
    title: "Trust Control Plane",
    eyebrow: "Reference Architecture",
    summary:
      "A cross-cutting control plane for evaluation, approval, policy enforcement, and operational risk management.",
    focus: "High-assurance decision support",
    tags: ["Control Plane", "Evaluation", "Assurance"],
    layers: [
      {
        title: "Policy definition",
        description:
          "Business rules, escalation thresholds, and approval routes are declared as reusable controls.",
      },
      {
        title: "Runtime enforcement",
        description:
          "Requests are evaluated for access, confidence, risk class, and mandatory review before action execution.",
      },
      {
        title: "Evaluation services",
        description:
          "Offline and online evaluations score recommendation quality, hallucination risk, and drift indicators.",
      },
      {
        title: "Evidence store",
        description:
          "Decision packets, review outcomes, and audit artifacts are retained for governance and remediation.",
      },
    ],
    governance: [
      "Promote controls independently from model or workflow changes.",
      "Make exception handling explicit with owner, expiry, and rationale.",
      "Use policy simulation before releasing controls to production.",
    ],
    deploymentNotes: [
      "Integrate with case systems early to preserve analyst trust.",
      "Treat eval datasets as governed assets with periodic refresh cycles.",
      "Give risk teams self-service visibility without requiring engineering changes.",
    ],
    relatedScenarioSlugs: ["regulated-risk-case-orchestration"],
  },
  {
    slug: "edge-inference-backbone",
    title: "Edge Inference Backbone",
    eyebrow: "Reference Architecture",
    summary:
      "A resilient pattern for field and plant environments where local assistive intelligence must tolerate connectivity gaps.",
    focus: "Field and frontline execution",
    tags: ["Edge", "Offline First", "Device Telemetry"],
    layers: [
      {
        title: "Device experience",
        description:
          "Tablet, rugged device, and wearable surfaces provide guided tasks, image capture, and parts lookup.",
      },
      {
        title: "Local inference and cache",
        description:
          "Compact models and curated knowledge bundles support on-site assistance when bandwidth is constrained.",
      },
      {
        title: "Sync and telemetry",
        description:
          "Bi-directional sync handles work orders, asset updates, and deferred evidence uploads.",
      },
      {
        title: "Central learning loop",
        description:
          "Headquarters teams retrain, review field outcomes, and publish improved playbooks back to the edge.",
      },
    ],
    governance: [
      "Bound local model scope to approved offline tasks.",
      "Encrypt local caches and expire sensitive content automatically.",
      "Separate operational telemetry from worker performance management data.",
    ],
    deploymentNotes: [
      "Design graceful degradation before optimizing peak online performance.",
      "Version field playbooks to avoid ambiguous instructions across crews.",
      "Instrument sync success and stale-content rates as first-class health metrics.",
    ],
    relatedScenarioSlugs: ["field-service-knowledge-acceleration"],
  },
];

export const insights: InsightItem[] = [
  {
    slug: "from-prototypes-to-governed-ai-products",
    title: "From Prototypes to Governed AI Products",
    category: "Operating Model",
    summary:
      "Why many pilots stall and what has to change in portfolio management, ownership, and delivery design.",
    publishDate: "2026-06-10",
    readTime: "6 min read",
    keyPoints: [
      "Prototype success rarely predicts production adoption on its own.",
      "Governance has to be embedded in product flow, not bolted on after launch.",
      "Teams need reusable controls, shared telemetry, and clear asset ownership.",
    ],
    bodySections: [
      {
        title: "The failure mode",
        description:
          "Many pilots prove a model can generate outputs, but they do not prove that the surrounding workflow can absorb those outputs safely and repeatedly.",
      },
      {
        title: "What scales",
        description:
          "The strongest programs industrialize evaluation, prompt and policy versioning, and business-ready review paths before multiplying use cases.",
      },
      {
        title: "What to do next",
        description:
          "Treat AI delivery as a product portfolio with clear service tiers, reusable components, and operating metrics that matter to business owners.",
      },
    ],
  },
  {
    slug: "designing-retrieval-for-high-trust-workflows",
    title: "Designing Retrieval for High-Trust Workflows",
    category: "Knowledge Systems",
    summary:
      "Retrieval quality depends as much on editorial and governance systems as it does on embeddings and chunking.",
    publishDate: "2026-05-27",
    readTime: "5 min read",
    keyPoints: [
      "Freshness and lineage matter more as consequence increases.",
      "Authorization and review state must travel with the content.",
      "Missing-answer analytics are a product signal, not an edge case.",
    ],
    bodySections: [
      {
        title: "Shift the question",
        description:
          "The real design problem is not only how to find similar text, but how to serve the right approved context to the right role at the right point in a workflow.",
      },
      {
        title: "Editorial systems are part of the architecture",
        description:
          "Without clear review, ownership, and retirement patterns, even strong retrieval infrastructure degrades into a confidence problem for end users.",
      },
      {
        title: "Measure usefulness, not only relevance",
        description:
          "Useful retrieval reduces back-and-forth, supports action completion, and exposes when the system cannot answer with confidence.",
      },
    ],
  },
  {
    slug: "why-agent-experience-needs-journey-design",
    title: "Why Agent Experience Needs Journey Design",
    category: "Experience Design",
    summary:
      "Copilots fail when they are inserted as side widgets instead of being designed around the job-to-be-done.",
    publishDate: "2026-04-18",
    readTime: "4 min read",
    keyPoints: [
      "Assistive AI should reduce decisions, not create another interface to manage.",
      "Journey mapping reveals where confidence and approvals really matter.",
      "The best experiences combine automation with transparent next-best actions.",
    ],
    bodySections: [
      {
        title: "Move from feature thinking to journey thinking",
        description:
          "Users do not want a chatbot feature; they want a shorter, clearer path to a completed outcome with fewer risky decisions.",
      },
      {
        title: "Design for confidence",
        description:
          "Grounding signals, source previews, and approval checkpoints make assistance easier to trust in real operating contexts.",
      },
      {
        title: "Design for handoff",
        description:
          "Human takeover, escalation, and case continuity should feel native, not like failure states.",
      },
    ],
  },
];

export const communityItems: CommunityItem[] = [
  {
    slug: "builders-roundtable-q3",
    title: "Builders Roundtable Q3",
    format: "Roundtable",
    summary:
      "A peer forum for platform, architecture, and product leaders aligning on reusable enterprise AI delivery patterns.",
    audience: "Enterprise architects and product owners",
    dateLabel: "2026-07-18",
    location: "Hybrid / Singapore",
    agenda: [
      {
        title: "Reusable platform patterns",
        description: "Share delivery accelerators, control models, and rollout sequencing across teams.",
      },
      {
        title: "Assurance at scale",
        description: "Compare evaluation practices, release gates, and business-facing evidence models.",
      },
      {
        title: "Working session",
        description: "Map common blockers and publish a short pattern pack after the event.",
      },
    ],
    resources: [
      { label: "Request invitation", href: "/about" },
      { label: "See related insights", href: "/insights" },
    ],
  },
  {
    slug: "field-ai-practitioner-lab",
    title: "Field AI Practitioner Lab",
    format: "Hands-on Lab",
    summary:
      "A practical program focused on frontline and field-service AI patterns, from knowledge capture to edge delivery.",
    audience: "Operations leads and field transformation teams",
    dateLabel: "2026-08-06",
    location: "Onsite / Kuala Lumpur",
    agenda: [
      {
        title: "Workflow teardown",
        description: "Decompose current field journeys into assistive moments, controls, and measurable outcomes.",
      },
      {
        title: "Architecture clinic",
        description: "Review offline-first design choices, sync boundaries, and device telemetry needs.",
      },
      {
        title: "Capability roadmap",
        description: "Translate lab findings into a staged delivery roadmap with readiness checkpoints.",
      },
    ],
    resources: [
      { label: "Explore scenarios", href: "/scenarios" },
      { label: "Review reference architecture", href: "/architecture/edge-inference-backbone" },
    ],
  },
  {
    slug: "governed-rag-working-group",
    title: "Governed RAG Working Group",
    format: "Working Group",
    summary:
      "A recurring collaboration stream for teams building retrieval-heavy experiences in regulated or high-trust domains.",
    audience: "Knowledge platform teams and governance leads",
    dateLabel: "Monthly",
    location: "Virtual",
    agenda: [
      {
        title: "Pattern review",
        description: "Discuss content lifecycle, authorization-aware retrieval, and line-of-defense responsibilities.",
      },
      {
        title: "Metrics exchange",
        description: "Benchmark freshness, missing-answer rates, and reviewer intervention across implementations.",
      },
      {
        title: "Artifact share-out",
        description: "Publish templates, governance checklists, and architecture reference notes for members.",
      },
    ],
    resources: [
      { label: "Read retrieval insight", href: "/insights/designing-retrieval-for-high-trust-workflows" },
      { label: "Meet the team", href: "/about" },
    ],
  },
];

export const aboutHighlights = [
  {
    title: "Scenario-led delivery",
    description:
      "We shape assets around business journeys, operating risks, and measurable outcome moves rather than isolated demos.",
  },
  {
    title: "Reusable architecture",
    description:
      "Reference patterns accelerate design decisions across orchestration, knowledge, trust, and edge execution.",
  },
  {
    title: "Working community",
    description:
      "Operators, architects, and product teams share methods, proof points, and delivery patterns across sectors.",
  },
];

export function getHomepageFeaturedAssets(): HomepageFeaturedAsset[] {
  return featuredAssetSlugs
    .map((slug) => {
      const item = getArchitectureBySlug(slug);
      if (!item) {
        return null;
      }

      return {
        href: `/architecture/${item.slug}`,
        title: item.title,
        summary: item.summary,
        eyebrow: item.eyebrow,
        audience: item.focus,
        tags: item.tags.slice(0, 2),
      };
    })
    .filter((item): item is HomepageFeaturedAsset => item !== null);
}

export function getScenarioBySlug(slug: string) {
  return scenarios.find((item) => item.slug === slug) ?? null;
}

export function getArchitectureBySlug(slug: string) {
  return architectures.find((item) => item.slug === slug) ?? null;
}

export function getInsightBySlug(slug: string) {
  return insights.find((item) => item.slug === slug) ?? null;
}

export function getCommunityItemBySlug(slug: string) {
  return communityItems.find((item) => item.slug === slug) ?? null;
}
