"""Checks JWT expiration, tamper protection, and password hashing without a live database."""

from datetime import datetime, timedelta, timezone
import jwt
import pytest
from backend.auth import issue_token, passwords, secret


def test_signed_token(monkeypatch):
    """Only a token signed with the configured secret can identify an account."""
    monkeypatch.setenv("JWT_SECRET", "test-only-secret-at-least-32-characters")
    token = issue_token("account-id")
    assert (
        jwt.decode(
            token, secret(), algorithms=["HS256"], audience="darukaa-web", issuer="darukaa-earth"
        )["sub"]
        == "account-id"
    )
    with pytest.raises(jwt.InvalidSignatureError):
        jwt.decode(
            token,
            "different-secret-at-least-32-characters",
            algorithms=["HS256"],
            audience="darukaa-web",
        )


def test_expired_token(monkeypatch):
    """Old credentials must stop working rather than grant indefinite access."""
    monkeypatch.setenv("JWT_SECRET", "test-only-secret-at-least-32-characters")
    token = jwt.encode(
        {"sub": "id", "exp": datetime.now(timezone.utc) - timedelta(seconds=1)},
        secret(),
        algorithm="HS256",
    )
    with pytest.raises(jwt.ExpiredSignatureError):
        jwt.decode(token, secret(), algorithms=["HS256"])


def test_password_hashing():
    """Stored credentials must not reveal the password and must reject a wrong password."""
    hashed = passwords.hash("a long test password")
    assert "a long test password" not in hashed
    assert passwords.verify("a long test password", hashed)
    assert not passwords.verify("wrong password", hashed)
