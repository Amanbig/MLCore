import os

from pydantic_settings import BaseSettings

# In Docker the DB lives in /data (a dedicated volume mount).
# In local dev it falls back to a file next to the server directory.
_db_path = os.getenv("DB_PATH", "./mlcore_db.db")


class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{_db_path}"
    APP_ENV: str = "development"
    JWT_SECRET: str = "development"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY: int = 7  # Days

    COOKIE_DOMAIN: str = ""

    # Password Hashing Settings
    BCRYPT_ROUNDS: int = 12  # Default: 12 (good balance of security/speed)

    class Config:
        env_file = ".env"


settings = Settings()
