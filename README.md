# Construction Enterprise Operating Platform

Construction Enterprise Operating Platform は、建設会社の業務ポータル、端末・現場 OS 領域、統制・AI ガバナンスを統合する上位基盤です。

## 統合元

| 旧プロジェクト | 位置付け |
|---|---|
| `legacy-projects/Synapse-OS` | 統制、Federation、AI Governance、監査ゲートの中核。 |
| `legacy-projects/Construction-Enterprise-OS` | 業務ポータル、現場・本社・経営・監査の統合画面。 |
| `legacy-projects/Construction-DX-OS` | 端末、現場クライアント基盤、標準運用の参照元。 |

## 開発方針

1. `Synapse-OS` をガバナンスと統制ルールの正本候補にする。
2. `Construction-Enterprise-OS` を初期ユーザー体験とポータル構成の正本候補にする。
3. `Construction-DX-OS` を現場端末・標準クライアント・オフライン運用の参照元にする。
4. CMDB-DocKit と連携し、統制文書、監査証跡、運用手順を生成可能にする。
5. 各業務システムはこの基盤へ直接吸収せず、アプリ連携として扱う。

## 想定モジュール

| モジュール | 役割 |
|---|---|
| Enterprise Portal | 本社、支店、現場、経営、監査向けの統合入口。 |
| Governance Core | 権限、承認、AI利用統制、監査ゲート。 |
| Field OS | 現場端末、オフライン、標準設定、利用状況。 |
| Workflow Hub | 承認、通知、タスク、証跡。 |
| Document Control | CMDB-DocKit と連携した規程・手順・監査資料。 |

## Legacy Projects

`legacy-projects` 配下は統合設計の参照元です。正本化した仕様は新規プロジェクト側へ移植し、移植済み範囲を記録してから整理します。

