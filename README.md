<!-- Main project guide: architecture, setup, and traceability back to the supplied challenge. -->

# Darukaa Earth

A full-stack workspace for carbon and biodiversity restoration projects. Administrators create projects, draw geographic site boundaries, explore their portfolio on a map, and inspect site-level time series. The interface includes responsive navigation, animated metrics, moving landscape artwork, interactive charts, filtering, and CSV export.

**Delivery status:** application source and deployment configuration are implemented. The local sample preview works without credentials. A private GitHub repository, public deployment, reviewer invitations, and a successful PostGIS integration run still require external setup. This is not yet a verified production deployment. See [NOTES.md](NOTES.md) for the exact outstanding items and assumptions.

## Stack and architecture

- **React + TypeScript + Vite:** modular, type-checked frontend with a fast development server.
- **Mapbox GL JS:** required production map engine, selected when `VITE_MAPBOX_TOKEN` is set. The no-token preview uses MapLibre with OpenStreetMap raster tiles because Mapbox requires a valid access token even for third-party tiles. This fallback is not claimed as a tested Mapbox deployment.
- **Chart.js + react-chartjs-2:** interactive tooltips and carbon, biodiversity, and canopy time series.
- **Python 3.12 + FastAPI:** validated HTTP endpoints and generated OpenAPI documentation.
- **PostgreSQL 16 + PostGIS:** real polygon storage, spatial indexing, and accurate area calculation on Earth's curved surface.
- **SQLAlchemy + GeoAlchemy2:** database relationships and geometry conversion.
- **JWT + Argon2:** signed, one-hour login tokens and one-way password hashes. Tokens live in browser memory rather than persistent browser storage.
- **GitHub Actions, Husky, lint-staged, Prettier, ESLint, Ruff, Vitest, pytest:** automated quality checks before commit and deployment.
- **Docker + Render Blueprint:** one Python service serves both the API and the compiled React frontend. This preserves the required Python/PostGIS stack instead of substituting a JavaScript backend.

```text
Browser
  React components -> API helper with in-memory JWT
  Mapbox -> GeoJSON boundaries -> site form
  Chart.js <- monthly observations
       |
       v
FastAPI ownership checks + input validation
       |
       v
PostgreSQL/PostGIS
  users -> projects -> sites -> observations
```

The sample portfolio is explicit and isolated. It uses session memory, never a pretend server or hidden local-storage database. Signing in replaces sample records with the account's real database records. New sites contain no invented observations.

## Folder walkthrough

```text
src/
  App.tsx                     State and view coordination
  main.tsx                    Browser startup
  types.ts                    Shared record shapes
  components/
    Sidebar.tsx               Desktop navigation and accessible menu drawer
    AnimatedValue.tsx         Reduced-motion-aware metric transitions
    PortfolioMap.tsx          Map and matching accessible site list
    MapView.tsx               Map engines, boundaries, and drawing controls
    ProjectGrid.tsx           Project cards and site entry points
    PortfolioAnalytics.tsx    Portfolio carbon and biodiversity summary
    TrendChart.tsx            Reusable Chart.js time series
    SiteDetails.tsx           Site-level metrics and CSV export
    ProjectForm.tsx           Project creation
    SiteForm.tsx              Boundary and site creation
    AuthForm.tsx              Real login and registration
    Modal.tsx                 Native accessible dialogs
  data/demo.ts                Clearly labeled synthetic dataset
  lib/api.ts                  Authenticated requests and error handling
  lib/analytics.ts            Aggregation and CSV export
  styles/global.css           Base visual system
  styles/motion.css           Motion and zoom-safe responsive refinements
backend/
  main.py                     API routes and production frontend serving
  auth.py                     Password hashing and JWT verification
  security.py                 Bounded authentication rate limiting
  database.py                 Connection/session lifecycle
  models.py                   Relational and spatial schema
  schemas.py                  Incoming account/project/polygon validation
  serialization.py           Public response shapes
  migrate.py                  Idempotent initial database schema setup
  import_observations.py      Validated transactional CSV import
  tests/                      Unit and real PostGIS integration tests
docs/                         API, user, deployment, and verification guides
scripts/                      Submission document generator
.github/workflows/ci.yml       CI and gated automatic Render deployment
.husky/pre-commit             Required formatting/linting hook
compose.yaml                  Local app and persistent PostGIS database
Dockerfile                    Reproducible frontend/API container
render.yaml                   Hosted app/database configuration
output/                       Word submission document
```

