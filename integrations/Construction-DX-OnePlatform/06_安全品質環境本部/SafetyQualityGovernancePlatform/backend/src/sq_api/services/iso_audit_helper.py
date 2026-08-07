"""ISO 9001 / 14001 / 45001 監査チェックリストテンプレート."""
from __future__ import annotations

from typing import Literal

IsoStandard = Literal["ISO9001", "ISO14001", "ISO45001"]


CHECKLIST_TEMPLATES: dict[str, list[dict]] = {
    "ISO9001": [
        {"clause": "4.1", "item": "組織及びその状況の理解"},
        {"clause": "5.1", "item": "リーダーシップ及びコミットメント"},
        {"clause": "6.1", "item": "リスク及び機会への取組み"},
        {"clause": "7.1", "item": "資源 (人/インフラ/環境)"},
        {"clause": "8.1", "item": "運用の計画及び管理"},
        {"clause": "9.1", "item": "監視・測定・分析・評価"},
        {"clause": "10.2", "item": "不適合及び是正処置"},
    ],
    "ISO14001": [
        {"clause": "4.2", "item": "利害関係者のニーズ・期待"},
        {"clause": "6.1.2", "item": "環境側面の特定"},
        {"clause": "6.1.3", "item": "順守義務 (法規制等)"},
        {"clause": "8.2", "item": "緊急事態への準備・対応"},
        {"clause": "9.1.2", "item": "順守評価"},
    ],
    "ISO45001": [
        {"clause": "5.4", "item": "労働者の協議及び参加"},
        {"clause": "6.1.2", "item": "危険源の特定 (ハザード同定)"},
        {"clause": "6.1.3", "item": "法的及びその他の要求事項"},
        {"clause": "8.1.2", "item": "危険源の除去及び OH&S リスクの低減"},
        {"clause": "10.2", "item": "インシデント・不適合及び是正処置"},
    ],
}


def get_checklist(standard: IsoStandard) -> list[dict]:
    """指定 ISO 規格の監査チェックリスト雛形を返す."""
    return CHECKLIST_TEMPLATES.get(standard, [])
