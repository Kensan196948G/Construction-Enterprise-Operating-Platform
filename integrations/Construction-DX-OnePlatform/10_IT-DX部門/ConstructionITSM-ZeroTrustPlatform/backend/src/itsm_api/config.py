"""Application configuration."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="ITSM_", extra="ignore")

    app_name: str = "cdx-itsm-api"
    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str = "postgresql+psycopg2://itsm:itsm@localhost:5432/itsm"

    # Elasticsearch
    elasticsearch_url: str = "http://localhost:9200"

    # Azure OpenAI
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = "gpt-4o"
    azure_openai_embedding_deployment: str = "text-embedding-3-small"
    azure_openai_embedding_dim: int = 1536
    azure_openai_api_version: str = "2024-02-15-preview"

    # Microsoft Graph (Entra ID)
    entra_tenant_id: str = ""
    entra_client_id: str = ""
    entra_client_secret: str = ""

    # Syslog
    syslog_host: str = "0.0.0.0"
    syslog_port: int = 5514
    syslog_batch_size: int = 500
    syslog_batch_interval_sec: float = 1.0

    # SNMP
    snmp_trap_host: str = "0.0.0.0"
    snmp_trap_port: int = 1162
    snmp_v3_user: str = ""
    snmp_v3_auth_key: str = ""
    snmp_v3_priv_key: str = ""

    # Entra fetcher
    entra_fetch_lookback_hours: int = 24
    entra_fetch_page_size: int = 200
    entra_fetch_risk_only: bool = True

    # External integrations
    wazuh_api_url: str = "https://wazuh:55000"
    zabbix_api_url: str = "http://zabbix/api_jsonrpc.php"
    grafana_url: str = "http://grafana:3000"

    # Auth
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"

    # SLA (business hours)
    business_hour_start: int = 9
    business_hour_end: int = 18


@lru_cache
def get_settings() -> Settings:
    return Settings()
