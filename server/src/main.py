import time
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger
from starlette.requests import Request
from starlette.responses import JSONResponse

from src.common.logging.logger import log_execution, setup_logging
from src.modules.auth.router import router as auth_router
from src.modules.dataset.router import router as dataset_router
from src.modules.file.router import router as file_router
from src.modules.ml_model.router import router as ml_model_router
from src.modules.stats.router import router as stats_router
from src.modules.user.router import router as user_router

setup_logging()

# Resolve the static dir — in production it's <server_root>/static (copied from client/dist)
STATIC_DIR = Path(__file__).parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    yield


app = FastAPI(redirect_slashes=True, lifespan=lifespan)

# CORS — only needed in development (when the client is on a different port).
# In production the client is served by this same server, so no CORS needed.
IS_PROD = STATIC_DIR.exists()

if not IS_PROD:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    method = request.method
    path = request.url.path
    client_ip = request.client.host if request.client else "Unknown"
    logger.opt(colors=True).info(
        f"<green>Incoming Request</green> | <cyan>{client_ip}</cyan> | <magenta>{method}</magenta> <cyan>{path}</cyan>"
    )
    response = await call_next(request)
    process_time = time.time() - start_time
    status_code = response.status_code
    if 200 <= status_code < 300:
        status_color = "green"
    elif 300 <= status_code < 400:
        status_color = "blue"
    elif 400 <= status_code < 500:
        status_color = "yellow"
    else:
        status_color = "red"
    logger.opt(colors=True).info(
        f"<green>Request Completed</green> | <magenta>{method}</magenta> <cyan>{path}</cyan> | "
        f"Status: <{status_color}>{status_code}</{status_color}> | Time: <y>{process_time:.4f}s</y>"
    )
    return response


# ── API routers ──────────────────────────────────────────────────────────────
# All API routes live under /api so the production client can call /api/*
# without needing a reverse proxy.  The Vite dev proxy already rewrites
# /api → / for local development.
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(dataset_router)
api_router.include_router(file_router)
api_router.include_router(ml_model_router)
api_router.include_router(stats_router)
app.include_router(api_router)


@app.get("/api/health")
@log_execution
def health():
    import os

    import tomllib

    version = os.getenv("APP_VERSION")
    if not version:
        try:
            version = tomllib.loads((Path(__file__).parent.parent / "pyproject.toml").read_text())[
                "project"
            ]["version"]
        except Exception:
            version = "unknown"
    return JSONResponse({"status": "healthy", "version": version})


# ── Static / SPA serving (production only) ──────────────────────────────────
# This MUST come after all API routers so API routes take precedence.
if IS_PROD:
    # Serve Vite's /assets bundle (JS, CSS, sourcemaps)
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="vite-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        """
        Serve static root files (favicon.ico, vite.svg, etc.) directly.
        Everything else falls back to index.html so the React router handles it.
        """
        candidate = STATIC_DIR / full_path
        if full_path and candidate.exists() and candidate.is_file():
            return FileResponse(str(candidate))
        index = STATIC_DIR / "index.html"
        if index.exists():
            return FileResponse(str(index))
        raise HTTPException(status_code=404, detail="Not found")
