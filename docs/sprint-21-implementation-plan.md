# Implementation Plan: Sprint 21 - In-App Resume Reminder v1

## Overview

Build one narrow vertical slice of notification value: a deterministic resume reminder read model in the backend, a lightweight Home surface in mobile, and analytics that prove users saw and used the reminder.

The implementation should stay intentionally small. Sprint 21 is not a push-notification platform, a notification inbox, or a preferences system.

## Architecture Decisions

- Keep notifications separate from the Sprint 20 retention read model, but reuse the same underlying playback and engagement signals.
- Keep the backend endpoint read-only and deterministic so the Home surface stays fast and predictable.
- Use the existing Home screen as the first notification surface rather than adding a new navigation destination.
- Track impression and tap analytics so the reminder can be measured without needing a new reporting pipeline.

## Task List

### Phase 1: Backend Contract

- [ ] Task 1: Define the notification DTOs and API contract
  - Description: add the read-only reminder contract to shared types and document the response shape in `docs/api-design.md`.
  - Acceptance:
    - [ ] The response shape includes a nullable resume reminder and `meta` metadata.
    - [ ] The contract is read-only and does not expose a write path.
    - [ ] The contract is documented before implementation expands.
  - Verification:
    - [ ] Targeted contract tests pass in `packages/shared` or `apps/api`.
    - [ ] `rg -n "notification|resume reminder" docs/api-design.md packages/shared/src`
  - Dependencies: None
  - Files likely touched:
    - `packages/shared/src/contracts/notification.ts`
    - `docs/api-design.md`
  - Estimated scope: Small

- [ ] Task 2: Implement the backend reminder selection logic
  - Description: derive the best resume target from recent playback and engagement activity, using a bounded deterministic rule set.
  - Acceptance:
    - [ ] The service returns a reminder only when there is unfinished listening activity.
    - [ ] The selection is deterministic for seeded data.
    - [ ] Empty state behavior is explicit and tested.
  - Verification:
    - [ ] `pnpm.cmd api:test`
    - [ ] Service-level tests cover reminder selection and empty cases
  - Dependencies: Task 1
  - Files likely touched:
    - `apps/api/src/modules/notification/notification.service.ts`
    - `apps/api/src/modules/notification/notification.service.test.ts`
    - `apps/api/src/modules/notification/index.ts`
  - Estimated scope: Medium

- [ ] Task 3: Wire the HTTP endpoint and backend smoke coverage
  - Description: expose `GET /notifications/home` and verify it with controller and smoke tests.
  - Acceptance:
    - [ ] The endpoint returns the shared notification contract.
    - [ ] The endpoint is wired into the app bootstrap cleanly.
    - [ ] Smoke coverage catches regressions in the response shape.
  - Verification:
    - [ ] `pnpm.cmd api:test`
    - [ ] Backend smoke tests pass
  - Dependencies: Task 2
  - Files likely touched:
    - `apps/api/src/http/notification.http.controller.ts`
    - `apps/api/src/http/app.module.ts`
    - `apps/api/src/http/index.ts`
    - `apps/api/src/http/backend.smoke.test.ts`
  - Estimated scope: Medium

### Checkpoint: Backend Contract

- [ ] The reminder contract is stable.
- [ ] The backend returns deterministic data for seeded activity.
- [ ] Empty-state behavior is explicit.

### Phase 2: Mobile Home Surface

- [ ] Task 4: Add a notification repository and load it from Home
  - Description: create a mobile repository for the notification contract and fetch it alongside the existing Home feed.
  - Acceptance:
    - [ ] Home loads the reminder data without breaking browse/search data loading.
    - [ ] The repository has both API-backed and mock/test implementations if needed.
    - [ ] The loading sequence stays simple and predictable.
  - Verification:
    - [ ] Targeted Flutter repository tests pass
    - [ ] Home widget tests still cover the existing browse flow
  - Dependencies: Task 3
  - Files likely touched:
    - `apps/mobile/lib/features/notification/domain/*`
    - `apps/mobile/lib/features/notification/data/*`
    - `apps/mobile/lib/features/home/presentation/home_shell.dart`
    - `apps/mobile/test/home_shell_test.dart`
  - Estimated scope: Medium

