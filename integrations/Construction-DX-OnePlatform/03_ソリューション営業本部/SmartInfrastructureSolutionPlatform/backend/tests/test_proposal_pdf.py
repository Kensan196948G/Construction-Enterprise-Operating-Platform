"""提案書 PDF レンダラのユニットテスト."""

from __future__ import annotations

from decimal import Decimal

import pytest

from sol_api.services.proposal_pdf import (
    FsSection,
    PfiSection,
    ProposalPdfInput,
    SolutionLine,
    render_proposal_pdf,
)


pytest.importorskip("fpdf", reason="fpdf2 not installed")


def _sample_input() -> ProposalPdfInput:
    return ProposalPdfInput(
        proposal_code="P-001",
        client_name="Yokohama Port Authority",
        theme="Port DX & PFI Combined Proposal",
        description="Container yard automation + renewable energy.",
        expected_amount=Decimal("250000000"),
        proposal_deadline="2026-09-30",
        primary_category="port_dx",
        owner_name="E001",
        solutions=[
            SolutionLine(
                name="Container Yard DX",
                category="port_dx",
                quantity=Decimal("1"),
                unit_price=Decimal("100000000"),
                amount=Decimal("100000000"),
            ),
            SolutionLine(
                name="Solar PV",
                category="renewable_energy",
                quantity=Decimal("2"),
                unit_price=Decimal("50000000"),
                amount=Decimal("100000000"),
            ),
        ],
        fs=FsSection(
            technical=Decimal("85"),
            legal=Decimal("70"),
            environment=Decimal("75"),
            business=Decimal("80"),
            total=Decimal("78.5"),
            decision="GO",
        ),
        pfi=PfiSection(
            npv=1234567.89,
            irr=0.083,
            vfm=0.12,
            payback_years=8,
            is_viable=True,
        ),
        expected_benefits=["throughput +30%", "CO2 -25%"],
        appendix="See related case studies.",
    )


def test_render_proposal_pdf_returns_pdf_bytes() -> None:
    pdf = render_proposal_pdf(_sample_input())
    assert isinstance(pdf, bytes)
    # PDF magic header
    assert pdf.startswith(b"%PDF-")
    # 主要 PDF 構造マーカ
    assert b"%%EOF" in pdf
    # 妥当なサイズ (空 PDF より大きい)
    assert len(pdf) > 2000


def test_render_proposal_pdf_handles_minimal_input() -> None:
    """F/S, PFI, ソリューション全て無くてもクラッシュしない."""
    inp = ProposalPdfInput(
        proposal_code="P-MINI",
        client_name="ABC",
        theme="Minimal Proposal",
        description=None,
        expected_amount=None,
        proposal_deadline=None,
        primary_category=None,
        owner_name=None,
    )
    pdf = render_proposal_pdf(inp)
    assert pdf.startswith(b"%PDF-")
    assert len(pdf) > 1000
