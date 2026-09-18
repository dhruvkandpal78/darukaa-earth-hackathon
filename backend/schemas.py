"""Checks incoming forms before untrusted values can reach the database."""

from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator
from shapely.geometry import shape


class Registration(BaseModel):
    """Require a useful name and a long password for new accounts."""

    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)

    @field_validator("name")
    @classmethod
    def useful_name(cls, value):
        """Reject names that only contain spaces."""
        if len(value.strip()) < 2:
            raise ValueError("Enter a name with at least two letters.")
        return value.strip()


class Login(BaseModel):
    """Bounds prevent oversized input during password verification."""

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProjectInput(BaseModel):
    """Project categories are constrained so filters always behave consistently."""

    name: str = Field(min_length=2, max_length=120)
    region: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=2000)
    category: Literal["Forest restoration", "Blue carbon", "Biodiversity"]

    @field_validator("name", "region")
    @classmethod
    def useful_text(cls, value):
        """Whitespace does not count toward a meaningful project label."""
        if len(value.strip()) < 2:
            raise ValueError("Enter at least two non-space characters.")
        return value.strip()


class SiteInput(BaseModel):
    """Only valid, closed geographic polygons can become sites."""

    name: str = Field(min_length=2, max_length=120)
    ecosystem: Literal["Tropical forest", "Mangrove", "Grassland", "Wetland", "Woodland"]
    geometry: dict

    @field_validator("name")
    @classmethod
    def useful_name(cls, value):
        """A site must remain recognizable in map labels."""
        if len(value.strip()) < 2:
            raise ValueError("Enter a site name with at least two characters.")
        return value.strip()

    @field_validator("geometry")
    @classmethod
    def valid_boundary(cls, value):
        """Reject crossed edges, unclosed rings, huge payloads, and impossible coordinates."""
        if value.get("type") != "Polygon":
            raise ValueError("Draw a polygon boundary.")
        rings = value.get("coordinates", [])
        # Check each container before measuring it so malformed JSON returns a helpful
        # validation response instead of crashing the request with a Python type error.
        if (
            not isinstance(rings, list)
            or not rings
            or any(not isinstance(ring, list) for ring in rings)
            or sum(len(ring) for ring in rings) > 2000
        ):
            raise ValueError("Boundary must contain between 4 and 2,000 coordinates.")
        for ring in rings:
            if len(ring) < 4 or ring[0] != ring[-1]:
                raise ValueError("Close the polygon with at least three corners.")
            for point in ring:
                if (
                    not isinstance(point, list)
                    or len(point) != 2
                    or any(type(coordinate) not in (int, float) for coordinate in point)
                    or not (-180 <= point[0] <= 180 and -85 <= point[1] <= 85)
                ):
                    raise ValueError(
                        "Coordinates must be longitude and latitude within map bounds."
                    )
        polygon = shape(value)
        if not polygon.is_valid or polygon.is_empty or polygon.area == 0:
            raise ValueError("Boundary must enclose land without crossing itself.")
        if polygon.bounds[2] - polygon.bounds[0] > 180:
            raise ValueError("Split boundaries that cross the international date line.")
        return value
