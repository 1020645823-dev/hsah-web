from sqlalchemy import select

from app.core.db import SessionLocal
from app.models.template import Template

BUILTIN_TEMPLATES = [
    {
        "name": "Product Introduction",
        "description": "A template for product introduction pages with hero text, image, description and stats.",
        "blocks": [
            {
                "id": "blk-title",
                "type": "text",
                "order": 1,
                "visible": True,
                "config": {
                    "variant": "h1",
                    "markdown": "# Product Name\n\nA compelling one-line tagline for your product.",
                },
            },
            {
                "id": "blk-hero-image",
                "type": "image",
                "order": 2,
                "visible": True,
                "config": {
                    "src": "https://placehold.co/800x400",
                    "alt": "Product hero image",
                    "caption": "Product overview screenshot",
                },
            },
            {
                "id": "blk-description",
                "type": "text",
                "order": 3,
                "visible": True,
                "config": {
                    "variant": "body",
                    "markdown": "Describe your product, its key features, and the value it delivers to customers.",
                },
            },
            {
                "id": "blk-stats",
                "type": "stat_card",
                "order": 4,
                "visible": True,
                "config": {
                    "items": [
                        {"label": "Active Users", "value": "10,000+"},
                        {"label": "Uptime", "value": "99.99%"},
                        {"label": "Response Time", "value": "< 50ms"},
                    ]
                },
            },
        ],
    },
    {
        "name": "Technical Documentation",
        "description": "A template for technical docs with title, overview, code snippets and callouts.",
        "blocks": [
            {
                "id": "blk-title",
                "type": "text",
                "order": 1,
                "visible": True,
                "config": {
                    "variant": "h1",
                    "markdown": "# Technical Documentation\n\nOverview of the architecture and implementation details.",
                },
            },
            {
                "id": "blk-overview",
                "type": "text",
                "order": 2,
                "visible": True,
                "config": {
                    "variant": "body",
                    "markdown": "Provide a high-level overview of the system, its components, and design principles.",
                },
            },
            {
                "id": "blk-code",
                "type": "code_snippet",
                "order": 3,
                "visible": True,
                "config": {
                    "language": "python",
                    "code": "def example():\n    return 'Hello, World!'",
                },
            },
            {
                "id": "blk-callout",
                "type": "callout",
                "order": 4,
                "visible": True,
                "config": {
                    "variant": "info",
                    "markdown": "**Note:** Ensure all dependencies are installed before running the examples.",
                },
            },
        ],
    },
    {
        "name": "News Article",
        "description": "A template for news articles with headline, lead, image and body text.",
        "blocks": [
            {
                "id": "blk-headline",
                "type": "text",
                "order": 1,
                "visible": True,
                "config": {
                    "variant": "h1",
                    "markdown": "# Breaking News Headline",
                },
            },
            {
                "id": "blk-lead",
                "type": "text",
                "order": 2,
                "visible": True,
                "config": {
                    "variant": "body",
                    "markdown": "A short lead paragraph summarizing the key points of the news story.",
                },
            },
            {
                "id": "blk-image",
                "type": "image",
                "order": 3,
                "visible": True,
                "config": {
                    "src": "https://placehold.co/800x400",
                    "alt": "News image",
                    "caption": "Image caption describing the scene",
                },
            },
            {
                "id": "blk-body",
                "type": "text",
                "order": 4,
                "visible": True,
                "config": {
                    "variant": "body",
                    "markdown": "The main body of the article with detailed information, quotes, and context.",
                },
            },
        ],
    },
]


def seed() -> None:
    with SessionLocal() as db:
        existing = db.scalar(select(Template.id).where(Template.is_builtin == True).limit(1))
        if existing is not None:
            return

        for tmpl in BUILTIN_TEMPLATES:
            template = Template(
                name=tmpl["name"],
                description=tmpl["description"],
                blocks=tmpl["blocks"],
                is_builtin=True,
                created_by=None,
            )
            db.add(template)

        db.commit()


if __name__ == "__main__":
    seed()
