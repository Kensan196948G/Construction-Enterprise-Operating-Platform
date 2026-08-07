"""Tests for the OS distribution 5-methods design doc (Issue 0041).

Verifies the Loop 73 deliverable doc (04a) exists and contains the
required section headers covering all 5 methods plus the PXE-focused
specifics (DHCP relay, UEFI/BIOS dual, bandwidth control, rollback,
preseed template, 5-machine rehearsal, security requirements).
"""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
# Doc filenames intentionally use fullwidth parentheses (Japanese typographical
# convention used throughout docs/05_クライアントOS/...).
DOC_PATH = (
    REPO_ROOT
    / "docs"
    / "05_クライアントOS（Client-OS）"  # noqa: RUF001
    / "04a_配布5方式詳細仕様（Distribution-5-Methods-Detailed）.md"  # noqa: RUF001
)
PARENT_DOC = (
    REPO_ROOT
    / "docs"
    / "05_クライアントOS（Client-OS）"  # noqa: RUF001
    / "04_インストール・配布設計（Installation-and-Distribution）.md"  # noqa: RUF001
)
# README.md was rewritten for non-engineers (Issue 0056, Loop 92); the
# engineer-facing "OS 配布 5 方式" summary and the 04a cross-link moved to
# docs/for-engineers.md as part of the docs split (PR #53).
ENGINEER_DOC = REPO_ROOT / "docs" / "for-engineers.md"


def test_distribution_doc_exists() -> None:
    assert DOC_PATH.exists(), f"04a doc missing: {DOC_PATH}"


def test_distribution_doc_has_all_5_methods() -> None:
    text = DOC_PATH.read_text(encoding="utf-8")
    # Each of the 5 methods must have a dedicated section.
    required_method_markers = [
        "WebUI / S3 ダウンロード",
        "VM ISO マウント",
        "USB メモリ配布",
        "PXE / iPXE + HTTP",
        "PXE + preseed 完全自動",
    ]
    for marker in required_method_markers:
        assert marker in text, f"section missing: {marker}"


def test_distribution_doc_covers_pxe_specifics() -> None:
    text = DOC_PATH.read_text(encoding="utf-8")
    # PXE-focused considerations the user explicitly required.
    pxe_markers = [
        "dnsmasq",  # DHCP+TFTP+PXE 一体型
        "grubnetx64.efi.signed",  # UEFI Secure Boot
        "pxelinux.0",  # Legacy BIOS chainload
        "DHCP Relay",  # マルチサブネット
        "limit_rate",  # nginx 帯域制御
        "preseed",  # 自動応答
        "rollback",  # 6 パターン rollback
        "Prometheus",  # 監視
    ]
    for marker in pxe_markers:
        assert marker in text, f"PXE-specific marker missing: {marker}"


def test_distribution_doc_security_requirements() -> None:
    text = DOC_PATH.read_text(encoding="utf-8")
    # Token 直埋禁止 + ephemeral + mTLS + 5 台先行リハ必須
    assert "CDX_REGISTRATION_TOKEN" in text
    assert "ephemeral" in text or "24" in text  # token expire
    assert "mTLS" in text
    assert "5 台" in text or "5台" in text  # rehearsal


def test_parent_doc_links_to_04a() -> None:
    text = PARENT_DOC.read_text(encoding="utf-8")
    assert "04a_配布5方式詳細仕様" in text, "04 must cross-reference 04a"


def test_engineer_doc_summarizes_5_methods() -> None:
    # Entry-point engineer doc must summarize the 5 methods and cross-link 04a.
    # (Previously asserted on README.md before the Issue 0056 non-engineer rewrite.)
    text = ENGINEER_DOC.read_text(encoding="utf-8")
    assert "OS 配布 5 方式" in text
    assert "04a_配布5方式詳細仕様" in text
