from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5434/hsah"
    jwt_secret: str = "change-me"
    jwt_issuer: str = "hsah"
    cors_origins: str = "http://localhost:3000"


settings = Settings()
