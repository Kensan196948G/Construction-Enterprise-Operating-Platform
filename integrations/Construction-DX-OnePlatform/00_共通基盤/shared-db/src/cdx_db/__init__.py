"""cdx-shared-db: Construction DX One Platform 共通マスタ DB モジュール。"""

from __future__ import annotations

from .base import AuditMixin, Base, CommonBase, PKMixin, TimestampMixin
from .config import DBSettings, get_db_settings
from .models import Branch, ClientOrg, Department, Employee, Material, Project
from .session import (
    dispose_engine,
    get_engine,
    get_sessionmaker,
    session_scope,
)

__all__ = [
    # base
    "Base",
    "CommonBase",
    "PKMixin",
    "TimestampMixin",
    "AuditMixin",
    # config
    "DBSettings",
    "get_db_settings",
    # session
    "get_engine",
    "get_sessionmaker",
    "session_scope",
    "dispose_engine",
    # models
    "Branch",
    "ClientOrg",
    "Department",
    "Employee",
    "Material",
    "Project",
]

__version__ = "0.1.0"