## Local setup

### Quick sample preview

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Sample project/site edits last until refresh. Authentication requires the Python API and database below. For a production-map preview, set `VITE_MAPBOX_TOKEN` in `.env` and restart Vite.

### Complete application with Docker

Requires Docker Compose. Copy `.env.example` to `.env`, then replace `JWT_SECRET` with a strong random secret. Generate one using `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Do not commit `.env`.

```sh
docker compose up --build
```

Open `http://127.0.0.1:8000`. PostGIS initializes before the app starts. Database files persist in the named `database-data` volume. Registration creates an empty private workspace. Development database credentials are local-only; use separate strong credentials for deployment.

### Frontend and backend development separately

Use Python 3.12. Start only the database with `docker compose up -d database`, or supply an existing PostgreSQL database with PostGIS available.

```sh
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r backend/requirements.txt
python -m backend.migrate
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal, run `npm ci` and `npm run dev`. Vite forwards `/api` to the Python server. Keep `VITE_API_URL` empty for this same-origin setup. The default deployment intentionally does not enable broad CORS access.

### Environment settings

- `DATABASE_URL`: PostgreSQL connection string. `postgres://` and `postgresql://` provider URLs are normalized to the installed psycopg driver.
- `JWT_SECRET`: required, random, at least 32 characters. Startup fails closed if it is missing or short.
- `VITE_MAPBOX_TOKEN`: a public, URL-restricted Mapbox token; not a secret server key. Rebuild after changing it.
- `VITE_API_URL`: empty by default. Separate-origin deployments require explicit additional CORS configuration and are not the default architecture.
- `ENVIRONMENT`: deployment label; currently does not alter authorization behavior.
- `POSTGRES_PASSWORD`: optional local Compose database password, defaulting to the documented local-development value.

### Import observations

CSV columns are `date,carbon,biodiversity,canopy`. Dates use `YYYY-MM-DD`; carbon is cumulative tCO2e, biodiversity is 0–100, and canopy is 0–100 percent. Obtain the site ID from the authenticated `/api/projects` response. Import is an operator command, not an unauthenticated browser endpoint.

```sh
python -m backend.import_observations observations.csv --email owner@example.com --site-id SITE_UUID
```

The complete file is validated before a transaction begins. Duplicate dates within a file are rejected. Existing dates for the same site are updated intentionally, making repeat imports safe. Refresh the account's portfolio by signing in again after importing.

## Database schema

- `users`: UUID text primary key, name, unique indexed lowercase email, Argon2 password hash. Raw passwords are never stored.
- `projects`: UUID, indexed `owner_id` foreign key, name, region, description, category, creation timestamp. Every API query is scoped to its owner.
- `sites`: UUID, indexed project foreign key, name, ecosystem, `geometry(POLYGON,4326)`, spatial GiST index, area in hectares. Input uses GeoJSON longitude/latitude order. The API uses `ST_Area(geometry::geography) / 10000` to compute hectares.
- `observations`: UUID, indexed site foreign key, date, carbon, biodiversity, canopy. A unique constraint allows only one row per site/date. Database check constraints reject negative carbon and indices outside 0–100.

ORM ownership relationships cascade site/observation deletion when a project is deliberately removed by an operator. No destructive project deletion UI is included because the challenge only requests creation and viewing.

`backend/migrate.py` enables PostGIS and creates the initial schema idempotently. It is **not** a general schema-upgrade engine: subsequent structural changes must be introduced through reviewed, versioned SQL/Alembic migrations rather than relying on `create_all` to modify existing tables.

