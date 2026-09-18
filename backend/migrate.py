"""Idempotent initial schema setup, run before the web service starts."""

from sqlalchemy import text
from backend.database import Base, engine
from backend import models  # noqa: F401 -- registering tables is the reason for this import.


def migrate():
    """Enable spatial operations before creating geometry columns and spatial indexes."""
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        Base.metadata.create_all(connection)


if __name__ == "__main__":
    migrate()
