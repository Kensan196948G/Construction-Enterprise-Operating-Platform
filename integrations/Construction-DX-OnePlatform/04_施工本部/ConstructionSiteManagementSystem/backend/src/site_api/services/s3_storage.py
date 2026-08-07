"""S3 / MinIO (S3 互換) 写真ストレージ.

- boto3 が import 不能、または S3 設定が未投入の環境ではローカルファイル保存に
  フォールバックする。
- 本番では MinIO エンドポイントに boto3 で PUT する想定。
"""
from __future__ import annotations

import logging
import os
from typing import Any

from ..config import SiteApiSettings

logger = logging.getLogger(__name__)


class S3PhotoStorage:
    """S3/MinIO への写真アップロード。"""

    def __init__(self, settings: SiteApiSettings) -> None:
        self.settings = settings
        self._client: Any | None = None

    def _enabled(self) -> bool:
        return bool(
            self.settings.s3_endpoint_url
            and self.settings.s3_access_key
            and self.settings.s3_secret_key
        )

    def _get_client(self) -> Any | None:
        if self._client is not None:
            return self._client
        if not self._enabled():
            return None
        try:
            import boto3  # type: ignore[import-not-found]
        except ImportError:
            logger.warning("boto3 not installed; falling back to local file storage")
            return None
        self._client = boto3.client(
            "s3",
            endpoint_url=self.settings.s3_endpoint_url,
            aws_access_key_id=self.settings.s3_access_key,
            aws_secret_access_key=self.settings.s3_secret_key,
            region_name=self.settings.s3_region,
        )
        return self._client

    def upload(self, key: str, data: bytes, content_type: str = "image/jpeg") -> str:
        """データを保存し、保存先キーまたはローカルパスを返す。"""
        client = self._get_client()
        if client is None:
            # ローカルフォールバック
            os.makedirs(self.settings.photo_storage_path, exist_ok=True)
            local_path = os.path.join(self.settings.photo_storage_path, key.replace("/", "_"))
            with open(local_path, "wb") as f:
                f.write(data)
            return local_path
        client.put_object(
            Bucket=self.settings.s3_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return key

    def presigned_put_url(self, key: str, expires_in: int = 600) -> str | None:
        """クライアント直接 PUT 用の署名付き URL を発行。未設定環境では None。"""
        client = self._get_client()
        if client is None:
            return None
        return client.generate_presigned_url(  # type: ignore[no-any-return]
            "put_object",
            Params={"Bucket": self.settings.s3_bucket, "Key": key},
            ExpiresIn=expires_in,
        )
