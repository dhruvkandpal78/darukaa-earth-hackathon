"""Creates database connections used by request handlers and the setup command."""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()
url = os.getenv("DATABASE_URL", "postgresql+psycopg://darukaa:darukaa@localhost:5432/darukaa")
# Hosting providers supply the shorter URL; select our installed Python driver.
url = url.replace("postgres://", "postgresql+psycopg://").replace(
    "postgresql://", "postgresql+psycopg://"
)
engine = create_engine(url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    """Shared foundation lets setup discover every stored record type."""


def get_db():
    """Give each request its own connection and always release it afterward."""
    with SessionLocal() as session:
        yield session
