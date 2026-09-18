"""Imports a reviewed CSV into one account's site without inventing ecological measurements."""

import argparse
import csv
from datetime import date
from pathlib import Path
from pydantic import BaseModel, Field
from sqlalchemy import select
from backend.database import SessionLocal
from backend.models import Observation, Project, Site, User


class Measurement(BaseModel):
    """Reject negative carbon, invalid percentages, and non-finite numbers."""

    date: date
    carbon: float = Field(ge=0, allow_inf_nan=False)
    biodiversity: float = Field(ge=0, le=100, allow_inf_nan=False)
    canopy: float = Field(ge=0, le=100, allow_inf_nan=False)


def import_csv(path: Path, email: str, site_id: str):
    """Validate the entire file first, then apply a transaction so partial imports cannot occur."""
    with path.open(encoding="utf-8-sig", newline="") as source:
        rows = [Measurement.model_validate(row) for row in csv.DictReader(source)]
    if len({row.date for row in rows}) != len(rows):
        raise ValueError("The file contains duplicate dates.")
    with SessionLocal.begin() as db:
        site = db.scalar(
            select(Site)
            .join(Project)
            .join(User, User.id == Project.owner_id)
            .where(Site.id == site_id, User.email == email.lower())
        )
        if not site:
            raise ValueError("No matching site belongs to this account.")
        for row in rows:
            existing = db.scalar(
                select(Observation).where(
                    Observation.site_id == site.id, Observation.date == row.date
                )
            )
            if existing:
                for key, value in row.model_dump().items():
                    setattr(existing, key, value)
            else:
                db.add(Observation(site_id=site.id, **row.model_dump()))
    return len(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path)
    parser.add_argument("--email", required=True)
    parser.add_argument("--site-id", required=True)
    args = parser.parse_args()
    print(f"Imported {import_csv(args.csv, args.email, args.site_id)} observations.")
