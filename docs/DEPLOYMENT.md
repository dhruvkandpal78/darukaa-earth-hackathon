<!-- Concrete deployment steps explain how the prepared configuration becomes a verified public service. -->

# Deploying the full application

## GitHub

Restore GitHub CLI authentication with `gh auth login` or refresh the existing account. Create a **private** repository, add it as `origin`, and push `main`. Do not commit `.env`, caches, database dumps, or tokens. The repository includes a lockfile and pre-commit hook; use the intended Node/Python versions before committing.

The supplied document requests access for four reviewers. Invite the listed email addresses through the repository's collaborator settings, or obtain their GitHub usernames if GitHub requires usernames. Record the actual repository link and invitation status in the Word submission document. No invitations have been sent by this implementation.

## Render

1. Connect the private repository in an authenticated Render account.
2. Review the paid plans declared in `render.yaml`; no infrastructure has been purchased or provisioned here.
3. Create a Blueprint from `render.yaml`. It defines a Docker web service and private PostgreSQL database with PostGIS support.
4. Set a public URL-restricted `VITE_MAPBOX_TOKEN`. Render exposes Docker environment values as build arguments when declared in the Dockerfile; verify the built application uses the configured token. The browser token must not be a secret management token.
5. The Blueprint generates the JWT signing secret and supplies the database connection string. The container enables PostGIS and creates the initial schema before starting Uvicorn.
6. Copy the web service's deploy-hook URL into the GitHub repository's `RENDER_DEPLOY_HOOK` secret. Create the GitHub `production` environment.
7. Keep Render's independent autodeploy disabled. GitHub Actions triggers the exact passing commit on `main` using the hook's `ref` query parameter.
8. After the first successful deployment, verify `/api/health`, registration, login, project creation, polygon creation, refresh persistence, and cross-account isolation on the public HTTPS URL. Inspect the Mapbox renderer and satellite toggle with the real token.

The deployment job submits a build request; Render's own deployment dashboard and health check determine when that build is live. A successful hook request alone is not proof that deployment completed. Record the final live URL only after the service reports healthy.

## Production checks

- Confirm the PostGIS CI test actually ran, rather than being skipped.
- Verify that the deployed SHA matches the passing GitHub Actions revision.
- Confirm database backups and restore access in the provider dashboard.
- Use one API worker with the current in-memory authentication limiter. Replace it with a shared limiter before adding replicas or workers.
- Terminate TLS at the hosting proxy. Restrict Mapbox token origins to the actual deployment/local development hosts.
- Configure service monitoring and inspect logs without printing passwords, JWTs, or signing keys.
- Keep an immutable known-good deployment available for rollback; back up the database before future migrations.

## Submission

Generate the Word document with `scripts/create_submission.py`, supplying the real repository and demo URLs. Include the README overview, setup requirements, access instructions, and outstanding notes. Upload that document through the applied job's document-submission option only after final review. This repository does not automate applying for a job or submitting the application.
