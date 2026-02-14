from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./mlcore_db.db"
    APP_ENV: str = "development"
    JWT_SECRET: str = "development"
    
    class Config:
        env_file = ".env"
        
settings = Settings()