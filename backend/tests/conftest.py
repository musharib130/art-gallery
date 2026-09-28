"""Tests run against a separate `<db>_test` database built with the real migrations."""

import io
import os
import subprocess
import sys
from pathlib import Path

import psycopg
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine, make_url, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import User, UserRole

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_URL = make_url(settings.database_url).set(
    database=f"{make_url(settings.database_url).database}_test"
)
TEST_URL_STR = TEST_URL.render_as_string(hide_password=False)


@pytest.fixture(scope="session")
def engine():
    admin_url = TEST_URL.set(drivername="postgresql", database="postgres")
    with psycopg.connect(admin_url.render_as_string(hide_password=False), autocommit=True) as c:
        c.execute(f'DROP DATABASE IF EXISTS "{TEST_URL.database}" WITH (FORCE)')
        c.execute(f'CREATE DATABASE "{TEST_URL.database}"')
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        env={**os.environ, "DATABASE_URL": TEST_URL_STR},
        check=True,
        capture_output=True,
    )
    engine = create_engine(TEST_URL_STR)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session_factory(engine):
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    yield factory
    tables = ", ".join(t.name for t in Base.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {tables} CASCADE"))


@pytest.fixture
def client(db_session_factory, tmp_path, monkeypatch):
    def override_get_db():
        db = db_session_factory()
        try:
            yield db
        finally:
            db.close()

    monkeypatch.setattr(settings, "media_dir", tmp_path)
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def make_user(db_session_factory, client):
    """Create a user directly (the only way to get an artist) and return a bearer header."""

    def _make(username: str, role: UserRole = UserRole.REGULAR) -> dict[str, str]:
        with db_session_factory() as db:
            db.add(
                User(
                    email=f"{username}@example.com",
                    password_hash=hash_password("password123"),
                    username=username,
                    display_name=username.title(),
                    role=role,
                )
            )
            db.commit()
        res = client.post(
            "/auth/login", json={"email": f"{username}@example.com", "password": "password123"}
        )
        return auth(res.json()["access_token"])

    return _make


@pytest.fixture
def png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (4, 4), "red").save(buf, format="PNG")
    return buf.getvalue()
