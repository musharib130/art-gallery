from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Art Gallery API"
    # Required; set in backend/.env (see .env.example).
    database_url: str
    cors_origins: list[str] = ["http://localhost:3000"]

    # Required; any long random string. Signs access tokens.
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    # Uploaded images are stored here and served at {public_base_url}/media/...
    media_dir: Path = BACKEND_DIR / "media"
    public_base_url: str = "http://localhost:8000"
    max_upload_bytes: int = 10 * 1024 * 1024


settings = Settings()
