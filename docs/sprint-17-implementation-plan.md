# Implementation Plan: Sprint 17 - Release Candidate Operational Readiness

## Overview

Sprint 17 converts the stabilized MVP into a release candidate package. The work is intentionally documentation and verification heavy: create the release gate, define smoke evidence, document rollback/handoff, align stale status docs, and close the sprint only after the full repo gate passes.

Implementation order should minimize ambiguity:

1. define release gate and smoke matrix
2. document release runbook and rollback
3. align repo status docs
4. optionally add a small smoke helper if the manual gate is too easy to run incorrectly
5. run final verification and mark Sprint 17 complete

## Architecture Decisions

- Keep Sprint 17 out of runtime product scope unless verification discovers a concrete blocker.
- Prefer existing scripts (`pnpm.cmd check`, `flutter test`, `pnpm.cmd api:migrate`) over new automation.
- If automation is added, make it a thin wrapper around existing commands rather than a parallel test system.
- Track release readiness in docs so another engineer can reproduce the decision without chat history.

## Task List

### Phase 1: Release Gate Definition

- [x] Task 1: Create the release-candidate checklist
  - Description: add a release checklist that defines required commands, MVP smoke paths, evidence capture, and ship/no-ship criteria.
  - Acceptance criteria:
    - [x] Checklist covers auth, browse, search, player/resume, favorite/bookmark, subscription entitlement, asset access, admin content management, and API migration/preflight.
    - [x] Checklist includes exact commands for build, lint, typecheck, tests, mobile tests, and root check.
    - [x] Checklist separates automated gates from manual smoke evidence.
  - Verification:
    - [x] Manual doc review against Sprint 17 spec success criteria.
    - [x] `rg -n "auth|browse|search|player|subscription|admin|pnpm.cmd check" docs/release-candidate-checklist.md`
  - Dependencies: None
  - Files likely touched:
    - `docs/release-candidate-checklist.md`
  - Estimated scope: Small

- [x] Task 2: Define release evidence format
  - Description: add a compact evidence log format so each release-candidate run records command output status, tester, date, and blocker decisions.
  - Acceptance criteria:
    - [x] Evidence format records command, result, date/time, owner, and notes.
    - [x] Blockers and accepted residual risks have a visible section.
    - [x] The format does not require committing bulky command logs.
  - Verification:
    - [x] Manual doc review.
  - Dependencies: Task 1
  - Files likely touched:
    - `docs/release-candidate-checklist.md`
  - Estimated scope: Small

### Checkpoint: Release Gate

- [x] Release checklist exists.
- [x] Smoke matrix maps back to MVP scope.
- [x] Evidence format is clear enough for another engineer to use.

### Phase 2: Runbook and Rollback

- [x] Task 3: Create the release runbook
  - Description: document local release-candidate validation steps, environment prerequisites, migration preflight, and rollback/handoff notes.
  - Acceptance criteria:
    - [x] Runbook includes local infrastructure setup with Docker compose and `pnpm.cmd api:migrate`.
    - [x] Runbook defines rollback boundaries for API migration, admin content operations, mobile release halt, and search index rollback where applicable.
    - [x] Runbook includes a final ship/no-ship decision checklist.
  - Verification:
    - [x] Manual doc review.
    - [x] `rg -n "docker compose|api:migrate|rollback|ship/no-ship" docs/release-runbook.md`
  - Dependencies: Task 1
  - Files likely touched:
    - `docs/release-runbook.md`
  - Estimated scope: Small

- [x] Task 4: Align README and infra references
  - Description: update top-level and infra docs only where they still describe an outdated sprint state or omit the release-readiness docs.
  - Acceptance criteria:
    - [x] README points to the current sprint checklist and release readiness docs.
    - [x] Infra README retains local setup clarity for release preflight.
    - [x] No unrelated docs are rewritten.
  - Verification:
    - [x] Manual doc review.
    - [x] `rg -n "Sprint 7|release-candidate|release-runbook|implementation-sprint-checklist" README.md infra/README.md`
  - Dependencies: Task 3
  - Files likely touched:
    - `README.md`
    - `infra/README.md`
  - Estimated scope: Small

### Checkpoint: Operational Docs

- [x] Release runbook exists.
- [x] README status no longer points to an obsolete active sprint.
- [x] Local preflight commands are documented.

### Phase 3: Optional Smoke Helper

- [x] Task 5: Decide whether to add a release smoke helper
  - Description: determine whether the release gate needs a PowerShell helper or whether existing commands plus docs are sufficient.
  - Acceptance criteria:
    - [x] Decision is documented in the implementation plan or release checklist.
    - [x] If no helper is added, manual commands remain explicit and ordered.
    - [x] If a helper is added, it delegates to existing scripts and introduces no dependencies.
  - Verification:
    - [x] Manual doc review.
    - [x] N/A: no helper added in Sprint 17.
  - Dependencies: Tasks 1-4
  - Files likely touched:
    - `docs/release-candidate-checklist.md`
    - `tools/release-smoke.ps1` if approved by scope
  - Estimated scope: Small

### Phase 4: Final Verification and Sprint Tracking

- [x] Task 6: Run final release gate and update Sprint 17 status
  - Description: run the final verification gate and update the master sprint checklist with Sprint 17 progress.
  - Acceptance criteria:
    - [x] `pnpm.cmd check` passes.
    - [x] Sprint 17 checklist entries reflect the actual verification state.
    - [x] Any remaining open questions or release blockers are documented.
  - Verification:
    - [x] `pnpm.cmd check`
    - [x] Manual doc review.
  - Dependencies: Tasks 1-5
  - Files likely touched:
    - `docs/implementation-sprint-checklist.md`
    - `docs/sprint-17-implementation-plan.md`
  - Estimated scope: Small

### Checkpoint: Complete

- [x] Release checklist and runbook exist.
- [x] README/infra references are aligned.
- [x] Optional smoke helper decision is recorded.
- [x] Monorepo check gate passes.
- [x] Sprint 17 status is recorded in the master checklist.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Sprint 17 expands into Phase 2 retention features | High | Keep scope limited to release candidate readiness unless product explicitly approves new feature scope. |
| Release checklist becomes documentation-only and is not executable | Medium | Require exact commands and final `pnpm.cmd check` evidence before closure. |
| Local infra assumptions differ across machines | Medium | Document Docker/PostgreSQL prerequisites and keep migration preflight explicit. |
| Runbook overpromises rollback behavior | Medium | Describe rollback boundaries honestly and require ask-first approval for production deployment changes. |
| Stale README status misleads future agents | Low | Align README current status as part of Sprint 17 docs work. |

## Resolved Decisions

- No `tools/release-smoke.ps1` helper is added in Sprint 17; documented manual commands remain the release gate.
- The target release audience is internal QA.
- App store packaging and live billing provider setup stay out of Sprint 17 and should be split into a later sprint if needed.
