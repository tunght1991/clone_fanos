# Release Runbook

This runbook describes how to validate and hand off the MVP release candidate
locally. It does not authorize production deployment, live billing setup, or app
store packaging.

## Scope

- Release target: internal QA release candidate.
- Product scope: Phase 1 MVP.
- Primary gate: `pnpm.cmd check`.
- Supporting checklist: `docs/release-candidate-checklist.md`.

## Prerequisites

- Windows PowerShell.
- Node and `pnpm` compatible with `package.json`.
- Flutter SDK wrapper available through `flutter` or
  `D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat`.
- Docker Desktop running when database preflight is required.
- No unrelated production secrets committed or required for local validation.

## Local Validation Steps

Run from the repository root unless the command states otherwise.

1. Install dependencies:

```bash
pnpm install
```

2. Run the full release gate:

```bash
pnpm.cmd check
```

3. If API/database readiness must be validated, start local PostgreSQL:

```bash
docker compose -f infra/docker-compose.yml up -d
```

4. Run migrations:

```bash
pnpm.cmd api:migrate
```

5. Start the API for manual smoke:

```bash
pnpm.cmd api:dev
```

6. Run mobile manual smoke from `apps/mobile` if needed:

```powershell
Set-Location D:\01_Work\clone_fanos\apps\mobile
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat run
```

7. Record command and smoke results using the evidence template in
   `docs/release-candidate-checklist.md`.

## Manual Smoke Order

Use this order to reduce false failures from missing state:

1. API migration/preflight.
2. Auth onboarding/login.
3. Browse and search.
4. Detail and player/resume.
5. Favorite and bookmark.
6. Subscription entitlement flow.
7. Premium asset access gate.
8. Admin content management.

## Rollback Boundaries

These rollback notes define what can be safely reversed during release candidate
validation. They are not production rollback instructions.

| Area | Rollback or halt action | Boundary |
|---|---|---|
| Mobile release | Stop candidate promotion and keep previous build as current | Do not change entitlement rules to bypass a blocker |
| API startup | Stop API process and keep previous known-good service version | Do not edit schema as a quick fix without a reviewed migration |
| Database migration | Restore local database snapshot or recreate local container data | Production rollback requires explicit approval and backup plan |
| Admin content operations | Unpublish or revert the affected draft/content record | Do not delete audit/history records to hide a failed smoke |
| Search index | Use existing backend rollback path where available, then re-run search smoke | Do not manually mutate index aliases without owner approval |
| Subscription/billing | Halt candidate if entitlement or verify flow regresses | Live billing provider changes are out of Sprint 17 scope |

## Ship/No-Ship Decision

Use the release checklist for the final decision. The release candidate is a
ship candidate only when:

- `pnpm.cmd check` passes.
- Required MVP smoke paths pass.
- No critical blocker remains open.
- Residual risks are documented and explicitly accepted.
- Sprint checklist reflects completed release-readiness work.

If any condition fails, mark no-ship and keep the release candidate open until a
new verification run passes.

## Handoff Notes

Before handoff, provide:

- Candidate ID or commit/working-tree note.
- `pnpm.cmd check` result.
- Manual smoke evidence summary.
- Open blockers and owners.
- Accepted residual risks.
- Decision maker and ship/no-ship decision.

## Out of Scope

- Production deployment changes.
- CI workflow changes.
- App store packaging.
- Live billing provider setup.
- New product features beyond Phase 1 MVP.
