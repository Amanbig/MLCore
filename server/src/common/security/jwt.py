from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
import jwt
from src.common.config.config import settings

class JWTManager:
    
    def __init__(self):
        self.jwt_secret = settings.JWT_SECRET
    
    def generate_token(self,user_id) -> str:
        payload = {
            "user_id":user_id,
            "exp":datetime.now(timezone.utc) + timedelta(hours=500),
            "iat":datetime.now(timezone.utc)
        }
        
        return jwt.encode(payload,self.jwt_secret,algorithm="HS256")
        
    def verify_token(self,token:str) -> Optional[Dict]:
        try:
            decode = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms="HS256"
            )
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
            print("INvalid token")
            