from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt

class JWTManager:
    
    def __init__(self, jwt_secret:str = "development", algorithm:str = "HS256"):
        self.jwt_secret = jwt_secret
        self.algorithm = algorithm
    
    def generate_token(self,data: Any) -> str:
        return jwt.encode(
            {
                **data,
                "exp":datetime.now(timezone.utc) + timedelta(hours=500),
                "iat":datetime.now(timezone.utc)
            },
            self.jwt_secret,
            algorithm=self.algorithm)
        
    def verify_token(self,token:str) -> Optional[Dict]:
        try:
            decode = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=self.algorithm
            )
            return decode
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
            print("Invalid or expired token")
            