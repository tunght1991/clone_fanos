# Spec: Sprint 17 - Release Candidate Operational Readiness

## Assumptions

I am making the following assumptions for Sprint 17:

1. Sprint 16 closed the remaining mobile release blockers and `pnpm.cmd check` is green.
2. Sprint 17 is a release-candidate readiness sprint, not a new product feature sprint.
3. Scope is limited to reproducible release evidence, smoke verification, runbook/rollback documentation, and doc status alignment.
4. API contracts, database schema, subscription business rules, and existing mobile/admin UX remain unchanged unless verification exposes a concrete release blocker.

If any of these assumptions are wrong, revise this spec before implementation starts.

## Objective

Sprint 17 turns the current green MVP implementation into a reviewable release candidate. The goal is not to add Phase 2 retention or AI features, but to make the MVP ship decision reproducible and auditable.

Primary stakeholders impacted:

- Platform and QA owners who need a repeatable release gate.
- Product owners who need a clear ship/no-ship decision record.
- Engineers who need a local runbook for release candidate validation and rollback.

Success means the repo has a concrete release-candidate checklist, smoke evidence paths, rollback notes, and updated sprint tracking that can be followed by another engineer without relying on prior chat context.

## Tech Stack

- Monorepo with `apps/mobile` (Flutter), `apps/api` (NestJS/TypeScript), `apps/admin`, and `packages/shared`.
- Local infrastructure under `infra/` with PostgreSQL compose and migrations.
- Existing root scripts in `package.json`, including `pnpm.cmd check`.
- Existing mobile test suite run through `flutter test`.

## Commands

Install dependencies:

```bash
pnpm install
```

Build:

```bash
pnpm.cmd build
```

Lint:

```bash
pnpm.cmd lint
```

Typecheck:

```bash
pnpm.cmd typecheck
```

Unit and integration tests:

```bash
pnpm.cmd test
```

Mobile tests:

```bash
Set-Location 'apps/mobile'; flutter test
```

Pre-merge release gate:

```bash
pnpm.cmd check
```

Local infrastructure preflight:

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm.cmd api:migrate
```

## Project Structure

- `docs/sprint-17-spec.md` - Sprint 17 scope, acceptance criteria, and boundaries.
- `docs/sprint-17-implementation-plan.md` - ordered release-readiness task plan.
- `docs/implementation-sprint-checklist.md` - sprint status tracking.
- `docs/release-candidate-checklist.md` - expected release gate, smoke matrix, evidence log, and ship/no-ship checklist.
- `docs/release-runbook.md` - local validation, rollback, and operational handoff notes.
- `README.md` - top-level status and release-readiness pointers if documentation drift is found.
- `infra/README.md` - local infrastructure notes if release preflight commands need clarification.
- `tools/` - optional lightweight release-smoke helper if manual command repetition becomes error-prone.

## Code Style

- Prefer documentation-first release artifacts over new runtime code.
- If a helper script is added, keep it small, explicit, and platform-appropriate for the existing Windows/PowerShell workflow.
- Do not introduce new dependencies for release readiness.
- Keep command examples copy-pasteable and specific.

Example PowerShell helper style if a smoke script is needed:

```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

pnpm.cmd check
```

## Testing Strategy

- Treat Sprint 17 implementation as release validation: run targeted commands first when changing a specific artifact, then run `pnpm.cmd check`.
- If a release-smoke helper is added, verify it fails fast and delegates to existing commands rather than duplicating test logic.
- If docs only change, verify links, commands, and checklist statuses by manual review plus `rg` checks for stale Sprint 16 `DOING` state.
- Do not mark Sprint 17 complete until the full release gate is recorded in the checklist.

## Boundaries

- Always: keep Sprint 17 focused on release candidate readiness; preserve existing MVP behavior; document verification evidence; keep status docs aligned.
- Ask first: production deployment changes, CI workflow changes, app store packaging, live billing provider setup, database schema changes, dependency additions, or new product features.
- Never: skip `pnpm.cmd check` for Sprint closure; change subscription entitlement semantics; weaken auth/security gates; treat docs as complete without command evidence.

## Success Criteria

- A release-candidate checklist exists and covers MVP smoke paths: auth, browse, search, player/resume, favorite/bookmark, subscription entitlement, asset access, admin content management, and API migration/preflight.
- A release runbook exists with local validation steps, rollback notes, and ship/no-ship criteria.
- Sprint 17 implementation plan breaks work into small tasks with acceptance criteria and verification commands.
- `docs/implementation-sprint-checklist.md` includes Sprint 17 with `TODO` items ready for implementation.
- Final Sprint 17 closure criteria require `pnpm.cmd check` and explicit release evidence.

## Resolved Decisions

- Sprint 17 does not add `tools/release-smoke.ps1`; smoke validation remains documentation-driven because existing commands are explicit and short.
- The intended release target is internal QA release candidate.
- Live billing and app store packaging stay out of Sprint 17 unless separately approved.
