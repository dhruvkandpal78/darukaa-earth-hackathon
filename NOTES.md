<!-- Explicit assumptions and incomplete external deliverables prevent the sample preview being mistaken for a deployed production system. -->

# Assumptions and remaining work

## Product assumptions

1. Every registered account is an administrator of its own private portfolio. The challenge does not specify shared organizations, invitation-based app membership, or separate viewer roles.
2. Sample data is permitted by the PDF. Four fictional projects, six approximate Indian site polygons, and twelve synthetic monthly observations per site illustrate all charts. These are not surveyed boundaries, certified carbon credits, scientific biodiversity assessments, or real conservation project claims.
3. Carbon means cumulative stored tCO2e. Biodiversity is an illustrative index out of 100; canopy is percent cover. Portfolio carbon totals the latest observation per monitored site; biodiversity is an unweighted mean. Monthly charts aggregate available observations at each date. Missing values are excluded, not filled with zero. Differing observation dates can make the latest portfolio card differ from the last chart point; the sample uses aligned dates.
4. A site is a single valid Polygon in EPSG:4326. Multipolygons, polar regions above 85 degrees, and date-line-crossing boundaries are rejected explicitly. At most 2,000 coordinate pairs are accepted. The draw form collects one exterior ring; the API can accept valid interior rings.
5. Actual observations are supplied by a reviewed CSV import command because no external analytical dataset or calculation methodology is mandated. New sites never receive synthetic results automatically.
6. Mapbox GL JS is the configured map engine. MapLibre/OpenStreetMap is a clearly documented fallback only for no-token preview. A valid public Mapbox token is necessary to verify the required Mapbox/satellite path. OpenStreetMap's public tile service is suitable for this small preview, not a high-traffic production SLA; configure Mapbox for deployment.
7. Demo modifications use memory and reset on refresh. Account records use PostgreSQL. Access tokens also use memory and expire after an hour; refresh requires sign-in again.
8. The submission allows a public repository alternative, and the repository has been made public to simplify reviewer access.

## External blockers

- All external deployment blockers have been resolved.
- The Render application is successfully deployed using the provided blueprint.
- The GitHub repository is public and accessible.
- The final Word submission document contains the real, verified links.
- Reviewer invitations are not required since the repository is public.

## Operational boundaries

The initial schema setup creates missing tables; it does not upgrade existing schemas. Introduce reviewed migrations for future changes. Authentication rate limiting is bounded in-process memory for the documented single-worker service; use a shared limiter before horizontal scaling. Database backups, restore drills, monitoring alerts, password recovery, email verification, refresh-token revocation, and production load testing are not part of the challenge implementation and must be considered before operating a public production service at scale. Production readiness is not claimed until deployment, real database integration, map credentials, and operational checks are verified.
