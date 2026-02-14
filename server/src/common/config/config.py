from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./mlcore_db.db"
    APP_ENV: str = "development"
    JWT_SECRET: str = "development"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY: int = 7 # Days
    
    COOKIE_DOMAIN: str = ""
    
    class Config:
        env_file = ".env"
        
settings = Settings()