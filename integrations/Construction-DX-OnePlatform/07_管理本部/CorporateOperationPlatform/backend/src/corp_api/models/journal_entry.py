"""仕訳エントリ."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class JournalEntry(Base):
    """仕訳.

    1 仕訳 = 借方科目 / 貸方科目 / 金額 / 摘要 / (オプション) 工事番号。
    借貸バランス検証はサービス層 (`accounting_engine`) で行う。
    """

    __tablename__ = "t_journal_entry"

    entry_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    txn_date = Column(Date, nullable=False, default=date.today)  # 取引日
    debit_account_code = Column(String(10), nullable=False)
    credit_account_code = Column(String(10), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    description = Column(Text)  # 摘要
    project_id = Column(UUID(as_uuid=True))  # 工事番号 (任意)
    voucher_no = Column(String(30))  # 伝票番号
    posted_by = Column(UUID(as_uuid=True))
    status = Column(String(20), default="posted")  # draft/posted/reversed
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
