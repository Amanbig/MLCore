from fastapi import FastAPI
from starlette.responses import JSONResponse

app = FastAPI(redirect_slashes=True)

@app.get("/health")
def health():
    return JSONResponse("System is healty")