"""Verify the deployed API guide works under the same security policy as the application."""

import re
from fastapi.testclient import TestClient
from backend.main import app


def test_documentation_script_permission(monkeypatch):
    """The guide's inline script must match its response policy and get a fresh token each time."""
    monkeypatch.setenv("JWT_SECRET", "test-only-secret-at-least-32-characters")
    with TestClient(app) as client:
        first = client.get("/api/docs")
        second = client.get("/api/docs")
        schema = client.get("/api/openapi.json")
    assert first.status_code == schema.status_code == 200
    nonce = re.search(r'<script nonce="([^"]+)">', first.text).group(1)
    assert f"'nonce-{nonce}'" in first.headers["content-security-policy"]
    assert nonce not in second.text
    assert "/api/auth/register" in schema.json()["paths"]
