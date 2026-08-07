"""共通レスポンス / エラーモデル.

cdx-shared-auth と整合した形式:
  成功: {"status":"success","data":{...},"meta":{...}}
  失敗: {"status":"error","error":{"code":"...","message":"...","details":[...]}}
"""
from __future__ import annotations

from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """個別エラー詳細."""

    field: str | None = Field(default=None, description="該当フィールド")
    issue: str = Field(description="エラー内容")


class ErrorBody(BaseModel):
    """エラー本体."""

    code: str = Field(description="エラーコード (例: UNAUTHORIZED, BAD_GATEWAY)")
    message: str = Field(description="人間可読メッセージ")
    details: list[ErrorDetail] = Field(default_factory=list, description="詳細リスト")


class ErrorResponse(BaseModel):
    """共通エラーレスポンス."""

    status: Literal["error"] = "error"
    error: ErrorBody


class SuccessResponse(BaseModel, Generic[T]):
    """共通成功レスポンス."""

    status: Literal["success"] = "success"
    data: T
    meta: dict[str, Any] = Field(default_factory=dict)


def make_error(code: str, message: str, details: list[ErrorDetail] | None = None) -> dict[str, Any]:
    """エラーレスポンス dict を生成."""
    return ErrorResponse(
        error=ErrorBody(code=code, message=message, details=details or [])
    ).model_dump()


def make_success(data: Any, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    """成功レスポンス dict を生成."""
    return {"status": "success", "data": data, "meta": meta or {}}


# OpenAPI で参照する共通レスポンス
COMMON_ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    400: {"model": ErrorResponse, "description": "不正なリクエスト"},
    401: {"model": ErrorResponse, "description": "未認証"},
    403: {"model": ErrorResponse, "description": "権限不足"},
    404: {"model": ErrorResponse, "description": "リソース未検出"},
    429: {"model": ErrorResponse, "description": "レート制限超過"},
    500: {"model": ErrorResponse, "description": "サーバ内部エラー"},
    502: {"model": ErrorResponse, "description": "バックエンド到達不可"},
    503: {"model": ErrorResponse, "description": "サービス利用不可"},
    504: {"model": ErrorResponse, "description": "バックエンド応答タイムアウト"},
}
