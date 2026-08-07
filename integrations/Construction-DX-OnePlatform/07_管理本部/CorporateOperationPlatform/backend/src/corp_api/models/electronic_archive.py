"""電子帳簿保存法アーカイブ."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from ..db.session import Base


class ElectronicArchive(Base):
    """電子帳簿保存法アーカイブ.

    要件:
      - SHA-256 ハッシュによる改ざん検知
      - タイムスタンプ (認定事業者発行)
      - 訂正履歴の保持 (revision_history JSONB)
      - 検索キー: 日付/金額/取引先
      - 7 年間保存 (retention_until)
    """

    __tablename__ = "t_electronic_archive"

    archive_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_type = Column(String(30), nullable=False)  # invoice/contract/journal/...
    target_id = Column(UUID(as_uuid=True))  # 元エンティティ ID
    file_name = Column(String(300), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    sha256 = Column(String(64), nullable=False)  # 改ざん検知
    timestamp_token = Column(Text)  # タイムスタンプトークン
    timestamp_issued_at = Column(DateTime(timezone=True))
    # 検索キー (電帳法: 日付/金額/取引先 必須)
    search_date = Column(DateTime(timezone=True))
    search_amount = Column(Integer)
    search_counterparty = Column(String(200))
    revision_history = Column(JSONB, default=list)  # [{revised_at, reason, prev_sha256}]
    retention_until = Column(DateTime(timezone=True))  # 7 年後
    is_locked = Column(Integer, default=1)  # 削除防止フラグ
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
