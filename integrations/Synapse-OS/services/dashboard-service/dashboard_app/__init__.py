"""dashboard-service (BL-010).

Synapse-OS Enterprise Dashboard の集計 API。
SERVICE_RESPONSIBILITY_MODEL に従い、本 service は以下を持たない:

    - 業務状態の直接変更 (POST/PUT/DELETE エンドポイントを公開しない)
    - Object の永続化 (Issue / Approval / Audit Event の所有権なし)
    - Policy 最終判断

Object Service / Workflow Service / Audit Service の REST API を読み込んで
G1_MVP_SCREEN_FIELD_LIST.md の Dashboard 必須項目を返すだけ。
"""
