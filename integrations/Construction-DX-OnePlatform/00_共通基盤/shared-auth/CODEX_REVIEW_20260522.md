# 🔍 Codex Review — shared-auth (2026-05-22)

**全体評価**: 🟠 大幅再設計要 (本番投入前に認証・認可・セッション境界を再設計)

## 🔴 High (Loop #2 で必須対応)

| # | 位置 | 指摘 | 修正方針 |
|:---:|:---|:---|:---|
| H1 | `jwks.py:17-30` | 未知 `kid` でJWKSを強制リフレッシュしない → Entra ID鍵ローテーション直後に正当トークン拒否 | 未一致時に一度だけ強制リフレッシュ |
| H2 | `dependencies.py:27` | JWKS取得失敗時の例外処理なし → 500化リスク | 例外を401/503に明示変換、既存キャッシュ短期利用許容 |
| H3 | `session.py:22-30` | Redisキーが境界を含まない → テナント/アプリ間混線リスク | `cdx:session:{tenant_id}:{app_id}:{session_id}` 形式 |
| H4 | `rbac.py:7-34` | Entra ID `groups` claim はObject IDだが名称風キーで写像 → 認可不能 | Object IDベース許可リストに変更、設定変更を監査対象 |

## 🟡 Medium (Loop #2-3 対応)

| # | 位置 | 指摘 | 修正方針 |
|:---:|:---|:---|:---|
| M1 | `config.py:20`, `dependencies.py:35` | JWTアルゴリズム可変設定 | RS256固定 or 厳格ホワイトリスト |
| M2 | `dependencies.py:22,41`, `middleware.py:31-32` | JWT例外内容を外部レスポンスに含めている → 情報漏洩 | 外部は固定文言、詳細は秘匿ログ |
| M3 | `middleware.py:12,23` | `/docs` `/openapi.json` 常時PUBLIC | 本番では無効化 or 管理者認証下 |
| M4 | `session.py:22-23` | TTL の下限・上限・必須性検証なし | 設定で強制 |
| M5 | `config.py:13,18,26` | secret/passwordが通常 `str` | `SecretStr` 型に変更、ログ方針追加 |

## 🔵 Low (継続的改善)

| # | 位置 | 指摘 |
|:---:|:---|:---|
| L1 | `dependencies.py:36-37` | `jwt_audience` 既定値 `"construction-dx"` が本番で誤使用される余地 |
| L2 | `dependencies.py:52` | `tid` 欠落時の補完が監査曖昧化 → `tid` 必須化 |
| L3 | `config.py:16-18` | HENNGE設定はあるが検証処理未実装 (現状Entra IDのみ) |
| L4 | `middleware.py:23` | `/static/` 前方一致のみ → 正規化済みパス判定が安全 |

## 📋 要点

1. **JWKSローテーション耐性なし** → 鍵更新時に認証停止リスク
2. **RBAC写像キーが Object ID でない** → 認可ロジック実運用不可
3. **Redisセッションキーに境界なし** → マルチアプリで衝突可能
4. **エラー情報漏洩** → 認証エラーの内部情報外部露出

## ➡️ Loop #2 Improvement バックログ反映

- F-AUTH-FIX-001 (H1+H2): JWKS 強制リフレッシュ + 例外ハンドリング
- F-AUTH-FIX-002 (H3): Redisキー境界化
- F-AUTH-FIX-003 (H4): RBAC Object IDベース化 + 監査
- F-AUTH-FIX-004 (M1-M5): アルゴリズム固定/エラー秘匿/PUBLIC_PATHS設定化/TTL検証/SecretStr化
- F-AUTH-FIX-005 (L1-L4): aud検証強化/tid必須/HENNGE実装/path正規化

---

## ✅ Loop #2 修正サマリ (2026-05-22)

