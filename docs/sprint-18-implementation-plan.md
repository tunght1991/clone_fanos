# Implementation Plan: Sprint 18 - Production Readiness Evidence Closure

## Overview

Sprint 18 closes the remaining production-readiness evidence gaps from Sprint 17. The work is mostly verification and documentation: establish the current candidate baseline, unblock local infrastructure preflight, run API and health checks, execute manual MVP smoke, update evidence docs, and make an explicit ship/no-ship recommendation.

Implementation order should fail fast on environment blockers:

1. confirm candidate baseline and current blockers
2. re-run automated gates and audit
3. unblock Docker/PostgreSQL and API preflight
4. run manual MVP smoke
5. update release, technical, and sprint checklists
6. record final handoff and decision

## Architecture Decisions

- Keep Sprint 18 out of product feature scope.
- Treat local infrastructure preflight as required evidence for production-readiness evaluation.
- Treat manual smoke as required evidence, not replaceable by automated smoke tests.
- Keep production deployment, release tagging, live billing, and app store packaging ask-first.
- Update docs with concise evidence instead of storing bulky command logs.

## Task List

### Phase 1: Candidate Baseline

- [x] Task 1: Record current candidate baseline
  - Description: capture the current working tree state, intended candidate note, existing blockers, and Sprint 18 decision owner assumptions.
  - Test cases: S18-TC-01.
  - Acceptance criteria:
    - [x] Current blocker list is reconciled against `docs/release-candidate-checklist.md`.
    - [x] Working tree state is recorded as clean, intended-dirty, or blocked from tagging.
    - [x] Sprint 18 open questions are either answered or carried forward explicitly.
  - Verification:
    - [x] `git status --short`
    - [x] `rg -n "BLOCKED|NOT RUN|NO-GO|DOING" docs/release-candidate-checklist.md docs/technical-checklist.md`
  - Dependencies: None
  - Files likely touched:
    - `docs/release-candidate-checklist.md`
    - `docs/sprint-18-implementation-plan.md`
  - Estimated scope: Small

- [x] Task 2: Re-run automated gate and dependency audit
  - Description: verify the candidate still passes the repo gate and has no known moderate-or-higher dependency vulnerabilities.
  - Test cases: S18-TC-02, S18-TC-03.
  - Acceptance criteria:
    - [x] `pnpm.cmd check` passes.
    - [x] `pnpm.cmd audit --audit-level moderate` passes.
    - [x] Results are recorded without bulky logs.
  - Verification:
    - [x] `pnpm.cmd check`
    - [x] `pnpm.cmd audit --audit-level moderate`
  - Dependencies: Task 1
  - Files likely touched:
    - `docs/release-candidate-checklist.md`
    - `docs/sprint-18-implementation-plan.md`
  - Estimated scope: Small

### Checkpoint: Automated Baseline

- [x] Candidate state is known.
- [x] Automated release gate passes or has a named blocker.
- [x] Dependency audit passes or has a named blocker.

### Phase 2: Local Infrastructure and API Preflight

- [x] Task 3: Verify Docker/PostgreSQL preflight
  - Description: start the local PostgreSQL service and verify the container is healthy before running migrations.
  - Test cases: S18-TC-04, S18-TC-05.
  - Acceptance criteria:
    - [x] Docker Desktop Linux engine is running.
    - [x] `docker compose -f infra/docker-compose.yml up -d postgres` succeeds.
    - [x] PostgreSQL publishes `localhost:5434` and reports healthy.
  - Verification:
    - [x] `docker version`
    - [x] `docker compose -f infra/docker-compose.yml up -d postgres`
    - [x] `docker compose -f infra/docker-compose.yml ps postgres`
  - Dependencies: Task 1
  - Files likely touched:
    - `docs/release-candidate-checklist.md`
    - `docs/technical-checklist.md`
  - Estimated scope: Small

- [x] Task 4: Run migration and API health preflight
  - Description: run database migrations, start the API, and verify the health endpoint.
  - Test cases: S18-TC-06, S18-TC-07.
  - Acceptance criteria:
    - [x] `pnpm.cmd api:migrate` completes without error.
    - [x] `pnpm.cmd api:dev` starts without startup error.
    - [x] `/health` returns `200` and `status: ok`.
  - Verification:
    - [x] `pnpm.cmd api:migrate`
    - [x] `pnpm.cmd api:dev`
    - [x] `Invoke-WebRequest http://localhost:3000/health`
  - Dependencies: Task 3
  - Files likely touched:
    - `docs/release-candidate-checklist.md`
    - `docs/technical-checklist.md`
  - Estimated scope: Small

### Checkpoint: Runtime Preflight

- [x] Docker/PostgreSQL is verified.
- [x] Migrations pass.
- [x] API starts and health endpoint responds.
- [x] Technical checklist reflects the current blocked state.

### Phase 3: Manual MVP Smoke

