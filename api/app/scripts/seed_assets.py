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
    "shared_fields": {
        "introduction": "A productized reference asset that helps client teams evaluate, demo, and deliver a governed AI agent runtime on Kubernetes.",
        "use_cases": ["customer-service copilots", "field-ops assistants", "knowledge-grounded agents"],
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
