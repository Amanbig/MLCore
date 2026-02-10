from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str | None
    JWT_SECRET: str | None
    
    class Config:
        env_file = ".env"
        
settings = Settings()