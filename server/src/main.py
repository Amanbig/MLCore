import time
from contextlib import asynccontextmanager

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from src.modules.stats.router import router as stats_router
from starlette.requests import Request
from starlette.responses import JSONResponse

from src.common.logging.logger import log_execution, setup_logging
from src.modules.auth.router import router as auth_router
from src.modules.dataset.router import router as dataset_router
from src.modules.file.router import router as file_router
from src.modules.ml_model.router import router as ml_model_router
from src.modules.user.router import router as user_router

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run Alembic migrations on startup
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    yield


app = FastAPI(redirect_slashes=True, lifespan=lifespan)

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

    # Log the incoming request
    method = request.method
    path = request.url.path
    client_ip = request.client.host if request.client else "Unknown"
    logger.opt(colors=True).info(
        f"<green>Incoming Request</green> | <cyan>{client_ip}</cyan> | <magenta>{method}</magenta> <cyan>{path}</cyan>"
    )

    response = await call_next(request)

    # Log the outgoing response
    process_time = time.time() - start_time
    status_code = response.status_code

    # Colorize status code
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


app.include_router(auth_router)
app.include_router(user_router)
app.include_router(dataset_router)
app.include_router(file_router)
app.include_router(ml_model_router)
app.include_router(stats_router)


@app.get("/health")
@log_execution
def health():
    return JSONResponse("System is healthy")
