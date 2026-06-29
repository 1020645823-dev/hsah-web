from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5434/hsah"
    jwt_secret: str = "change-me"
    jwt_issuer: str = "hsah"
    cors_origins: str = "http://localhost:3000"

    # MinIO object storage.
    # minio_endpoint is the address the API connects to (for put/remove operations).
    # minio_external_endpoint is the address embedded in presigned URLs (browser reachable).
    minio_endpoint: str = "localhost:9000"
    minio_external_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "hsah"
    minio_secure: bool = False


settings = Settings()
