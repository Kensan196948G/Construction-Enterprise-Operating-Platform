"""AI 提案サマリ生成 (Azure OpenAI 連携 + テンプレ fallback).

- 入力: 案件メタ情報 (タイトル / 顧客名 / 段階 / 金額 / 説明 等)
- 出力:
  - summary: 案件サマリ (2-3 行)
  - email_skeleton: 顧客向けメール骨子
- AZURE_OPENAI_API_KEY 未設定 (or SDK 未インストール) ならテンプレ fallback。
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class ProposalSummarizeInput:
    opportunity_code: str
    title: str
    client_name: str
    stage: str
    win_probability: Decimal
    expected_amount: Decimal | None
    work_category: str | None
    description: str | None


@dataclass(frozen=True)
class ProposalSummarizeResult:
    summary: str
    email_skeleton: str
    model_used: str  # "azure_openai" | "template_fallback"


def _template_fallback(payload: ProposalSummarizeInput) -> ProposalSummarizeResult:
    amount_str = (
        f"{int(payload.expected_amount):,}円" if payload.expected_amount else "未確定"
    )
    summary = (
        f"案件「{payload.title}」({payload.client_name}様/{payload.work_category or '工種未設定'})。"
        f"現在ステージ={payload.stage}、受注確度={payload.win_probability}%、想定金額={amount_str}。"
        f"{(payload.description or '').strip()[:120]}"
    )
    email = (
        f"{payload.client_name} ご担当者様\n\n"
        f"いつもお世話になっております。\n"
        f"先日ご相談いただきました「{payload.title}」につきまして、\n"
        f"弊社にてご提案内容を整理いたしました。\n"
        f"工種: {payload.work_category or '建設工事'} / 想定金額: {amount_str}\n\n"
        f"つきましては、詳細打合せのお時間を頂戴できますと幸いです。\n"
        f"ご都合の良い日時をご教示ください。\n\n"
        f"何卒よろしくお願い申し上げます。"
    )
    return ProposalSummarizeResult(
        summary=summary, email_skeleton=email, model_used="template_fallback"
    )


def _azure_openai_summarize(
    payload: ProposalSummarizeInput,
) -> ProposalSummarizeResult | None:
    """Azure OpenAI で要約生成. 利用不可なら None."""
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")
    if not api_key or not endpoint:
        return None
    try:
        from openai import AzureOpenAI  # type: ignore[import-not-found]
    except Exception:
        return None

    try:
        client = AzureOpenAI(
            api_key=api_key,
            azure_endpoint=endpoint,
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview"),
        )
        prompt = (
            "あなたは建設業の営業支援AIです。以下の案件情報から、"
            "(1) 2-3行の案件サマリ、(2) 顧客向け提案メールの骨子、を作成してください。\n"
            f"案件コード: {payload.opportunity_code}\n"
            f"案件名: {payload.title}\n"
            f"顧客名: {payload.client_name}\n"
            f"工種: {payload.work_category or '未設定'}\n"
            f"段階: {payload.stage}\n"
            f"確度: {payload.win_probability}%\n"
            f"想定金額: {payload.expected_amount}\n"
            f"備考: {payload.description or ''}\n\n"
            "出力形式:\n"
            "[SUMMARY]\n<案件サマリ>\n[EMAIL]\n<メール本文>"
        )
        completion = client.chat.completions.create(
            model=deployment,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=600,
        )
        text = completion.choices[0].message.content or ""
        summary, email = _split_sections(text)
        return ProposalSummarizeResult(
            summary=summary, email_skeleton=email, model_used="azure_openai"
        )
    except Exception:
        return None


def _split_sections(text: str) -> tuple[str, str]:
    summary = ""
    email = ""
    if "[SUMMARY]" in text and "[EMAIL]" in text:
        try:
            after_summary = text.split("[SUMMARY]", 1)[1]
            summary_part, email_part = after_summary.split("[EMAIL]", 1)
            summary = summary_part.strip()
            email = email_part.strip()
        except Exception:
            summary = text.strip()
    else:
        summary = text.strip()
    return summary, email


def summarize_opportunity(payload: ProposalSummarizeInput) -> ProposalSummarizeResult:
    """案件サマリと顧客向けメール骨子を生成する."""
    result = _azure_openai_summarize(payload)
    if result is not None:
        return result
    return _template_fallback(payload)
