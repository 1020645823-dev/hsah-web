from pathlib import Path


ALEMBIC_VERSIONS_DIR = Path(__file__).resolve().parents[1] / "alembic" / "versions"


def test_alembic_revision_ids_fit_version_table_limit() -> None:
    revision_ids: list[str] = []

    for migration_file in ALEMBIC_VERSIONS_DIR.glob("*.py"):
        if migration_file.name == ".gitkeep":
            continue

        for line in migration_file.read_text().splitlines():
            if line.startswith("revision: str = "):
                revision_ids.append(line.split('"')[1])
                break

    assert revision_ids
    assert all(len(revision_id) <= 32 for revision_id in revision_ids)
