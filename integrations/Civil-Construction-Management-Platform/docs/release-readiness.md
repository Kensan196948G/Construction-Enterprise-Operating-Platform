# Release Readiness Notes

Date: 2026-06-27

## Scope

This controlled project note tracks the current pre-release gates for the unified Civil Construction Management Platform. It uses only sample/demo data and keeps IMS, audit, corrective action, evidence, and audit-log requirements explicit.

## Current Evidence

| Gate                        | Evidence                                                                                       | Status                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| API type safety             | `pnpm --filter @construction-mgmt/api typecheck`                                               | Pass                                                                                                  |
| Web type safety             | `pnpm --filter @construction-mgmt/web typecheck`                                               | Pass                                                                                                  |
| API unit tests              | `pnpm --filter @construction-mgmt/api test -- --runInBand`                                     | Pass: 18 suites / 314 tests                                                                           |
| API coverage                | `pnpm --filter @construction-mgmt/api exec jest --coverage --runInBand`                        | Last full coverage pass: 16 suites / 288 tests; rerun after RBAC spec addition before release signoff |
| API lint                    | `pnpm --filter @construction-mgmt/api lint`                                                    | Pass                                                                                                  |
| Web production build        | `nvm use 22.22.3 && pnpm --filter @construction-mgmt/web build`                                | Pass                                                                                                  |
| Root workspace build        | `nvm use 22.22.3 && pnpm build`                                                                | Pass                                                                                                  |
| Root workspace lint         | `nvm use 22.22.3 && pnpm lint`                                                                 | Pass                                                                                                  |
| Production dependency audit | `nvm use 22.22.3 && pnpm audit --prod`                                                         | Pass: no known vulnerabilities                                                                        |
| Browser E2E smoke           | `nvm use 22.22.3 && pnpm test:e2e`                                                             | Pass: Firefox, 2 smoke tests including IMS NC/CA/Evidence create/detail/audit trail                    |
| API container image         | `docker build -f apps/api/Dockerfile -t ccmp-api:verify-runner .`                              | Pass                                                                                                  |
| Web container image         | `docker build -f apps/web/Dockerfile -t ccmp-web:verify-runner .`                              | Pass                                                                                                  |
| Web container runtime       | `docker run ... ccmp-web:verify-runner` + `curl -fsSI http://127.0.0.1:3103/login`             | Pass: Next standalone starts from `/app/apps/web/server.js` and returns 200                           |
| Production compose config   | `docker compose -f docker-compose.yml -f docker-compose.prod.yml config` with required secrets | Pass: dev ports/mounts reset; uploads volume retained                                                 |
| nginx proxy syntax          | `docker run --add-host web:127.0.0.1 --add-host api:127.0.0.1 ... nginx -t`                    | Pass                                                                                                  |
| RBAC role normalization     | `pnpm --filter @construction-mgmt/api test -- roles.guard.spec.ts --runInBand`                 | Pass: seeded `Admin` / `SiteManager` / `Auditor` / `ISOAuditor` match protected routes                |

## Migrated Workflow Acceptance Criteria

| Workflow                           | Acceptance Criteria                                                                                                                                               | Verification Steps                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Work item management               | Tenant-scoped work items can be listed, created, updated, completed, cancelled, and soft-deleted without exposing deleted records or foreign sites.               | API unit tests for `work-items.service`; dashboard page uses `useWorkItems`.          |
| Inspection management              | Tenant-scoped inspections can be listed, created, updated, soft-deleted, and managed with checklist items without exposing foreign sites.                         | API unit tests for `inspection.service`; dashboard page uses `useInspections`.        |
| Nonconformity to corrective action | NC records keep ISO/IMS grade and status, can link corrective actions and evidence, and retain audit context.                                                     | API unit tests for nonconformities, corrective actions, evidence, and audit services. |
| Evidence and audit trail           | Evidence references tenant-scoped NC/CA records, rejects mismatched parents, and audit log writes tolerate logging failures without breaking business operations. | `audit.service.spec.ts`, `audit.controller.spec.ts`, `evidence.service.spec.ts`, and IMS Playwright smoke. |
| IMS vertical slice create/detail UI | Users can register NC records, create linked corrective actions, attach evidence, view detail screens, and follow NC/CA/evidence links without leaving the IMS workflow. | `pnpm test:e2e` with `ims-vertical-slice.spec.ts`. |

## Remaining Release Gates

| Gate                                | Status            | Next Action                                                                                                                                                                                                                                                                 |
| ----------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser E2E smoke                   | IMS baseline complete | CI now includes Firefox standalone smoke for critical pages and the NC → CA → Evidence → audit-log vertical slice. Chromium/Chrome SIGTRAPs on this host, so validate Chromium on a compatible CI runner before final release.                                      |
| Container image build/runtime       | Complete          | API/Web runner images build successfully with Node 22; Web runner starts and serves `/login`.                                                                                                                                                                               |
| Reverse proxy routing               | Baseline complete | nginx now routes `/api/auth/*` to NextAuth, `/api/backend/*` to NestJS, and keeps `/api/*` compatibility paths for API docs. Add full nginx E2E before final release.                                                                                                       |
| Security review                     | Baseline complete | `pnpm audit --prod` has no known vulnerabilities after NestJS 11 / bcrypt 6 / uuid 11 updates. Add SBOM, CodeQL, and secret scanning before final release.                                                                                                                  |
| Tenant isolation                    | Baseline complete | Project, Site, WorkItem, Inspection, and Evidence write/read paths now derive tenant scope from `req.user.organizationId` and reject foreign parents. Add route-level two-organization API/E2E tests before final release signoff.                                          |
| NC/CA/Evidence audit trail          | E2E baseline complete | Nonconformity, corrective action, and evidence create workflows now have browser-driven audit-log verification. Broaden coverage to update/close/delete and end-user audit-log UI review before final signoff.                                                             |
| IMS vertical slice create/detail UI | E2E baseline complete | `/nonconformities/new`, `/corrective-actions/new`, `/evidence/new`, and detail pages now have Firefox E2E coverage for create/detail/link flow. Add CA verification and file download coverage before final signoff.                                                    |
| GitHub Projects update              | Target ambiguous  | `gh` has project scope and PR #10 is open with green CI/CodeRabbit, but the PR has no project items. Candidate project #32 targets legacy `Civil-Construction-IMS`; #34 appears unrelated draft milestones. No Project update was made to avoid writing to the wrong board. |