## Quality checks and CI/CD

```sh
npm run format:check
npm run lint
npm test
npm run build
python -m ruff check backend
python -m ruff format --check backend
python -m pytest -q
```

Set `RUN_DB_TESTS=1` only with a disposable PostgreSQL/PostGIS database to enable the integration test. It checks registration, login, persistent project/site creation, computed geodesic area, and cross-account access denial. CI enables it automatically.

`npm ci` runs Husky's prepare step inside a Git checkout. `.husky/pre-commit` invokes lint-staged: TypeScript runs ESLint and Prettier, supported text/config files run Prettier, and Python runs Ruff checks and formatting. Activate the Python environment before committing Python files.

On pull requests and pushes to `main`, `.github/workflows/ci.yml` installs locked JavaScript dependencies, creates a real PostGIS service, checks formatting/linting, runs both test suites, builds React, and audits production JavaScript dependencies. Deployment runs only after that job passes on `main`. The Render deploy hook receives the exact tested commit SHA. Render's independent automatic deployment is disabled to avoid bypassing the quality gate. Set the repository's `RENDER_DEPLOY_HOOK` secret and configure the `production` environment. See [deployment guide](docs/DEPLOYMENT.md).

## Requirement implementation checklist

- [x] Basic registration and login: `backend/auth.py`, `backend/main.py`, `src/components/AuthForm.tsx`.
- [x] JWT authentication: signed issuer/audience/expiry validation in `backend/auth.py`; browser request helper in `src/lib/api.ts`.
- [x] Create/view projects: project API routes, `ProjectForm.tsx`, `ProjectGrid.tsx`.
- [x] Multiple sites per project: database relationship and `SiteForm.tsx`.
- [x] Draw site polygons: `MapView.tsx`; geometry validation in `backend/schemas.py`.
- [x] Interactive map of all projects/sites: `PortfolioMap.tsx` and `MapView.tsx`.
- [x] Select a site for detailed performance over time: `SiteDetails.tsx`, `TrendChart.tsx`, private site API route.
- [x] React frontend and Chart.js charts: `src/` and dependency manifest.
- [x] Python backend and PostgreSQL/PostGIS schema: `backend/`, Compose, Dockerfile.
- [x] Mapbox integration implemented, with an explicitly documented no-token preview fallback.
- [x] Automated quality checks and pre-commit hooks: ESLint, Ruff, Prettier, Husky, lint-staged, test suites.
- [x] GitHub Actions and automatic deployment configuration: workflow, Dockerfile, Render Blueprint.
- [x] Architecture/schema/setup/CI documentation: this README and `docs/`.
- [x] Dataset choice and assumptions documented: `src/data/demo.ts`, `NOTES.md`.
- [ ] Real Mapbox-token browser verification: needs a valid token.
- [ ] Successful live PostGIS integration run: no local PostGIS service is available in this environment.
- [ ] Private GitHub repository URL and reviewer access: saved GitHub credentials are invalid.
- [ ] Public live demo and verified automatic deployment: needs an authenticated hosting account and deploy hook.
- [ ] Final submission Word document with actual repository/demo links: generator included; external links remain unavailable until the preceding steps are completed.
- [ ] Upload the Word document through the applied-job page: requires the user's job portal session and final submission review.

## Further reading

[API reference](docs/API.md) · [User guide](docs/USER_GUIDE.md) · [Deployment](docs/DEPLOYMENT.md) · [Assumptions and limitations](NOTES.md) · [Verification record](docs/VERIFICATION.md)

Source references: [Mapbox polygon example](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/), [Render Blueprint specification](https://render.com/docs/blueprint-spec), [Render PostGIS support](https://render.com/docs/postgresql-extensions).

Code files carry plain-language purpose comments and named functions explain nontrivial decisions. Strict JSON files and generated lockfiles cannot contain comments; their roles are explained here instead.