| ID | 指摘 | 修正内容 | 検証 |
|:---:|:---|:---|:---|
| H1 | 未知 kid で JWKS リフレッシュなし | `jwks.py` で未一致時に強制リフレッシュ実装、30秒のrate-limit付き | test_jwks.py::test_unknown_kid_triggers_force_refresh / test_force_refresh_is_rate_limited |
| H2 | JWKS取得失敗で500化 | `AuthInfraError` 導入、grace_seconds 内なら旧キャッシュ再利用、上位で 503 変換 | test_jwks.py::test_fetch_failure_serves_stale_cache_within_grace / test_fetch_failure_with_no_cache_raises |
| H3 | Redisキー境界欠如 | `cdx:session:{app_id}:{tenant_id}:{session_id}` 形式に変更、TTL検証も追加 | コード上で `_key` メソッド分離 |
| H4 | RBAC名称風キー | `CDX_GROUP_ROLE_MAP` 環境変数 (JSON, Object ID キー) で動的ロード、GUID検証、監査ログ | test_rbac.py::test_map_non_guid_rejected / test_case_insensitive_guid |
| M1 | アルゴリズム可変 | `ALLOWED_JWT_ALGORITHMS = {RS256/384/512}` ホワイトリスト + field_validator | config.py 起動時検証 |
| M2 | エラー詳細漏洩 | 外部応答は `invalid_token` / `auth_unavailable` 固定、詳細は `log.info/error` のみ | dependencies.py / middleware.py |
| M3 | /docs 常時公開 | `EXPOSE_OPENAPI=false` 既定、`PUBLIC_PATHS_EXTRA` で柔軟設定 | config.py::public_paths |
| M4 | TTL 検証欠如 | `session_ttl_min/max` (60s-86400s) + 正数強制 | session.py::_validate_ttl |
| M5 | 秘密情報が str | `SecretStr` 型に変更 (entra_client_secret, hennge_client_secret, redis_password) | config.py |
| L2 | tid 補完 | tid 必須化、tenant_id 不一致は 401 | dependencies.py::_verify_bearer |

### 残課題 (Loop #3 以降)
- L1 (audience 既定値拒否): 既に完了 (`_refuse_default_audience` validator)
- L3 (HENNGE SSO 実装): 別 issuer 用 JWKS チェーンを追加する設計が必要
- L4 (静的パス正規化): `_normalized_path` で対応済、ただし WAF レイヤーでの追加検証推奨

---

## 🔁 Codex Re-review (Loop #3, 2026-05-22)

**判定: 軽微修正後可** (本番投入Ready 一歩手前)

| 指摘 | Re-review 判定 |
|:---:|:---|
| H1 | ✅ Fixed |
| H2 | ⚠ Partial → **Loop #3 で即修正** middleware が HTTPException を catch-all で 401 化していたため、`except HTTPException` を明示追加し 503 を保持 |
| H3 | ✅ Fixed |
| H4 | ✅ Fixed |
| M1-M5 | ✅ Fixed |
| 新規問題 | なし |

