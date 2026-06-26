import uuid

from sqlalchemy import select

from app.core.db import SessionLocal
from app.models.asset import Asset

SAMPLE_ASSET_SLUG = "agentic-service-mesh-kubernetes"

SAMPLE_ASSET = {
    "slug": SAMPLE_ASSET_SLUG,
    "title": "Agentic Service Mesh on Kubernetes",
    "subtitle": "Reference architecture for governed AI agents across hyperscaler Kubernetes fleets",
    "short_description": "A complete public sample asset showing how platform teams can deploy governed AI agents with service mesh traffic controls, policy guardrails, and observability across AWS, Azure, and Google Cloud.",
    "cloud_providers": ["aws", "azure", "gcp"],
    "industries": ["financial-services", "healthcare", "manufacturing"],
    "technologies": ["genai", "kubernetes", "service-mesh", "observability"],
    "asset_type": "reference-architecture",
    "status": "published",
    "visibility": "public",
    "allowed_roles": [],
    "allowed_users": [],
    "shared_fields": {
        "introduction": "A productized reference asset that helps client teams evaluate, demo, and deliver a governed AI agent runtime on Kubernetes.",
        "use_cases": ["customer-service copilots", "field-ops assistants", "knowledge-grounded agents"],
        "demo_video_url": "https://example.com/videos/agentic-service-mesh-demo.mp4",
        "live_demo_url": "https://example.com/demos/agentic-service-mesh",
        "videos": [
            {
                "id": "overview-video",
                "title": "Agentic Service Mesh Overview",
                "video_url": "https://example.com/videos/agentic-service-mesh-demo.mp4",
                "poster_url": "https://example.com/images/agentic-service-mesh-poster.jpg",
                "description": "A 5-minute walkthrough of the reference architecture, including mesh routing, policy guardrails, and observability.",
                "is_primary": True,
            },
            {
                "id": "deep-dive-video",
                "title": "Deployment Deep Dive",
                "video_url": "https://example.com/videos/agentic-service-mesh-deployment.mp4",
                "poster_url": None,
                "description": "Step-by-step deployment guide for provisioning the agent runtime across EKS, AKS, and GKE.",
                "is_primary": False,
            },
        ],
    },
    "sales_fields": {
        "value_summary": "Position a reusable, enterprise-safe agent platform with strong governance, observability, and multi-cloud portability.",
        "differentiators": ["mesh-native policy control", "portable hyperscaler blueprint", "delivery-ready accelerators"],
        "outcomes": ["faster stakeholder alignment", "shorter solution validation cycle"],
    },
    "delivery_fields": {
        "implementation_summary": "Provide delivery teams with a concrete rollout guide covering identity, policy, observability, and release gates.",
        "prerequisites": ["Kubernetes 1.29+", "service mesh baseline", "centralized secrets manager"],
        "rollout_steps": ["Provision shared runtime", "Bind approved tools", "Enable policy guardrails", "Run readiness checks"],
    },
    "delivery_allowed_roles": ["delivery-engineer", "platform-lead"],
    "delivery_allowed_users": [],
    "content_schema_version": 2,
    "content_blocks": [
        {
            "id": "overview",
            "type": "text",
            "version": 2,
            "order": 1,
            "visible": True,
            "audience": "shared",
            "config": {
                "markdown": "This reference architecture demonstrates a production-ready agentic service mesh for AI delivery teams. It combines Kubernetes-native deployment patterns, identity-aware mesh routing, policy enforcement, and end-to-end telemetry so reusable agents can move safely from pilot to enterprise operations.",
                "html": "",
            },
        },
        {
            "id": "impact-metrics",
            "type": "stat_card",
            "version": 2,
            "order": 2,
            "visible": True,
            "audience": "sales",
            "config": {
                "title": "Expected impact",
                "stats": [
                    {
                        "label": "Deployment readiness",
                        "value": "4 weeks",
                        "description": "From reference blueprint to first governed production pilot.",
                    },
                    {
                        "label": "Policy coverage",
                        "value": "12 controls",
                        "description": "Identity, data egress, tool invocation, and audit controls included.",
                    },
                    {
                        "label": "Cloud portability",
                        "value": "3 clouds",
                        "description": "Patterns mapped across EKS, AKS, and GKE baselines.",
                    },
                ],
            },
        },
        {
            "id": "architecture-pattern",
            "type": "callout",
            "version": 2,
            "order": 3,
            "visible": True,
            "audience": "shared",
            "config": {
                "title": "Architecture pattern",
                "content": "Use the mesh as the control plane between agents, tools, data services, and model endpoints. Every request is authenticated, authorized, traced, and checked against policy before it reaches sensitive systems.",
                "tone": "info",
            },
        },
        {
            "id": "implementation-snippet",
            "type": "code_snippet",
            "version": 2,
            "order": 4,
            "visible": True,
            "audience": "delivery",
            "config": {
                "language": "yaml",
                "title": "Mesh authorization policy",
                "code": "apiVersion: security.istio.io/v1\nkind: AuthorizationPolicy\nmetadata:\n  name: agent-tool-egress\nspec:\n  selector:\n    matchLabels:\n      app: ai-agent-runtime\n  action: ALLOW\n  rules:\n    - to:\n        - operation:\n            hosts: [\"approved-tools.hsah.local\"]\n      when:\n        - key: request.auth.claims[role]\n          values: [\"agent-operator\"]\n",
            },
        },
        {
            "id": "delivery-checklist",
            "type": "text",
            "version": 2,
            "order": 5,
            "visible": True,
            "audience": "delivery",
            "config": {
                "markdown": "### Delivery checklist\n\n- Validate cluster baseline and network policy prerequisites.\n- Configure workload identity for agent runtimes and approved tools.\n- Apply mesh authorization and telemetry policies.\n- Connect audit events to the enterprise SIEM.\n- Run red-team prompts before publishing reusable agent workflows.",
                "html": "",
            },
        },
    ],
}


def seed() -> None:
    with SessionLocal() as db:
        asset = db.scalar(select(Asset).where(Asset.slug == SAMPLE_ASSET_SLUG))
        if asset is None:
            asset = Asset(id=uuid.uuid4(), **SAMPLE_ASSET)
            db.add(asset)
        else:
            for key, value in SAMPLE_ASSET.items():
                setattr(asset, key, value)

        db.commit()


if __name__ == "__main__":
    seed()
