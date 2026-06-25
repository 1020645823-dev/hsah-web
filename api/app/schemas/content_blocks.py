from typing import Literal

from pydantic import BaseModel, Field

LATEST_ASSET_CONTENT_SCHEMA_VERSION = 2
LATEST_BLOCK_VERSION = 2

ContentBlockType = Literal["text", "stat_card", "image", "code_snippet", "callout"]


class TextBlockConfig(BaseModel):
    markdown: str = ""
    html: str = ""


class StatItem(BaseModel):
    label: str
    value: str
    description: str = ""


class StatCardBlockConfig(BaseModel):
    title: str = ""
    stats: list[StatItem] = Field(default_factory=list)


class ImageBlockConfig(BaseModel):
    src: str = ""
    alt: str = ""
    caption: str = ""


class CodeSnippetBlockConfig(BaseModel):
    language: str = ""
    code: str = ""
    filename: str = ""
    showLineNumbers: bool = True


class CalloutBlockConfig(BaseModel):
    title: str = ""
    content: str = ""
    tone: Literal["info", "warning", "success", "error"] = "info"


class ContentBlockFieldError(BaseModel):
    block_id: str
    block_type: str
    field: str
    message: str
