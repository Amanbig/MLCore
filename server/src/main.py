from fastapi import FastAPI
from starlette.responses import JSONResponse
from src.modules.auth import auth_router

app = FastAPI(redirect_slashes=True)

app.include_router(auth_router)

@app.get("/health")
def health():
    return JSONResponse("System is healty")