- [ ] Task 5: Render the resume reminder and deep-link behavior
  - Description: show the reminder card on Home, hide it cleanly when absent, and route taps to the correct audiobook or chapter position.
  - Acceptance:
    - [ ] The reminder appears only when there is actionable data.
    - [ ] Tapping it navigates to the correct resume target.
    - [ ] Empty state and loading state remain unobtrusive.
  - Verification:
    - [ ] `D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat test test/home_shell_test.dart`
    - [ ] Manual tap-through smoke on local data
  - Dependencies: Task 4
  - Files likely touched:
    - `apps/mobile/lib/features/home/presentation/home_shell.dart`
    - `apps/mobile/lib/features/notification/*`
    - `apps/mobile/test/home_shell_test.dart`
  - Estimated scope: Medium

- [ ] Task 6: Track analytics for reminder impression and tap
  - Description: emit structured analytics for reminder view and interaction so the new surface can be measured.
  - Acceptance:
    - [ ] Impression and tap events use stable names.
    - [ ] Payloads stay structured and avoid raw error text.
    - [ ] Analytics do not block the Home experience.
  - Verification:
    - [ ] Targeted analytics tests pass
    - [ ] Home widget tests verify event emission
  - Dependencies: Task 5
  - Files likely touched:
    - `apps/mobile/lib/features/home/presentation/home_shell.dart`
    - `apps/api/src/modules/analytics/*` if backend ingestion needs a new event schema
    - `apps/mobile/test/home_shell_test.dart`
  - Estimated scope: Small

### Checkpoint: Mobile Surface

- [ ] The reminder renders from the backend or mock repository.
- [ ] Tap-through works end to end.
- [ ] Existing Home navigation still passes.

### Phase 3: Docs and Verification

- [ ] Task 7: Update the product docs and sprint tracking
  - Description: sync the API design, Home screen spec, and sprint checklist with the approved reminder flow.
  - Acceptance:
    - [ ] `docs/api-design.md` reflects the final contract.
    - [ ] `docs/mobile-screen-specs/02-home-browse.md` reflects the Home reminder surface.
    - [ ] Sprint tracking shows the work clearly and does not drift from the implementation plan.
  - Verification:
    - [ ] `rg -n "resume reminder|notification" docs/api-design.md docs/mobile-screen-specs/02-home-browse.md docs/implementation-sprint-checklist.md`
  - Dependencies: Tasks 1-6
  - Files likely touched:
    - `docs/api-design.md`
    - `docs/mobile-screen-specs/02-home-browse.md`
    - `docs/implementation-sprint-checklist.md`
  - Estimated scope: Small

- [ ] Task 8: Run the release gate and manual smoke
  - Description: validate the sprint slice with the broad repository gate plus one manual smoke run against local seeded data.
  - Acceptance:
    - [ ] `pnpm.cmd check` passes.
    - [ ] Manual smoke confirms the reminder appears only for qualifying activity.
    - [ ] Manual smoke confirms the reminder disappears when no resume target exists.
  - Verification:
    - [ ] `pnpm.cmd check`
    - [ ] Local API smoke with seeded playback data
  - Dependencies: Task 7
  - Files likely touched:
    - `docs/sprint-21-implementation-plan.md`
    - `docs/release-candidate-checklist.md` if the sprint is promoted into an RC evidence run
  - Estimated scope: Small

### Checkpoint: Complete

- [ ] All acceptance criteria are met.
- [ ] The reminder is measurable.
- [ ] The docs match the implementation.
- [ ] The sprint is ready for review.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The reminder becomes noisy or repetitive | Medium | Keep the reminder bounded to one actionable item and hide it when there is no clear resume target. |
| Home load time increases | Medium | Keep the read model small and fetch it once with the existing Home data load. |
| The sprint drifts into push notification work | High | Keep push providers, permissions, and background scheduling out of scope unless a new spec is approved. |
| Deterministic selection rules are too weak | Medium | Start with simple rules, seed tests, and only expand the rule set if the product needs it. |

## Open Questions

- Should the reminder deep-link to a chapter position, or only to audiobook detail?
- Should Sprint 21 emit only one reminder type, or should it support a small backlog of notices later?
- If the product wants push notifications later, should that be a separate sprint with its own spec and contract?
