"""Synapse-OS Knowledge Service (BL-011).

Sprint 2 で「Knowledge Item Object + Lineage Graph + Retention」を最小実装する。
DLP 最終判断を持たず Policy Service に委譲する点 (SERVICE_RESPONSIBILITY_MODEL.md) と、
AI 由来 Knowledge は ai_action_id 付き lineage edge を強制する点 (DATA_LINEAGE_MODEL.md)
の二点が本サービスの恒等条件。
"""
