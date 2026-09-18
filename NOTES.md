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
8. The submission requests a private repository even though the final page mentions a public alternative. Private remains the intended setting. No repository was published publicly as a workaround.

## External blockers

- The temporary credit-related preview-start block was resolved on retry. Browser site creation is now verified; responsive verification and the external service checks remain separate tasks.
- The Word submission draft has not been visually verified: the required document renderer could not find LibreOffice. Final document rendering and real repository/demo links remain necessary before submission.

- GitHub authentication has been restored. Remote publication and reviewer access are being verified separately.
- No authenticated Render deployment account or deploy hook has been supplied. `render.yaml` provisions paid starter resources if applied; review pricing in Render before provisioning. No paid infrastructure was provisioned.
- Docker/PostgreSQL/PostGIS are unavailable locally, so the real spatial persistence test has not been executed here. CI is configured to run it against a real PostGIS service.
- No Mapbox token is present. The no-token map path is testable; the real Mapbox path remains unverified.
- The submission cannot contain real GitHub/live-demo URLs before those resources exist. The Word package must not be submitted with pending link labels.
- Reviewer access targets from the supplied document: ankita.dasgupta@darukaa.com, harsh.kumar@darukaa.com, utkarsh.gauniyal@darukaa.com, guneet.mutreja@darukaa.com. No invitations have been sent.

## Operational boundaries

The initial schema setup creates missing tables; it does not upgrade existing schemas. Introduce reviewed migrations for future changes. Authentication rate limiting is bounded in-process memory for the documented single-worker service; use a shared limiter before horizontal scaling. Database backups, restore drills, monitoring alerts, password recovery, email verification, refresh-token revocation, and production load testing are not part of the challenge implementation and must be considered before operating a public production service at scale. Production readiness is not claimed until deployment, real database integration, map credentials, and operational checks are verified.
