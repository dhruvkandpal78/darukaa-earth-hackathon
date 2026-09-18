"""Converts database records into the documented browser-friendly API format."""

from geoalchemy2.shape import to_shape
from shapely.geometry import mapping


def site_json(site):
    """Return a boundary and its time series together for immediate map-to-chart navigation."""
    return {
        "id": site.id,
        "project_id": site.project_id,
        "name": site.name,
        "ecosystem": site.ecosystem,
        "geometry": mapping(to_shape(site.geometry)),
        "area_ha": site.area_ha,
        "observations": [
            {
                "date": str(o.date),
                "carbon": o.carbon,
                "biodiversity": o.biodiversity,
                "canopy": o.canopy,
            }
            for o in site.observations
        ],
    }


def project_json(project):
    """Include sites so portfolio filtering never requires a request per map marker."""
    return {
        "id": project.id,
        "name": project.name,
        "region": project.region,
        "description": project.description,
        "category": project.category,
        "created_at": project.created_at.isoformat(),
        "sites": [site_json(s) for s in project.sites],
    }
