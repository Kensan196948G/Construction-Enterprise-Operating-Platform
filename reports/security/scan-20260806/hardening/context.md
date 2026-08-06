# Hardening Context

Source root: /home/kensan/Projects/Mirai-DX-Project/Construction-Enterprise-Operating-Platform
Revision: 87fb6102df5e0bc96af72208de9b611ed2ca86b0
Scan dir: <scan_dir> (see scan-manifest.json after sealing)

Evidence inputs:
- `authz-tenant-scoping` — Cross-organization access through unenforced role scope
- `authz-role-assignment` — Role assignment without grantor authority
- Threat model: `artifacts/01_context/threat_model.md`
- Coverage ledger: `artifacts/03_coverage/repository_coverage_ledger.md`
- PoCs: `artifacts/05_findings/*/poc/`
