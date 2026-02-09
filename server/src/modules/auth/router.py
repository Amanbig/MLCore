from fastapi import APIRouter,Request,Response
from starlette.responses import JSONResponse

auth_router = APIRouter(redirect_slashes=True,prefix="/auth")

@auth_router.post("/login")
def login(req:Request,res:Response)->JSONResponse:
    return JSONResponse("login endpoint called")
    
@auth_router.post("/signup")
def signup(req:Request, res:Response) -> JSONResponse:
    return JSONResponse("Signup endpoint called")