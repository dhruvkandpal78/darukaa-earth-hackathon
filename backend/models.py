"""Defines the four database tables and their ownership relationships."""

import uuid
from datetime import datetime, timezone
from geoalchemy2 import Geometry
from sqlalchemy import String, ForeignKey, DateTime, Float, Date, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


def identifier():
    """Use unpredictable identifiers so records remain unique across deployments."""
    return str(uuid.uuid4())


class User(Base):
    """Each registered user administers their own private portfolio."""

    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))


class Project(Base):
    """Groups geographical sites under one restoration initiative."""

    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    region: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(2000), default="")
    category: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    sites: Mapped[list["Site"]] = relationship(cascade="all, delete-orphan", lazy="selectin")


class Site(Base):
    """Stores a real PostGIS boundary rather than a picture of a map."""

    __tablename__ = "sites"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    ecosystem: Mapped[str] = mapped_column(String(60))
    geometry = mapped_column(Geometry("POLYGON", srid=4326, spatial_index=True), nullable=False)
    area_ha: Mapped[float] = mapped_column(Float)
    observations: Mapped[list["Observation"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="Observation.date"
    )


class Observation(Base):
    """One monthly snapshot records cumulative carbon, diversity score, and canopy cover."""

    __tablename__ = "observations"
    __table_args__ = (
        CheckConstraint(
            "carbon >= 0 AND biodiversity >= 0 AND biodiversity <= 100 AND canopy >= 0 AND canopy <= 100"
        ),
        UniqueConstraint("site_id", "date", name="one_observation_per_site_date"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"), index=True)
    date = mapped_column(Date, nullable=False)
    carbon: Mapped[float] = mapped_column(Float)
    biodiversity: Mapped[float] = mapped_column(Float)
    canopy: Mapped[float] = mapped_column(Float)
