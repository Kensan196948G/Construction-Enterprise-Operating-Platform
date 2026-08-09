# Civil-Construction-IMS 機能インベントリ

出典: `integrations/Civil-Construction-IMS/`（2026-06-17 時点スナップショット、最終 commit `51351a4b`）
技術スタック: Next.js 15 + React 19 + Tailwind + shadcn/ui / NestJS + Prisma / PostgreSQL 16 / OIDC (Entra ID) / S3-compatible storage

## 1. データモデル（Prisma、36 model / 21 enum）

| 領域 | モデル |
|---|---|
| 共通基盤 | Organization, Department, User, RefreshToken, Role, Permission, RolePermission, UserRole, Project |
| 文書・ワークフロー | DocumentCategory, Document, DocumentVersion, WorkflowDefinition, WorkflowStep, WorkflowRequest, WorkflowAction |
| 監査・是正 | AuditTrail, CorrectiveAction, AuditPlan, AuditFinding |
| ISO 9001 | QualityPlan, QualityInspection, Nonconformity |
| ISO 14001 | EnvironmentalAspect, LegalRequirement, WasteRecord |
| ISO 45001 | HazardIdentification, SafetyInspection, SafetyInspectionItem, SafetyIncident, ToolboxTalk, ToolboxTalkParticipant, NearMiss, SafetyEducation, SafetyEducationParticipant |
| ISO 55001 | Asset, AssetMaintenancePlan, AssetInspection, AssetRiskAssessment, AssetDisposal, AssetHandover |
| ISO 19650 | BimEir, BimBep, BimInformationContainer, BimCoordinationIssue |
| 通知 | Notification |
| ISMS / BCP | IsmsAsset, IsmsThreat, IsmsRiskAssessment, IsmsIncident, BcpPlan, BcpRiskScenario, BcpDrillRecord |

主要 enum: ProjectStatus / DocumentStatus / WorkflowStatus / WorkflowActionType / CorrectiveActionStatus / Severity /
AuditStatus / FindingType / FindingStatus / InspectionResult / Significance / ComplianceStatus /
SafetyInspectionStatus / IncidentType / RiskLevel / AssetCriticality / DisposalType / AssetStatus / AssetCondition /
MaintenancePlanStatus / SuitabilityCode / CdeStatus / ReviewStatus / HandoverStatus / NotificationType /
NotificationChannel / IsmsAssetType

## 2. REST API（14 モジュール・約 150 エンドポイント）

| モジュール | 代表エンドポイント |
|---|---|
| auth | POST /auth/login, /auth/refresh, /auth/logout, /auth/entra-exchange |
| users | GET /users/me, GET /users |
| projects | GET/POST /projects, GET/PUT/DELETE /projects/:id |
| documents | POST/GET /documents, GET/PUT/DELETE /documents/:id, versions, submit-review/approve/publish/withdraw, categories |
| workflow | GET/POST /workflow/requests, actions |
| audit | GET /audit/trails, /audit/plans, findings CRUD |
| corrective-actions | CRUD + PATCH /:id/close |
| quality | /quality/plans, /quality/inspections, /quality/nonconformities（CRUD+approve/result/close） |
| environment | /environment/aspects, /legal-requirements, /waste-records |
| safety | /safety/hazards, /near-misses, /educations(+participants), /toolbox-talks(+participants), /safety/inspections, /safety/incidents, /safety/dashboard |
| assets | /assets, /assets/maintenance-plans, /inspections, /risk-assessments, /disposals, /handovers |
| bim | /bim/eirs, /beps, /containers(+cde-status), /coordination-issues, /projects/:projectId/summary |
| notifications | GET /notifications, /unread-count, PATCH read/read-all, DELETE |
| analytics | /analytics/dashboard, /iso-compliance, /safety-kpi, /quality-kpi, /asset-health |
| dashboard | /dashboard/kpi |
| isms | /isms/assets, /threats, /risk-assessments, /incidents |
| bcp | /v1/bcp/plans(+approve/scenarios/drills), /v1/bcp/summary |

## 3. フロントエンド（14 画面）

login / dashboard / projects / quality / environment / safety / assets / bim / audits / corrective-actions /
documents / analytics / isms / bcp / users / settings — 全画面 CRUD ダイアログ・ステータス集計カード・ページネーション実装。

## 4. テスト

- API: 各 service/controller spec（auth/projects/users/dashboard/workflow/notifications/audit/quality/environment/safety/assets/bim/corrective-actions/analytics/isms/bcp）
- Web: 各ページ CRUD の Jest コンポーネントテスト
- E2E: Playwright（auth/crud-api/analytics/api-health）— 9 ドメイン CRUD フロー
- CI 6/6（typecheck/lint/api-test/web-test/build/security）

## 5. セキュリティ・運用

- JWT + リフレッシュトークンローテーション（bcrypt hash 保存・失効チェーン）
- Entra ID OIDC 連携（本番）/ ローカルパスワード認証
- RolesGuard + 11 役割 RBAC、組織スコープ（IDOR 対策、unique per org）
- AuditInterceptor による全 write 系の before/after/actor/IP 記録
- 論理削除（deletedAt）+ versionNo、S3/MinIO オブジェクト分離
- 依存脆弱性ゼロ（multer/tar/js-yaml/form-data overrides）
- デプロイ: Terraform + Docker Compose（nginx, prod）+ DEPLOY_CHECKLIST / OPERATIONS
