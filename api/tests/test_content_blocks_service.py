from app.services.content_blocks import ContentBlockValidationError, normalize_blocks


def test_normalize_blocks_migrates_legacy_text_block_to_latest_shape() -> None:
    raw_blocks = [
        {
            "block_id": "legacy-text-1",
            "block_type": "text",
            "content": "hello",
        }
    ]

    normalized = normalize_blocks(raw_blocks, asset_schema_version=None)

    assert normalized.asset_schema_version == 2
    assert normalized.blocks == [
        {
            "id": "legacy-text-1",
            "type": "text",
            "version": 2,
            "order": 0,
            "visible": True,
            "config": {
                "markdown": "hello",
                "html": "",
            },
        }
    ]


def test_normalize_blocks_rejects_unknown_block_type() -> None:
    raw_blocks = [
        {
            "id": "x1",
            "type": "carousel",
            "version": 1,
            "order": 0,
            "visible": True,
            "config": {},
        }
    ]

    try:
        normalize_blocks(raw_blocks, asset_schema_version=1)
    except ContentBlockValidationError as exc:
        assert exc.errors[0]["block_type"] == "carousel"
        assert exc.errors[0]["field"] == "type"
    else:
        raise AssertionError("expected ContentBlockValidationError")


def test_normalize_blocks_preserves_code_snippet_filename_and_show_line_numbers() -> None:
    raw_blocks = [
        {
            "id": "code-1",
            "type": "code_snippet",
            "version": 2,
            "order": 0,
            "visible": True,
            "config": {
                "language": "python",
                "code": "print('hi')",
                "filename": "demo.py",
                "showLineNumbers": False,
            },
        }
    ]

    normalized = normalize_blocks(raw_blocks, asset_schema_version=2)

    cfg = normalized.blocks[0]["config"]
    assert cfg["filename"] == "demo.py"
    assert cfg["showLineNumbers"] is False


def test_normalize_blocks_defaults_code_snippet_show_line_numbers_to_true() -> None:
    raw_blocks = [
        {
            "id": "code-2",
            "type": "code_snippet",
            "version": 2,
            "order": 0,
            "visible": True,
            "config": {
                "language": "python",
                "code": "print('hi')",
                "filename": "demo.py",
            },
        }
    ]

    normalized = normalize_blocks(raw_blocks, asset_schema_version=2)

    cfg = normalized.blocks[0]["config"]
    assert cfg["showLineNumbers"] is True


def test_normalize_blocks_migrates_legacy_stat_card_to_stats_array() -> None:
    raw_blocks = [
        {
            "block_id": "legacy-stat-1",
            "block_type": "stat_card",
            "label": "ROI",
            "value": "28%",
            "description": "YoY improvement",
        }
    ]

    normalized = normalize_blocks(raw_blocks, asset_schema_version=1)

    assert normalized.blocks == [
        {
            "id": "legacy-stat-1",
            "type": "stat_card",
            "version": 2,
            "order": 0,
            "visible": True,
            "config": {
                "title": "",
                "stats": [
                    {
                        "label": "ROI",
                        "value": "28%",
                        "description": "YoY improvement",
                    }
                ],
            },
        }
    ]


def test_normalize_blocks_validates_image_alt_text() -> None:
    raw_blocks = [
        {
            "id": "image-1",
            "type": "image",
            "version": 1,
            "order": 0,
            "visible": True,
            "config": {"src": "https://example.com/a.png", "alt": "", "caption": ""},
        }
    ]

    try:
        normalize_blocks(raw_blocks, asset_schema_version=1)
    except ContentBlockValidationError as exc:
        assert exc.errors == [
            {
                "block_id": "image-1",
                "block_type": "image",
                "field": "config.alt",
                "message": "Alt text is required",
            }
        ]
    else:
        raise AssertionError("expected ContentBlockValidationError")
