"""Protects passwords and verifies short-lived signed login tokens for API requests."""

import os
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User

passwords = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = passwords.hash("unused-dummy-value-for-timing-protection")
bearer = HTTPBearer(auto_error=False)


def secret():
    """Fail closed instead of silently deploying an insecure signing key."""
    value = os.getenv("JWT_SECRET", "")
    if len(value) < 32:
        raise RuntimeError("Set JWT_SECRET to a random value of at least 32 characters.")
    return value


def issue_token(user_id):
    """Expire access after one hour; login is required again afterward."""
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user_id,
            "iat": now,
            "exp": now + timedelta(hours=1),
            "iss": "darukaa-earth",
            "aud": "darukaa-web",
        },
        secret(),
        algorithm="HS256",
    )


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
):
    """Never trust a supplied user identifier without verifying its signature and expiry."""
    try:
        if not credentials:
            raise ValueError("Missing token")
        payload = jwt.decode(
            credentials.credentials,
            secret(),
            algorithms=["HS256"],
            issuer="darukaa-earth",
            audience="darukaa-web",
            options={"require": ["exp", "iat", "sub"]},
        )
        user = db.get(User, payload["sub"])
        if not user:
            raise ValueError("Unknown account")
        return user
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(401, "Your session has ended. Please sign in again.") from None
