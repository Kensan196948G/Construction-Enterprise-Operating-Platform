"""Application configuration."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="DATA_", extra="ignore")

    app_name: str = "cdx-data-api"
    environment: str = "development"
    debug: bool = True

    # Database (PostgreSQL + PostGIS + TimescaleDB)
    database_url: str = "postgresql+psycopg2://datalake:datalake@localhost:5432/datalake"

    # Elasticsearch (kuromoji 想定)
    elasticsearch_url: str = "http://localhost:9200"
    elasticsearch_index_prefix: str = "cdx-lake"

    # Azure OpenAI (AI 推論 / RAG)
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = "gpt-4o"
    azure_openai_embedding_deployment: str = "text-embedding-3-small"
    azure_openai_api_version: str = "2024-02-15-preview"

    # Cesium Ion (3D タイル). 未設定なら OSM フォールバック.
    cesium_ion_access_token: str = ""

    # Airflow REST API
    airflow_base_url: str = "http://airflow-webserver:8080/api/v1"
    airflow_username: str = ""
    airflow_password: str = ""

    # MQTT (IoT)
    mqtt_broker_host: str = "localhost"
    mqtt_broker_port: int = 1883
    mqtt_topic_prefix: str = "cdx/iot/+/+"
    mqtt_username: str = ""
    mqtt_password: str = ""

    # 部門別 API ベース URL (ETL ソース). 未設定なら httpx 失敗時に stub 動作.
    api_base_construction: str = "http://construction-api:8000/api/v1"
    api_base_safety: str = "http://safety-api:8000/api/v1"
    api_base_hr: str = "http://hr-api:8000/api/v1"
    api_base_crm: str = "http://crm-api:8000/api/v1"
    api_base_finance: str = "http://finance-api:8000/api/v1"
    api_base_procurement: str = "http://procurement-api:8000/api/v1"
    api_base_marine: str = "http://marine-api:8000/api/v1"
    api_base_itsm: str = "http://itsm-api:8000/api/v1"
    api_base_corp: str = "http://corp-api:8000/api/v1"
    api_base_exec: str = "http://exec-api:8000/api/v1"
    api_base_solution: str = "http://solution-api:8000/api/v1"
    api_base_tech: str = "http://tech-api:8000/api/v1"

    # Auth
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"


@lru_cache
def get_settings() -> Settings:
    return Settings()
