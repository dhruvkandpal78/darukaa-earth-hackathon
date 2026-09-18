"""Real PostGIS integration tests run in CI or locally with RUN_DB_TESTS=1 on a disposable database."""

import os
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from backend.database import SessionLocal
from backend.main import app
from backend.migrate import migrate
from backend.models import Project, User
from backend.security import attempts

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_DB_TESTS") != "1", reason="Requires a disposable PostgreSQL/PostGIS database"
)


def test_private_portfolio_roundtrip(monkeypatch):
    """Create two users and prove persistence, geodesic area, and cross-account isolation."""
    monkeypatch.setenv("JWT_SECRET", "integration-test-secret-at-least-32-characters")
    migrate()
    attempts.clear()
    email = f"test-{uuid.uuid4()}@example.com"
    other_email = f"test-{uuid.uuid4()}@example.com"
    with TestClient(app) as client:
        try:
            response = client.post(
                "/api/auth/register",
                json={
                    "name": "Test Owner",
                    "email": email,
                    "password": "correct-horse-battery-staple",
                },
            )
            assert response.status_code == 201
            headers = {"Authorization": f"Bearer {response.json()['token']}"}
            assert (
                client.post(
                    "/api/auth/login", json={"email": email, "password": "wrong"}
                ).status_code
                == 401
            )
            assert (
                client.post(
                    "/api/auth/login",
                    json={"email": email, "password": "correct-horse-battery-staple"},
                ).status_code
                == 200
            )
            project_response = client.post(
                "/api/projects",
                headers=headers,
                json={"name": "Test restoration", "region": "India", "category": "Biodiversity"},
            )
            assert project_response.status_code == 201
            project_id = project_response.json()["id"]
            response = client.post(
                f"/api/projects/{project_id}/sites",
                headers=headers,
                json={
                    "name": "Test woodland",
                    "ecosystem": "Woodland",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[75, 13], [75.01, 13], [75.01, 13.01], [75, 13]]],
                    },
                },
            )
            assert response.status_code == 201, response.text
            site = response.json()
            assert 50 < site["area_ha"] < 70
            assert site["observations"] == []
            assert (
                client.get("/api/projects", headers=headers).json()[0]["sites"][0]["id"]
                == site["id"]
            )
            other = client.post(
                "/api/auth/register",
                json={
                    "name": "Other Owner",
                    "email": other_email,
                    "password": "correct-horse-battery-staple",
                },
            ).json()
            other_headers = {"Authorization": f"Bearer {other['token']}"}
            assert client.get("/api/projects", headers=other_headers).json() == []
            assert client.get(f"/api/sites/{site['id']}", headers=other_headers).status_code == 404
            assert client.get("/api/projects").status_code == 401
            assert (
                client.post(
                    f"/api/projects/{project_id}/sites",
                    headers=other_headers,
                    json={
                        "name": "Forbidden site",
                        "ecosystem": "Woodland",
                        "geometry": site["geometry"],
                    },
                ).status_code
                == 404
            )
        finally:
            # Remove only records created by this test, never unrelated developer records.
            with SessionLocal.begin() as db:
                for user in db.scalars(select(User).where(User.email.in_([email, other_email]))):
                    for project in db.scalars(select(Project).where(Project.owner_id == user.id)):
                        db.delete(project)
                    db.flush()
                    db.delete(user)
