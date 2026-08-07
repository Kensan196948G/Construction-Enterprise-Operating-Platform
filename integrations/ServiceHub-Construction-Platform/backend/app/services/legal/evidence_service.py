"""Legal Evidence Service — 法的証跡タイムライン管理（建設業法 帳簿備付け義務対応）"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.legal import LegalEvidenceRepository
from app.schemas.legal import (
    EvidenceVerifyResult,
    LegalEvidenceCreate,
    LegalEvidenceResponse,
    LegalEvidenceTimeline,
)


class EvidenceNotFoundError(NotFoundError):
    detail = "法的証跡が見つかりません"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _compute_evidence_hash(
    project_id: uuid.UUID | str,
    source_type: str,
    title: str,
    event_date: object,
    description: str | None = None,
) -> str:
    """法的証跡の改ざん検知用 SHA-256 ベースラインハッシュを計算する。

    入力正規化:
    - description: None → '' として扱う（決定論的な計算のため）
    - metadata_json は含まない（外部提供の任意データのため）
    """
    desc_normalized = description or ""
    raw = f"{project_id}:{source_type}:{title}:{event_date}:{desc_normalized}"
    return hashlib.sha256(raw.encode()).hexdigest()


class EvidenceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = LegalEvidenceRepository(db)

    async def add_evidence(
        self,
        data: LegalEvidenceCreate,
        created_by: uuid.UUID,
    ) -> LegalEvidenceResponse:
        """法的証跡を追加する。

        content_hash が指定されない場合は project_id + source_type + title +
        event_date + description (正規化) の SHA-256 を自動計算。
        """
        if data.content_hash is None:
            # Auto-compute SHA-256 baseline for tamper detection
            auto_hash = _compute_evidence_hash(
                project_id=data.project_id,
                source_type=data.source_type,
                title=data.title,
                event_date=data.event_date,
                description=data.description,
            )
            data = data.model_copy(update={"content_hash": auto_hash})
        evidence = await self.repo.create(data, created_by=created_by)
        return LegalEvidenceResponse.model_validate(evidence)

    async def get_timeline(
        self,
        project_id: uuid.UUID,
        source_type: str | None = None,
        limit: int = 100,
    ) -> LegalEvidenceTimeline:
        """プロジェクトの証跡タイムラインを取得し整合性チェックを行う。"""
        entries = await self.repo.get_timeline(
            project_id=project_id,
            source_type=source_type,
            limit=limit,
        )
        total = await self.repo.count_by_project(project_id)

        # Quick integrity check: verify stored hashes exist
        # (deep re-hash is via verify endpoint)
        integrity_ok = all(e.content_hash is not None for e in entries)

        return LegalEvidenceTimeline(
            project_id=project_id,
            total_entries=total,
            entries=[LegalEvidenceResponse.model_validate(e) for e in entries],
            integrity_ok=integrity_ok,
            evaluated_at=datetime.now(timezone.utc),
        )

    async def verify_integrity(self, project_id: uuid.UUID) -> EvidenceVerifyResult:
        """全証跡のハッシュ存在確認と再計算による改ざん検知を行う（Fail-Closed）。

        設計方針 (Fail-Closed):
        - ハッシュ形式エラー（64桁16進以外）→ 改ざん判定
        - ハッシュ未設定 → 改ざん判定
        - 再計算値と不一致 → 改ざん判定（外部提供ハッシュも含む）
        ※ 外部提供ハッシュ（ドキュメントの SHA-256 等）は検証不能のため
          改ざんフラグを立て、担当者による手動確認を促す。
        TODO: is_auto_hash カラムを追加し、自動計算分のみ比較対象とする
              (https://github.com/kensan/ServiceHub-Construction-Platform/issues/TBD)
        """
        entries = await self.repo.get_timeline(project_id=project_id, limit=10000)

        tampered_ids: list[uuid.UUID] = []
        for entry in entries:
            if entry.content_hash is None:
                # Missing hash = cannot verify = potential tampering
                tampered_ids.append(entry.id)
                continue

            # Validate hash format (must be 64-char lowercase hex)
            if len(entry.content_hash) != 64 or not all(
                c in "0123456789abcdef" for c in entry.content_hash.lower()
            ):
                tampered_ids.append(entry.id)
                continue

            # Re-compute baseline hash and compare (fail-closed)
            expected = _compute_evidence_hash(
                project_id=entry.project_id,
                source_type=entry.source_type,
                title=entry.title,
                event_date=entry.event_date,
                description=entry.description,
            )
            if entry.content_hash != expected:
                # Mismatch: externally supplied hash OR tampered metadata.
                # Fail-closed: flag for manual review.
                tampered_ids.append(entry.id)

        now = datetime.now(timezone.utc)
        return EvidenceVerifyResult(
            project_id=project_id,
            total_checked=len(entries),
            hash_mismatches=len(tampered_ids),
            tampered_ids=tampered_ids,
            integrity_ok=len(tampered_ids) == 0,
            verified_at=now,
        )

    async def get_evidence(self, evidence_id: uuid.UUID) -> LegalEvidenceResponse:
        ev = await self.repo.get_by_id(evidence_id)
        if not ev:
            raise EvidenceNotFoundError()
        return LegalEvidenceResponse.model_validate(ev)
