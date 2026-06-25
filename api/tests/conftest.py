from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
import app.scripts.seed_assets as seed_assets_module
import app.scripts.seed_templates as seed_templates_module
from app.core import db as db_module
from app.models.base import Base


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@pytest.fixture(autouse=True)
def setup_test_db() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db_module.SessionLocal = TestingSessionLocal
    seed_assets_module.SessionLocal = TestingSessionLocal
    seed_templates_module.SessionLocal = TestingSessionLocal

    seed_assets_module.seed()
    seed_templates_module.seed()

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
