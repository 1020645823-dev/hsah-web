from dataclasses import dataclass

from pydantic import BaseModel

from app.schemas.content_blocks import (
    LATEST_ASSET_CONTENT_SCHEMA_VERSION,
    LATEST_BLOCK_VERSION,
    CalloutBlockConfig,
    CodeSnippetBlockConfig,
    ImageBlockConfig,
    StatCardBlockConfig,
    TextBlockConfig,
)


@dataclass
class NormalizeResult:
    asset_schema_version: int
    blocks: list[dict]


class ContentBlockValidationError(Exception):
    def __init__(self, errors: list[dict]) -> None:
        self.errors = errors
        super().__init__("content block validation failed")


CONFIG_MODELS: dict[str, type[BaseModel]] = {
    "text": TextBlockConfig,
    "stat_card": StatCardBlockConfig,
    "image": ImageBlockConfig,
    "code_snippet": CodeSnippetBlockConfig,
    "callout": CalloutBlockConfig,
}


def normalize_blocks(raw_blocks: list[dict], asset_schema_version: int | None) -> NormalizeResult:
    blocks: list[dict] = []
    errors: list[dict] = []
    for index, raw_block in enumerate(raw_blocks):
        try:
            normalized = _normalize_single_block(raw_block, index, asset_schema_version)
            migrated = _migrate_block(normalized)
            blocks.append(_validate_block(migrated))
        except ContentBlockValidationError as exc:
            errors.extend(exc.errors)

    if errors:
        raise ContentBlockValidationError(errors)

    return NormalizeResult(
        asset_schema_version=LATEST_ASSET_CONTENT_SCHEMA_VERSION,
        blocks=blocks,
    )


def _normalize_single_block(raw_block: dict, index: int, asset_schema_version: int | None) -> dict:
    del asset_schema_version

    block_type = raw_block.get("type") or raw_block.get("block_type")
    block_id = raw_block.get("id") or raw_block.get("block_id") or f"block-{index}"
    if block_type not in CONFIG_MODELS:
        raise ContentBlockValidationError(
            [
                _error(
                    block_id=block_id,
                    block_type=str(block_type or "unknown"),
                    field="type",
                    message="Unsupported content block type",
                )
            ]
        )

    version = raw_block.get("version", 1)
    if not isinstance(version, int) or version < 1:
        version = 1
    if version > LATEST_BLOCK_VERSION:
        raise ContentBlockValidationError(
            [
                _error(
                    block_id=block_id,
                    block_type=str(block_type),
                    field="version",
                    message="Unsupported content block version",
                )
            ]
        )

    config = raw_block.get("config")
    if not isinstance(config, dict):
        config = _legacy_config_for_type(block_type, raw_block)

    return {
        "id": block_id,
        "type": block_type,
        "version": version,
        "order": raw_block.get("order", index),
        "visible": raw_block.get("visible", True),
        "config": config,
    }


def _migrate_block(block: dict) -> dict:
    migrated = dict(block)
    config = dict(block.get("config", {}))

    if block["type"] == "text":
        config = {
            "markdown": config.get("markdown") or config.get("content") or config.get("text") or "",
            "html": config.get("html", ""),
        }
    elif block["type"] == "stat_card":
        stats = config.get("stats")
        if not isinstance(stats, list) or not stats:
            legacy_item = {
                "label": str(config.get("label", "")),
                "value": str(config.get("value", "")),
                "description": str(config.get("description", "")),
            }
            stats = [legacy_item] if legacy_item["label"].strip() or legacy_item["value"].strip() else []
        config = {
            "title": str(config.get("title", "")),
            "stats": [_normalize_stat_item(item) for item in stats if isinstance(item, dict)],
        }
    elif block["type"] == "image":
        config = {
            "src": config.get("src") or config.get("url") or "",
            "alt": config.get("alt") or "",
            "caption": config.get("caption") or "",
        }
    elif block["type"] == "code_snippet":
        raw_show_line_numbers = config.get("showLineNumbers")
        show_line_numbers = raw_show_line_numbers if isinstance(raw_show_line_numbers, bool) else True
        config = {
            "language": config.get("language") or "",
            "code": config.get("code") or "",
            "filename": config.get("filename") or "",
            "showLineNumbers": show_line_numbers,
        }
    elif block["type"] == "callout":
        tone = str(config.get("tone") or config.get("variant") or "info")
        if tone == "tip":
            tone = "info"
        config = {
            "title": str(config.get("title", "")),
            "content": str(config.get("content", "")),
            "tone": tone,
        }

    migrated["version"] = LATEST_BLOCK_VERSION
    migrated["config"] = config
    return migrated


