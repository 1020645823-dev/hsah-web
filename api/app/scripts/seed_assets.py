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
    "content_schema_version": 2,
    "content_blocks": [
        {
            "id": "overview",
            "type": "text",
            "version": 2,
            "order": 1,
            "visible": True,
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
