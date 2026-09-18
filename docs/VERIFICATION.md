<!-- Records verified checks separately from tests that require external services. -->

# Verification record

## Automated checks

- Frontend TypeScript and production build: passed after removing the scroll story and restoring the dashboard.
- ESLint: passed on the restored dashboard.
- Frontend analytics tests: 3 passed.
- Backend validation and authentication: 21 passed, including malformed coordinate containers, strings, null values, and booleans.
- PostGIS integration test: 1 skipped locally because PostgreSQL/PostGIS is not available. GitHub Actions is configured to run it with `RUN_DB_TESTS=1`.
- Ruff: passed; Python files formatted.
- JavaScript dependency audit: zero vulnerabilities after updating Vitest.
- Prettier: project formatting completed.
- Build performance limitation: the main JavaScript bundle is 3,384.46 kB (963.71 kB gzip), and Vite reports its large-chunk warning. Map engine loading should be split before a performance sign-off.

## Browser checks

- Sample project creation updates project count and displays the new project.
- OpenStreetMap/MapLibre fallback basemap renders correctly without credentials.
- Site detail selection and synthetic time series are present.
- Browser verified the polygon workflow: three map clicks produced three corners; Finish boundary enabled saving; saving increased the sample site count from six to seven and added its marker and list entry.
- Opening the new site showed empty metrics and no observations, with CSV export disabled. Existing observed-site totals remained unchanged.
- Desktop navigation was present at the browser's normal zoom. A final narrow-screen pass remains pending.
- The new cinematic scroll-story UI was removed at the user's request. The default view is Overview; the earlier styling and navigation drawer remain.
- The earlier credit-related preview-start block was resolved on retry. The refreshed dashboard and site creation were verified against the restarted local server.

## External verification still required

Mapbox token, real persistent database roundtrip, hosted CI execution, public deployment health, private GitHub access, reviewer invitations, Word document final URLs, and portal upload.

This record distinguishes code implementation from deployment verification; it does not assert unperformed checks.