def _validate_block(block: dict) -> dict:
    errors = _validate_config(block)
    if errors:
        raise ContentBlockValidationError(errors)

    model = CONFIG_MODELS[block["type"]]
    validated = model.model_validate(block["config"]).model_dump()
    return {
        **block,
        "config": validated,
    }


def _legacy_config_for_type(block_type: str, raw_block: dict) -> dict:
    if block_type == "text":
        return {
            "markdown": raw_block.get("content") or raw_block.get("text") or "",
            "html": "",
        }
    if block_type == "stat_card":
        return {
            "title": raw_block.get("title", ""),
            "stats": raw_block.get("stats", []),
            "label": raw_block.get("label", ""),
            "value": raw_block.get("value", ""),
            "description": raw_block.get("description", ""),
        }
    if block_type == "image":
        return {
            "src": raw_block.get("src", "") or raw_block.get("url", ""),
            "alt": raw_block.get("alt", ""),
            "caption": raw_block.get("caption", ""),
        }
    if block_type == "code_snippet":
        raw_show_line_numbers = raw_block.get("showLineNumbers", True)
        show_line_numbers = raw_show_line_numbers if isinstance(raw_show_line_numbers, bool) else True
        return {
            "language": raw_block.get("language", ""),
            "code": raw_block.get("code", ""),
            "filename": raw_block.get("filename", ""),
            "showLineNumbers": show_line_numbers,
        }
    return {
        "title": raw_block.get("title", ""),
        "content": raw_block.get("content", ""),
        "tone": raw_block.get("tone", "info"),
    }


def _normalize_stat_item(item: dict) -> dict:
    return {
        "label": str(item.get("label", "")),
        "value": str(item.get("value", "")),
        "description": str(item.get("description", "")),
    }


def _validate_config(block: dict) -> list[dict]:
    block_type = str(block["type"])
    block_id = str(block["id"])
    config = block["config"]
    errors: list[dict] = []

    if block_type == "text":
        if not str(config.get("markdown", "")).strip():
            errors.append(_error(block_id=block_id, block_type=block_type, field="config.markdown", message="Text content is required"))
        return errors

    if block_type == "stat_card":
        stats = config.get("stats", [])
        if not isinstance(stats, list) or not stats:
            errors.append(_error(block_id=block_id, block_type=block_type, field="config.stats", message="At least one stat item is required"))
            return errors

        for index, item in enumerate(stats):
            if not isinstance(item, dict):
                errors.append(
                    _error(
                        block_id=block_id,
                        block_type=block_type,
                        field=f"config.stats[{index}]",
                        message="Stat item must be an object",
                    )
                )
                continue
            if not str(item.get("label", "")).strip():
                errors.append(
                    _error(
                        block_id=block_id,
                        block_type=block_type,
                        field=f"config.stats[{index}].label",
                        message="Label is required",
                    )
                )
            if not str(item.get("value", "")).strip():
                errors.append(
                    _error(
                        block_id=block_id,
                        block_type=block_type,
                        field=f"config.stats[{index}].value",
                        message="Value is required",
                    )
                )
        return errors

    if block_type == "image":
        if not str(config.get("src", "")).strip():
            errors.append(_error(block_id=block_id, block_type=block_type, field="config.src", message="Image source is required"))
        if not str(config.get("alt", "")).strip():
            errors.append(_error(block_id=block_id, block_type=block_type, field="config.alt", message="Alt text is required"))
        return errors

    if block_type == "code_snippet":
        if not str(config.get("code", "")).strip():
            errors.append(_error(block_id=block_id, block_type=block_type, field="config.code", message="Code content is required"))
        return errors

    if not str(config.get("content", "")).strip():
        errors.append(_error(block_id=block_id, block_type=block_type, field="config.content", message="Callout content is required"))
    if str(config.get("tone", "info")) not in {"info", "warning", "success", "error"}:
        errors.append(_error(block_id=block_id, block_type=block_type, field="config.tone", message="Tone must be one of info, warning, success, or error"))
    return errors


def _error(*, block_id: str, block_type: str, field: str, message: str) -> dict:
    return {
        "block_id": block_id,
        "block_type": block_type,
        "field": field,
        "message": message,
    }
