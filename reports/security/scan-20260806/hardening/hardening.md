# Hardening Portfolio

## 適用済み（v0.6.0）

1. 依存関係の high 脆弱性解消（pnpm overrides）
2. 本番スキーマの FK 制約適用（migration 004）
3. 全 mutation の監査記録（`src/api/audit.ts`）
4. JWT 失効 API + 永続化
5. JWT 期限整合性検証（iat < exp）
6. API レスポンスのセキュリティヘッダ
7. グローバルレート制限（/api/v1/*）
8. OpenAPI のパス/ライセンス整合

## 推奨（バックログ）

1. CSP nonce/hash 化
2. リクエスト相関 ID
3. TLS 終端サンプル（nginx）
4. ブラウザトークン保持方式の見直し
5. API キー失効管理 API/UI
6. SSO（OIDC/SAML）連携
7. AI ゲートウェイ接続時の許可制御・監査拡張
