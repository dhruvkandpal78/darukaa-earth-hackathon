"""Exercise boundary and account validation independently of a running database."""

import pytest
from pydantic import ValidationError
from backend.schemas import SiteInput, Registration, ProjectInput
from backend.import_observations import Measurement


def boundary(points):
    """Keep test fixtures readable by spelling out only the boundary corners."""
    return {
        "name": "Test forest",
        "ecosystem": "Woodland",
        "geometry": {"type": "Polygon", "coordinates": [points]},
    }


@pytest.mark.parametrize(
    "points",
    [
        [[75, 13], [76, 13], [76, 14], [75, 13]],
        [[0, 0], [1, 0], [1, 1], [0, 0]],
    ],
)
def test_valid_polygon(points):
    """Legitimate boundaries must survive validation without losing coordinate precision."""
    assert SiteInput(**boundary(points)).geometry["coordinates"][0] == points


@pytest.mark.parametrize(
    "points",
    [
        [[75, 13], [76, 14], [75, 14], [76, 13], [75, 13]],
        [[75, 13], [76, 13], [76, 14]],
        [[190, 13], [191, 13], [191, 14], [190, 13]],
        [[75, 13], [75, 13], [75, 13], [75, 13]],
        [[float("nan"), 0], [1, 0], [1, 1], [float("nan"), 0]],
    ],
)
def test_reject_invalid_polygon(points):
    """Crossed, unclosed, out-of-range, or empty shapes cannot corrupt spatial records."""
    with pytest.raises(ValidationError):
        SiteInput(**boundary(points))


def test_weak_password_and_whitespace():
    """Reject misleading blank labels and passwords below the documented minimum."""
    with pytest.raises(ValidationError):
        Registration(name="Person", email="person@example.com", password="short")
    with pytest.raises(ValidationError):
        ProjectInput(name="  ", region="India", category="Biodiversity")


@pytest.mark.parametrize(
    "coordinates",
    [None, 1, "invalid", [None], [[None] * 4], [[["75", 13]] * 4], [[[True, 13]] * 4]],
)
def test_malformed_coordinate_containers(coordinates):
    """Malformed JSON should produce a normal validation error, never a server crash."""
    values = boundary([])
    values["geometry"]["coordinates"] = coordinates
    with pytest.raises(ValidationError):
        SiteInput(**values)


@pytest.mark.parametrize(
    "change", [{"carbon": -1}, {"canopy": 101}, {"biodiversity": float("inf")}]
)
def test_measurement_limits(change):
    """Imported observations must be finite and within the published measurement scale."""
    with pytest.raises(ValidationError):
        Measurement(
            **({"date": "2025-01-01", "carbon": 10, "biodiversity": 50, "canopy": 70} | change)
        )