- [x] Task 5: Execute mobile MVP smoke paths
  - Description: run the manual mobile paths from the release checklist using local seeded/mock data or the assigned release environment.
  - Test cases: S18-TC-08, S18-TC-09, S18-TC-10, S18-TC-11, S18-TC-12.
  - Acceptance criteria:
    - [x] Auth smoke passes.
    - [x] Browse/search/detail smoke passes.
    - [x] Player/resume and favorite/bookmark smoke pass.
    - [x] Subscription entitlement and premium asset gate smoke pass.
  - Verification:
    - [x] Manual smoke evidence recorded in `docs/release-candidate-checklist.md`
    - [x] Local smoke execution `20260605231432`: mobile web root returned Flutter bootstrap; user auth, browse/search/detail, playback progress, favorite/bookmark, subscription verify, and asset gate passed through the running API.
  - Dependencies: Task 4
  - Files likely touched:
    - `docs/release-candidate-checklist.md`
  - Estimated scope: Medium

- [x] Task 6: Execute admin content-management smoke
  - Description: validate the admin dashboard/editor/publish controls against the API path or document why local fallback is being used.
  - Test cases: S18-TC-13.
  - Acceptance criteria:
    - [x] Admin dashboard opens.
    - [x] Create/edit draft path is verified.
    - [x] Publish controls are reviewed without contract drift or broken navigation.
  - Verification:
    - [x] Manual smoke evidence recorded in `docs/release-candidate-checklist.md`
    - [x] Admin web root/config returned `200`; admin login/me, create audiobook with chapters, publish chapters/audiobooks, and list query passed through the running API.
  - Dependencies: Task 4
  - Files likely touched:
    - `docs/release-candidate-checklist.md`
  - Estimated scope: Medium

### Checkpoint: Manual Smoke

- [x] Manual smoke matrix has PASS/FAIL evidence for every required row.
- [x] Any failure has an owner and next action.
- [x] Automated smoke coverage is not used as a substitute for manual smoke.

### Phase 4: Decision and Closure

- [x] Task 7: Update release and technical checklists
  - Description: reconcile Sprint 18 evidence into the release checklist and technical checklist.
  - Test cases: S18-TC-14.
  - Acceptance criteria:
    - [x] `docs/release-candidate-checklist.md` contains Sprint 18 evidence.
    - [x] `docs/technical-checklist.md` marks local bootstrap and migration complete only if verified.
    - [x] Remaining blockers and residual risks are explicit.
  - Verification:
    - [x] `rg -n "Sprint 18|BLOCKED|NOT RUN|DOING|NO-GO|GO" docs/release-candidate-checklist.md docs/technical-checklist.md`
  - Dependencies: Tasks 2, 4, 5, 6
  - Files likely touched:
    - `docs/release-candidate-checklist.md`
    - `docs/technical-checklist.md`
  - Estimated scope: Small

- [x] Task 8: Close Sprint 18 tracking and handoff
  - Description: update the master sprint checklist and record the final ship/no-ship recommendation.
  - Test cases: S18-TC-14.
  - Acceptance criteria:
    - [x] Sprint 18 task statuses reflect actual evidence.
    - [x] Final decision says `GO`, `NO-GO`, or `GO for internal QA only` with rationale.
    - [x] Release tagging or deployment remains blocked unless explicitly approved.
  - Verification:
    - [x] `rg -n "Sprint 18|TODO|DOING" docs/implementation-sprint-checklist.md`
    - [x] Manual doc review against `docs/sprint-18-spec.md`
  - Dependencies: Task 7
  - Files likely touched:
    - `docs/implementation-sprint-checklist.md`
    - `docs/release-candidate-checklist.md`
    - `docs/sprint-18-implementation-plan.md`
  - Estimated scope: Small

### Checkpoint: Complete

- [x] Automated gates pass or blockers are named.
- [x] Runtime preflight passes or blockers are named.
- [x] Manual smoke matrix is recorded.
- [x] Technical checklist is aligned.
- [x] Sprint 18 checklist reflects actual status.
- [x] Ship/no-ship decision is explicit.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Docker Desktop becomes unavailable again | Medium | Re-run S18-TC-04..07 before manual smoke if the runtime session changes. |
| Manual smoke uses mock/local data and misses release-environment issues | Medium | Record the environment explicitly and require separate release-env smoke if one is assigned later. |
| Sprint expands into production deployment | High | Keep deployment, tagging, app store packaging, live billing, and CI changes ask-first. |
| Working tree remains dirty | Medium | Record candidate state and avoid release tagging until intended changes are committed. |
| Smoke failure is treated as acceptable without owner approval | High | Require each failure to have owner, next action, and accepted-risk approval before any GO decision. |

## Open Questions

- Who owns the final Sprint 18 ship/no-ship decision?
- Should the smoke run target only local seeded/mock data, or a dedicated release environment?
- Is release tagging in scope after evidence passes, or should Sprint 18 stop at handoff?
