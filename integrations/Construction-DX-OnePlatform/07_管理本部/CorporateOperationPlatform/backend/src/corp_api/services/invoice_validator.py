"""適格請求書発行事業者番号検証.

形式: 'T' + 13 桁数字 (法人番号は固定 13 桁)
国税庁 適格請求書発行事業者公表サイト API (web-api.invoice-kohyo.nta.go.jp) との
疎通は本番運用時に実装。骨格段階では stub で形式検証のみ実施。
"""
from __future__ import annotations

import re
from dataclasses import dataclass

import httpx

REGISTRATION_NO_RE = re.compile(r"^T\d{13}$")


class InvalidInvoiceRegistrationNo(ValueError):
    """適格請求書発行事業者番号形式エラー."""


@dataclass
class RegistrationLookupResult:
    registration_no: str
    is_valid_format: bool
    is_registered: bool | None = None  # None = 未照会
    name: str | None = None
    note: str | None = None


def validate_format(registration_no: str) -> bool:
    """T + 13 桁数字 形式を検証."""
    if not registration_no:
        return False
    return bool(REGISTRATION_NO_RE.match(registration_no))


def assert_valid_format(registration_no: str) -> None:
    if not validate_format(registration_no):
        raise InvalidInvoiceRegistrationNo(
            f"不正な適格請求書発行事業者番号: '{registration_no}' (T + 13 桁数字 が必要)"
        )


async def lookup_registration(
    registration_no: str,
    endpoint: str | None = None,
    client: httpx.AsyncClient | None = None,
) -> RegistrationLookupResult:
    """国税庁 API への問い合わせ (stub)."""
    fmt_ok = validate_format(registration_no)
    if not fmt_ok:
        return RegistrationLookupResult(
            registration_no=registration_no,
            is_valid_format=False,
            is_registered=False,
            note="format_invalid",
        )

    if not endpoint:
        # 国税庁 API 設定がない場合は形式 OK で返す (stub)
        return RegistrationLookupResult(
            registration_no=registration_no,
            is_valid_format=True,
            is_registered=None,
            note="nta_api_not_configured",
        )

    # 本番経路 (実装スタブ)
    own_client = client is None
    c = client or httpx.AsyncClient(timeout=10.0)
    try:
        try:
            resp = await c.get(f"{endpoint}/num", params={"number": registration_no[1:]})
            if resp.status_code == 200:
                body = resp.json()
                announcements = body.get("announcement", [])
                if announcements:
                    return RegistrationLookupResult(
                        registration_no=registration_no,
                        is_valid_format=True,
                        is_registered=True,
                        name=announcements[0].get("name"),
                    )
            return RegistrationLookupResult(
                registration_no=registration_no,
                is_valid_format=True,
                is_registered=False,
                note=f"nta_status={resp.status_code}",
            )
        except httpx.HTTPError as exc:
            return RegistrationLookupResult(
                registration_no=registration_no,
                is_valid_format=True,
                is_registered=None,
                note=f"nta_api_error: {exc}",
            )
    finally:
        if own_client:
            await c.aclose()
