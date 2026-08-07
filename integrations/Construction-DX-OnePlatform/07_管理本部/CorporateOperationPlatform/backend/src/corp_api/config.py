"""Configuration via env."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "cdx-corp-api"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg2://corp:corp@localhost:5432/corp"
    # インボイス: 国税庁 適格請求書発行事業者公表サイト API
    nta_invoice_api_endpoint: str = "https://web-api.invoice-kohyo.nta.go.jp/v1"
    # 電帳法: タイムスタンプ事業者
    timestamp_authority_url: str = ""
    timestamp_authority_token: str = ""

    class Config:
        env_prefix = "CORP_"
        env_file = ".env"


settings = Settings()
