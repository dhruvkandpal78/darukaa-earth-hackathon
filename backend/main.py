"""FastAPI routes enforce ownership and serve the built React website in production."""

from pathlib import Path
import secrets
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select, func, cast, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from geoalchemy2 import Geography
from geoalchemy2.shape import from_shape
from shapely.geometry import shape
from backend.auth import current_user, issue_token, passwords, secret, DUMMY_PASSWORD_HASH
from backend.database import get_db
from backend.models import Project, Site, User
from backend.schemas import Registration, Login, ProjectInput, SiteInput
from backend.serialization import project_json, site_json
from backend.security import allow_auth_attempt


@asynccontextmanager
async def lifespan(app):
    """Validate credentials at startup rather than fail after someone submits a form."""
    secret()
    yield


app = FastAPI(
    title="Darukaa Earth API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url="/api/openapi.json",
)


@app.middleware("http")
async def response_protection(request: Request, call_next):
    """Limit payload size and stop browsers caching private portfolio responses."""
    # Only the API guide gets permission to run its own small startup script.
    # A fresh unpredictable value prevents unrelated inline scripts from sharing it.
    request.state.docs_nonce = secrets.token_urlsafe(24)
    length = request.headers.get("content-length", "0")
    if not length.isdigit() or int(length) > 1_000_000:
        return JSONResponse({"detail": "Request is too large."}, status_code=413)
    if request.url.path in {"/api/auth/login", "/api/auth/register"} and not allow_auth_attempt(
        request.client.host if request.client else "unknown"
    ):
        return JSONResponse(
            {"detail": "Too many attempts. Please wait one minute."},
            status_code=429,
            headers={"Retry-After": "60"},
        )
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.mapbox.com https://tile.openstreetmap.org; connect-src 'self' https://*.mapbox.com https://tile.openstreetmap.org; worker-src 'self' blob:; child-src blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    )
    if request.url.path == "/api/docs":
        response.headers["Content-Security-Policy"] = response.headers[
            "Content-Security-Policy"
        ].replace("script-src 'self'", f"script-src 'self' 'nonce-{request.state.docs_nonce}'")
    if request.url.path.startswith("/api"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/docs", include_in_schema=False)
def api_documentation(request: Request):
    """Keep the interactive API guide usable without relaxing the dashboard's script policy."""
    page = get_swagger_ui_html(
        openapi_url="/api/openapi.json",
        title="Darukaa Earth API documentation",
        swagger_favicon_url="/favicon.svg",
    )
    return HTMLResponse(
        page.body.decode().replace("<script>", f'<script nonce="{request.state.docs_nonce}">')
    )


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    """Deployment checks verify both the API and its spatial database are available."""
    db.execute(text("SELECT PostGIS_Version()"))
    return {"status": "ok"}


def account_response(user):
    """Only public account fields may leave the server."""
    return {
        "token": issue_token(user.id),
        "user": {"id": user.id, "name": user.name, "email": user.email},
    }


@app.post("/api/auth/register", status_code=201)
def register(data: Registration, db: Session = Depends(get_db)):
    """Store a one-way password hash; raw passwords are never saved."""
    user = User(
        name=data.name.strip(),
        email=str(data.email).lower(),
        password_hash=passwords.hash(data.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "An account with this email already exists.") from None
    return account_response(user)


@app.post("/api/auth/login")
def login(data: Login, db: Session = Depends(get_db)):
    """Give the same error for unknown accounts and incorrect passwords."""
    user = db.scalar(select(User).where(User.email == str(data.email).lower()))
    valid = passwords.verify(data.password, user.password_hash if user else DUMMY_PASSWORD_HASH)
    if not user or not valid:
        raise HTTPException(401, "Email or password is incorrect.")
    return account_response(user)


@app.get("/api/projects")
def list_projects(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Ownership filtering makes every account's portfolio private."""
    return [
        project_json(p)
        for p in db.scalars(
            select(Project).where(Project.owner_id == user.id).order_by(Project.created_at.desc())
        )
    ]


@app.post("/api/projects", status_code=201)
def create_project(
    data: ProjectInput, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    """Assign ownership on the server; the caller cannot impersonate another owner."""
    project = Project(**data.model_dump(), owner_id=user.id)
    db.add(project)
    db.commit()
    return project_json(project)


@app.post("/api/projects/{project_id}/sites", status_code=201)
def create_site(
    project_id: str,
    data: SiteInput,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Validate ownership and compute hectares on Earth's curved surface with PostGIS."""
    project = db.scalar(
        select(Project).where(Project.id == project_id, Project.owner_id == user.id)
    )
    if not project:
        raise HTTPException(404, "Project not found.")
    geometry = from_shape(shape(data.geometry), srid=4326)
    hectares = db.scalar(select(func.ST_Area(cast(geometry, Geography(srid=4326))))) / 10000
    site = Site(
        project_id=project.id,
        name=data.name,
        ecosystem=data.ecosystem,
        geometry=geometry,
        area_ha=hectares,
    )
    db.add(site)
    db.commit()
    return site_json(site)


@app.get("/api/sites/{site_id}")
def get_site(site_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """A guessed site identifier must never reveal another account's analytics."""
    site = db.scalar(
        select(Site).join(Project).where(Site.id == site_id, Project.owner_id == user.id)
    )
    if not site:
        raise HTTPException(404, "Site not found.")
    return site_json(site)


# One origin avoids cross-site credential configuration and serves the same build tested in CI.
build = Path(__file__).resolve().parent.parent / "dist"
if build.exists():
    app.mount("/assets", StaticFiles(directory=build / "assets"), name="assets")

    @app.get("/favicon.svg")
    def favicon():
        """Serve the project mark without exposing arbitrary files."""
        return FileResponse(build / "favicon.svg")

    @app.get("/")
    def frontend():
        """Deliver the compiled React workspace."""
        return FileResponse(build / "index.html")
