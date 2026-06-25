import uuid

from sqlalchemy import select

from app.core.db import SessionLocal
from app.models.asset import Asset


def seed() -> None:
    with SessionLocal() as db:
        existing = db.scalar(select(Asset.id).limit(1))
        if existing is not None:
            return

        asset = Asset(
            id=uuid.uuid4(),
            slug="real-time-fraud-detection-generative-ai",
            title="Real-Time Fraud Detection with Generative AI",
            subtitle="Reduce fraud losses by 45% with LLM-powered risk reasoning",
            short_description="End-to-end fraud detection leveraging LLMs, real-time streaming, and graph intelligence on hyperscale.",
            cloud_providers=["aws", "azure"],
            industries=["financial-services"],
            technologies=["genai", "streaming", "graph"],
            asset_type="solution",
            status="preview",
            content_blocks=[
                {
                    "id": "blk-overview",
                    "type": "text",
                    "order": 1,
                    "visible": True,
                    "config": {
                        "markdown": "A production-style demo showing real-time fraud detection with an LLM reasoning layer and explainable signals."
                    },
                },
                {
                    "id": "blk-metrics",
                    "type": "stat_card",
                    "order": 2,
                    "visible": True,
                    "config": {
                        "items": [
                            {"label": "Fraud Loss Reduction", "value": "45%"},
                            {"label": "Time to Detect", "value": "< 2s"},
                            {"label": "Ops Effort", "value": "-30%"},
                        ]
                    },
                },
            ],
            visibility="public",
            allowed_roles=[],
            allowed_users=[],
        )

        db.add(asset)
        db.commit()


if __name__ == "__main__":
    seed()
