# synapse_shared

Sprint 0 で各 Service が共通参照する Schema / Enum / ID 規約を集約する。

## 設計原則

- ここに置くのは Cross-Cutting な Contract のみ（ID 形式、Enum、Object 共通属性、Audit 共通属性）。
- ビジネスロジックは置かない。
- Service ごとの固有 Schema は `services/<service>/app/schemas/` に置く。

## 正本との対応

| ファイル | 正本 |
|---|---|
| `synapse_shared/ids.py` | `docs/12_Design_Review_Readiness/G1_ID_ENUM_FINALIZATION.md` の ID 規約 |
| `synapse_shared/enums.py` | 同上の Enum 群 |
| `synapse_shared/object_base.py` | `docs/09_Design_Refinement/DATA_CONTRACT_MODEL.md` の Object 共通属性 |
| `synapse_shared/audit_base.py` | `docs/12_Design_Review_Readiness/G1_AUDIT_EVENT_SCHEMA_FINALIZATION.md` |

## 依存方針

- 各 Service の `app/schemas/` から `synapse_shared.*` を import する。
- 逆方向（shared → service）の参照は禁止。
