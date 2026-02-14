from typing import Any
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.common.security.utils.cookie import CookieManager
from src.common.security.utils.jwt import JWTManager
from src.common.config.config import settings

security = HTTPBearer(auto_error=False)

class Security:
    
    def __init__(self):
        
        self.jwt_manager = JWTManager(
            settings.JWT_SECRET,
            settings.JWT_ALGORITHM,
            settings.JWT_EXPIRY
        )
        
        self.cookie_manager = CookieManager(payload={
                    "httponly": True,
                    "secure": True,
                    "path": "/",
                    "max_age": 60 * 60 * 24 * 7,
                    "samesite": "lax" if settings.APP_ENV == "production" else None,
                    "domain": settings.COOKIE_DOMAIN if settings.APP_ENV == "production" else None,
                })
        
        
        
    def generate_auth_token(self,data: Any):
        token = self.jwt_manager.generate_token(data)
        return token
        
    def verify_auth_token(self,request:Request, credentials:HTTPAuthorizationCredentials = Depends(security)):
        token = None
        token_from_cookie = False
        
        if credentials:
            token = credentials.credentials
            
        if not token:
            cookie_token = request.cookies.get("authToken")
            if cookie_token:
                token = cookie_token
                token_from_cookie = True
                
        if not token:
            raise HTTPException(status_code=401,detail="Missing authentication token")
            
        if token_from_cookie and request.method not in ["GET", "HEAD","OPTIONS"]:
            if not request.headers.get("X-Requested-With"):
                raise HTTPException(status_code=403, detail="csrf protection failed missing header")
                
        payload = self.jwt_manager.verify_token(token)
        
        if not payload:
            raise HTTPException(status_code=401,detail="Missing or invalid token")
            
        return payload