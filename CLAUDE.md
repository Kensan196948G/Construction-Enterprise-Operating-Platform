# ClaudeCode Guide: Construction Enterprise Operating Platform

## Mission

Create a unified enterprise operating platform for construction company governance, business portal, field OS, and AI governance.

## Source Priority

1. Use `legacy-projects/Synapse-OS` for governance, AI control, security gates, and federation concepts.
2. Use `legacy-projects/Construction-Enterprise-OS` for the business portal and user workflows.
3. Use `legacy-projects/Construction-DX-OS` for field device and client operating patterns.

## Rules

- Do not merge unrelated business apps directly into this platform.
- Keep product boundaries clear: this platform coordinates, governs, and exposes common workflows.
- Do not include real company secrets, tokens, customer data, or production credentials.
- Preserve security-first behavior: auth, audit, approval, and AI governance are core features.
- Use CMDB-DocKit as the preferred documentation and audit evidence generator.

## First Implementation Targets

1. Define platform domains: organization, user, role, device, application, workflow, policy, audit event.
2. Build a role-based dashboard with governance status, app health, field device status, and pending approvals.
3. Define adapters for CMDB, ITSM, IMS, LegalOps, BCP, and document generation.

