"""自動仕訳ルールエンジン.

取引パターン (event_type + 任意の条件) を仕訳に変換する。

ルール定義 (Python list / JSON / YAML 文字列のいずれかで読み込める):

```python
[
  {
    "rule_id": "INV-RCV-01",
    "name": "請求書受領",
    "event_type": "invoice_received",
    "match": {"tax_category": "standard"},
    "debit_account_code": "1230",   # 仮払金
    "credit_account_code": "2110",  # 買掛金
    "description_template": "請求書受領 {invoice_number} / {issuer_name}",
  },
  ...
]
```

* `match` の各キーは event payload に対する完全一致条件 (None なら無条件)。
* `amount_field` で payload からの金額参照キーを変更可 (既定: amount).
* `debit_account_code` / `credit_account_code` 必須。
* `description_template` は payload を `.format(**payload)` する。

外部ファイル (YAML / JSON) は `load_rules_from_file()` で読み込める。
YAML パーサが利用できない環境を考慮し JSON フォールバックを実装。
"""
from __future__ import annotations

import json
from collections.abc import Iterable
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Any


class JournalRuleError(ValueError):
    """ルール定義不正 / マッチ失敗."""


@dataclass
class JournalRule:
    rule_id: str
    name: str
    event_type: str
    debit_account_code: str
    credit_account_code: str
    match: dict[str, Any]
    description_template: str = ""
    amount_field: str = "amount"

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> JournalRule:
        required = ("rule_id", "event_type", "debit_account_code", "credit_account_code")
        for k in required:
            if not raw.get(k):
                raise JournalRuleError(f"rule missing required key: {k}")
        return cls(
            rule_id=raw["rule_id"],
            name=raw.get("name", raw["rule_id"]),
            event_type=raw["event_type"],
            debit_account_code=raw["debit_account_code"],
            credit_account_code=raw["credit_account_code"],
            match=dict(raw.get("match") or {}),
            description_template=raw.get("description_template", ""),
            amount_field=raw.get("amount_field", "amount"),
        )

    def matches(self, payload: dict[str, Any]) -> bool:
        if payload.get("event_type") != self.event_type:
            return False
        for k, v in self.match.items():
            if payload.get(k) != v:
                return False
        return True

    def render(self, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            amt = Decimal(str(payload[self.amount_field]))
        except KeyError as e:
            raise JournalRuleError(f"payload missing amount field {self.amount_field}") from e
        desc = self.description_template
        if desc:
            try:
                desc = desc.format(**payload)
            except KeyError:
                # 欠損キーは空文字で続行 (運用許容)
                desc = self.description_template
        return {
            "rule_id": self.rule_id,
            "txn_date": payload.get("txn_date"),
            "debit_account_code": self.debit_account_code,
            "credit_account_code": self.credit_account_code,
            "amount": float(amt),
            "description": desc,
            "voucher_no": payload.get("voucher_no"),
            "project_id": payload.get("project_id"),
        }


class JournalRuleEngine:
    """ルールセットを保持し、payload から仕訳を生成する."""

    def __init__(self, rules: Iterable[JournalRule] | None = None) -> None:
        self._rules: list[JournalRule] = list(rules or [])

    @property
    def rules(self) -> list[JournalRule]:
        return list(self._rules)

    def add_rule(self, rule: JournalRule | dict[str, Any]) -> JournalRule:
        r = rule if isinstance(rule, JournalRule) else JournalRule.from_dict(rule)
        self._rules.append(r)
        return r

    def load(self, raw_rules: Iterable[dict[str, Any]]) -> None:
        for r in raw_rules:
            self.add_rule(r)

    def apply(self, payload: dict[str, Any]) -> dict[str, Any]:
        """1件の payload にマッチする最初のルールで仕訳を生成."""
        for r in self._rules:
            if r.matches(payload):
                return r.render(payload)
        raise JournalRuleError(
            f"no rule matched for event_type={payload.get('event_type')}"
        )

    def apply_many(self, payloads: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
        return [self.apply(p) for p in payloads]


# 既定の最小ルールセット (Loop #6 時点での運用想定)
DEFAULT_RULES: list[dict[str, Any]] = [
    {
        "rule_id": "INV-RCV-STD",
        "name": "請求書受領 (標準税率)",
        "event_type": "invoice_received",
        "match": {"tax_category": "standard"},
        "debit_account_code": "1230",
        "credit_account_code": "2110",
        "description_template": "請求書受領 {invoice_number} / {issuer_name}",
    },
    {
        "rule_id": "INV-RCV-RDC",
        "name": "請求書受領 (軽減税率)",
        "event_type": "invoice_received",
        "match": {"tax_category": "reduced"},
        "debit_account_code": "1231",
        "credit_account_code": "2110",
        "description_template": "請求書受領 (軽減) {invoice_number}",
    },
    {
        "rule_id": "PAYROLL-PAY",
        "name": "給与振込",
        "event_type": "payroll_payment",
        "match": {},
        "debit_account_code": "6110",
        "credit_account_code": "1110",
        "description_template": "給与振込 {period}",
    },
    {
        "rule_id": "SALES-CASH",
        "name": "現金売上",
        "event_type": "sales_cash",
        "match": {},
        "debit_account_code": "1110",
        "credit_account_code": "4110",
        "description_template": "売上計上 {description}",
    },
]


def load_rules_from_file(path: str | Path) -> list[dict[str, Any]]:
    """JSON or YAML ファイル -> raw rule list."""
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if p.suffix.lower() in (".yaml", ".yml"):
        try:
            import yaml  # type: ignore[import-not-found]
        except ImportError:
            # YAML を JSON 互換とみなす (PyYAML 未導入環境フォールバック)
            return json.loads(text)
        loaded = yaml.safe_load(text)
        if not isinstance(loaded, list):
            raise JournalRuleError("rule file root must be a list")
        return loaded
    return json.loads(text)


def build_default_engine() -> JournalRuleEngine:
    engine = JournalRuleEngine()
    engine.load(DEFAULT_RULES)
    return engine
