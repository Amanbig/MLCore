from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt

class JWTManager:
    
    def __init__(self, secret:str = "development", algorithm:str = "HS256", days:int = 7):
        self.secret = secret
        self.algorithm = algorithm
        self.days = days
    
    def generate_token(self,data: Any) -> str:
        return jwt.encode(
            {
                **data,
                "exp":datetime.now(timezone.utc) + timedelta(days=self.days),
                "iat":datetime.now(timezone.utc)
            },
            self.secret,
            algorithm=self.algorithm)
        
    def verify_token(self,token:str) -> Optional[Dict]:
        try:
            decode = jwt.decode(
                token,
                self.secret,
                algorithms=self.algorithm
            )
            return decode
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
            print("Invalid or expired token",e)
            