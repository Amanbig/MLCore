from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL : str
    APP_ENV: str
    class Config:
        env_file = ".env"
        
settings = Settings()