最終判定: H2 修正後は Production Ready 相当 (本番では HENNGE SSO 実装と WAF 連携を Loop #4+ で対応)。

---

## 🌐 Loop #4 — HENNGE SSO 実装 (Codex L3 対応)

| 変更 | ファイル | 説明 |
|:---|:---|:---|
| 新規 | `src/cdx_auth/issuer_chain.py` | `IssuerChain` — 複数信頼 IdP の JWKSCache を管理 |
| 編集 | `config.py` | `HENNGE_JWKS_URI` / `HENNGE_AUDIENCE` 追加。`trusted_issuers()` / `hennge_enabled()` |
| 編集 | `dependencies.py` | token の `iss` claim を見て JWKSCache を切替、issuer 別 audience で検証、未登録 issuer 即拒否 |
| 編集 | `__init__.py` | `IssuerChain` を公開API に追加 |
| 編集 | `.env.example` | HENNGE 3変数の説明 |
| 新規 | `tests/test_issuer_chain.py` | Entra単独 / HENNGE 有効 / 部分設定スキップ / 未登録 issuer 拒否 の4ケース |

L3 ステータス: ⚠ Partial → ✅ **Fixed** (HENNGE 3変数が揃った時のみ HENNGE 発行 JWT を受け入れる動的 enable)。

---

## 🔁 Codex 3回目レビュー (Loop #5, 2026-05-22)

**HENNGE SSO 実装は中核設計妥当 / High なし**。Medium 2件 → 即修正済。

| 指摘 | 修正 | 検証 |
|:---|:---|:---|
| M1: HENNGE_ISSUER/JWKS_URI に HTTPS必須/制御文字拒否/整合確認なし | `_validate_hennge_url` field_validator 追加: HTTPS必須/whitespace拒否/制御文字拒否 + `hennge_enabled()` で issuer host と JWKS host の整合確認 | test_config_hennge_url.py 5件 |
| M2: 実 JWT 検証経路のテスト不足 (IssuerChain登録確認のみ) | `tests/test_dependencies_path.py` 4件追加: 未登録issuer 即拒否 / HENNGE→HENNGE audience / Entra→Entra audience / 不一致 tid 拒否 | dependency-level integration |

**運用注意 (Codex指摘5項目)**:
1. `HENNGE_ISSUER` はトークン `iss` と完全一致 (末尾スラッシュ差異も拒否)
2. `HENNGE_JWKS_URI` は HENNGE 公式 discovery 由来の HTTPS のみ → issuer host 配下に限定する整合確認実装済
3. AuthSettings/IssuerChain は import 時に初期化 → 設定変更後はアプリ再起動必須
4. `CDX_GROUP_ROLE_MAP` 未設定で RBAC 既定拒否、HENNGE groups 形式が異なる場合は別マッピング設計
5. `auth: untrusted issuer` / `unknown kid` / `JWKS force-refreshed` ログ急増を SIEM/Wazuh で監視

**最終判定**: ✅ **Production Ready** (Medium 修正完了 / High なし / Codex 全指摘消化)

---

## 🔁 Codex 4回目レビュー (Loop #7, 2026-05-22)

**判定: Conditional Pass → CTO 即修正で Final Sign-off**

過去 High/Medium は全て close 済み (Codex 確認)。新規指摘:

| ID | 位置 | 指摘 | 修正 (Loop #7) |
|:---:|:---|:---|:---|
| M-New-1 | `jwks.py:41-45,66-68` | JWKS 応答が non-dict / keys 欠落 / keys 非list の場合 AuthInfraError に正規化されず 500 化余地 | `_fetch()` で payload が `dict` かつ `keys` が `list` であることを検証 → 不正なら `AuthInfraError`。test_jwks_shape.py 5件追加 |
| L-New-1 | `dependencies.py:95-97` | HENNGE issuer で `tid` 欠落時に Entra tenant にフォールバック → 監査曖昧 | `HENNGE_TENANT_ID` 環境変数を新設 + フォールバック順序: `tid` → `hennge_tenant_id` → `hennge:{issuer_host}` |

### 本番運用監視メトリクス (Codex推奨)
| メトリクス | 閾値 | 検知意図 |
|:---|:---:|:---|
| `auth_unavailable` / 503 rate | 5分で 1% | JWKS/IdP 可用性障害 |
| `auth: untrusted issuer` | 5分で 10件 | issuer 偽装 / 設定不一致 |
| `auth: unknown kid` / `JWKS force-refreshed` | 5分で 5件 | 鍵ローテ / kid攻撃 / JWKS同期不良 |
| `HENNGE_JWKS_URI host... disabling HENNGE` | 1件 | HENNGE 設定ミス / 不正URL混入 |
| `rbac config rejected` / RBAC deny急増 | deploy / 設定変更後の急増 | Group Object ID 設定ミス |

**ステータス**: ✅ **Final Sign-off** (Loop #7 修正後)。Conditional → Pass。

