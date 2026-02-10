from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = "development"
    JWT_SECRET: str = "development"
    
    class Config:
        env_file = ".env"
        
settings = Settings()