from fastapi import FastAPI
from starlette.responses import JSONResponse

from src.modules.auth.router import router as auth_router
from src.modules.user.router import router as user_router
from src.modules.dataset.router import router as dataset_router
from src.modules.file.router import router as file_router
from src.modules.ml_model.router import router as ml_model_router

from contextlib import asynccontextmanager
from alembic.config import Config
from alembic import command


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run Alembic migrations on startup
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    yield


app = FastAPI(redirect_slashes=True, lifespan=lifespan)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(dataset_router)
app.include_router(file_router)
app.include_router(ml_model_router)


@app.get("/health")
def health():
    return JSONResponse("System is healthy")
