"""Configuration via env."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "cdx-sq-api"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg2://sq:sq@localhost:5432/sq"
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""

    class Config:
        env_prefix = "SQ_"
        env_file = ".env"


settings = Settings()
