# Spec: Sprint 18 - Production Readiness Evidence Closure

## Assumptions

I am making the following assumptions for Sprint 18:

1. Sprint 17 produced a valid internal QA release-candidate package, but production ship remains `NO-GO`.
2. Sprint 18 should close the remaining evidence gaps instead of adding product features.
3. Docker Desktop can be made available by the owner before API/database preflight is re-run.
4. Manual smoke can be executed against local seeded/mock data unless a dedicated release environment is assigned.
5. Production deployment, app store packaging, live billing setup, and CI changes still require explicit approval.

If any of these assumptions are wrong, revise this spec before implementation starts.

## Objective

Sprint 18 converts the Sprint 17 internal QA release candidate into a production-readiness decision package. The sprint does not deploy production. It gathers the missing evidence needed for a production ship/no-ship decision:

- local PostgreSQL, migration, API startup, and `/health` preflight evidence
- manual MVP smoke evidence
- clean candidate hygiene and handoff notes
- updated technical and release checklists
- explicit residual-risk and owner approval records

Success means another engineer can read the repo docs and know exactly whether the candidate is ready to ship, why, and what remains blocked.

## Tech Stack

- Monorepo with `apps/mobile` (Flutter), `apps/api` (NestJS/TypeScript), `apps/admin`, and `packages/shared`.
- Local infrastructure under `infra/` with Docker Compose PostgreSQL and SQL migrations.
- Root `pnpm` scripts for build, lint, typecheck, tests, and release gate.
- Release docs under `docs/`.

## Commands

Install dependencies:

```bash
pnpm install
```

Build:

```bash
pnpm.cmd build
```

Release gate:

```bash
pnpm.cmd check
```

Dependency audit:

```bash
pnpm.cmd audit --audit-level moderate
```

Start local PostgreSQL:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Run API migrations:

```bash
pnpm.cmd api:migrate
```

Start API for smoke:

```bash
pnpm.cmd api:dev
```

Health check:

```bash
curl http://localhost:3000/health
```

Mobile manual smoke:

```powershell
Set-Location D:\01_Work\clone_fanos\apps\mobile
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat run
```

## Project Structure

- `docs/sprint-18-spec.md` - Sprint 18 scope, criteria, and boundaries.
- `docs/sprint-18-implementation-plan.md` - ordered task breakdown for Sprint 18.
- `docs/sprint-18-test-cases.md` - Sprint 18 command, runtime, and manual smoke test cases.
- `docs/release-candidate-checklist.md` - release gate, smoke matrix, and evidence log to update with Sprint 18 results.
- `docs/release-runbook.md` - local validation and handoff steps to amend only if Sprint 18 discovers missing instructions.
- `docs/technical-checklist.md` - local bootstrap and migration status to update after preflight is verified.
- `docs/implementation-sprint-checklist.md` - master sprint tracking.

## Code Style

- Prefer documentation and evidence updates over runtime changes.
- Keep evidence concise: record command, result, date/time, owner, and notes; do not paste bulky logs unless needed for a blocker.
- If a helper script becomes necessary, make it a thin wrapper around existing commands and ask first before adding it.
- Keep release language precise: distinguish internal QA readiness, production readiness, and actual production deployment.

Example evidence row style:

```markdown
| API health | `curl http://localhost:3000/health` | PASS | Returned `{ "status": "ok" }` after migration |
```

## Testing Strategy

- Run `pnpm.cmd check` before marking Sprint 18 complete.
- Run `pnpm.cmd audit --audit-level moderate` before production-readiness decision.
- Run Docker/PostgreSQL, migration, API startup, and `/health` preflight after Docker Desktop is available.
- Execute and record manual MVP smoke paths from the release checklist.
- Use `docs/sprint-18-test-cases.md` as the source list for Sprint 18 evidence cases.
- If docs only change before runtime evidence is available, verify with targeted `rg` checks and leave blockers open.

## Boundaries

- Always: preserve existing MVP behavior; record evidence with date, owner, command, and result; keep release docs aligned; keep `NO-GO` if required evidence is missing.
- Ask first: production deployment, CI workflow changes, app store packaging, live billing provider setup, database schema changes, dependency additions, release tagging, or new automation scripts.
- Never: mark production-ready without API preflight and manual smoke evidence; commit secrets; weaken auth, entitlement, asset-access, or rate-limit controls; treat automated smoke as a replacement for required manual smoke.

## Success Criteria

- `pnpm.cmd check` passes on the intended candidate working tree.
- `pnpm.cmd audit --audit-level moderate` reports no known moderate/high/critical vulnerabilities.
- Docker/PostgreSQL preflight passes, migrations run, API starts, and `/health` returns `200` with `status: ok`.
- Manual MVP smoke matrix is recorded for auth, browse, search, player/resume, favorite/bookmark, subscription entitlement, asset access, admin content management, and API preflight.
- Sprint 18 test cases are represented in release evidence with PASS, FAIL, BLOCKED, or accepted N/A state.
- `docs/technical-checklist.md` no longer has local bootstrap or migration marked `DOING` once preflight passes.
- `docs/release-candidate-checklist.md` contains Sprint 18 evidence, blockers, residual risks, and a ship/no-ship decision.
- `docs/implementation-sprint-checklist.md` tracks Sprint 18 tasks and checkpoints.

## Open Questions

- Who is the Sprint 18 decision owner for final production ship/no-ship?
- Should manual smoke run only against local seeded/mock data, or is there a dedicated release environment?
- Is release tagging in scope for Sprint 18, or should the sprint stop at a clean handoff note?
