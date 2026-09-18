<!-- API contract for frontend developers and reviewers, complementing generated OpenAPI. -->

# API reference

Base path: `/api`. Interactive documentation: `/api/docs`. Machine-readable contract: `/api/openapi.json`.

JSON request bodies are used throughout. Protected routes require `Authorization: Bearer TOKEN`. Tokens expire in one hour and must have the expected signature, issuer, and audience. Errors return a `detail` message or Pydantic's structured validation list. Statuses include 401 for invalid authentication, 404 for absent or non-owned records, 409 for duplicate email, 422 for invalid input, and 429 for excessive authentication attempts.

## Accounts

`POST /auth/register` returns 201. Body: `{ "name": "Reviewer", "email": "reviewer@example.com", "password": "at-least-twelve-characters" }`. Returns `{ "token": "...", "user": { "id": "...", "name": "...", "email": "..." } }`.

`POST /auth/login` accepts email/password and returns the same public account/token shape. Passwords are Argon2 hashes in the database. Authentication attempts are limited to ten per minute per client address in the single-worker deployment.

## Projects

`GET /projects` returns only the signed-in user's projects, newest first, with their sites and ordered observations.

`POST /projects` returns 201. Body includes `name` (2–120 characters), `region` (2–120), `description` (optional, at most 2,000), and `category` (`Forest restoration`, `Blue carbon`, or `Biodiversity`). Ownership is assigned by the server, never from a submitted user ID.

Project response fields: `id`, `name`, `region`, `description`, `category`, `created_at`, `sites`.

## Sites

`POST /projects/{project_id}/sites` returns 201. Body includes `name`, `ecosystem`, and a GeoJSON `geometry` object. Ecosystems: `Tropical forest`, `Mangrove`, `Grassland`, `Wetland`, `Woodland`.

```json
{
  "name": "North woodland",
  "ecosystem": "Woodland",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [75, 13],
        [75.01, 13],
        [75.01, 13.01],
        [75, 13]
      ]
    ]
  }
}
```

Coordinates are longitude then latitude. Rings must be closed, contain at least three distinct corners, and not cross themselves. The server calculates `area_ha`; callers cannot override it. New sites have an empty observations list.

`GET /sites/{site_id}` returns `id`, `project_id`, `name`, `ecosystem`, `geometry`, `area_ha`, and `observations`. Each observation has `date`, `carbon`, `biodiversity`, and `canopy`. Non-owned sites return 404, even if their identifier exists.

## Health

`GET /health` executes `PostGIS_Version()` and returns `{ "status": "ok" }` when the spatial database is reachable. Hosting should monitor this endpoint rather than only checking static HTML.

## Example authenticated flow

```sh
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Reviewer","email":"reviewer@example.com","password":"a-long-review-password"}'
curl http://127.0.0.1:8000/api/projects -H "Authorization: Bearer TOKEN_FROM_RESPONSE"
```

No public endpoint imports or changes measurements. Use the ownership-scoped operator CSV import described in the README.
