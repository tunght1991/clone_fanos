# Implementation Plan: Sprint 16 - Mobile Release Blocker Resolution

## Overview

Sprint 16 resolves three mobile release blockers identified in the latest readiness review:

1. bootstrap can incorrectly force onboarding after subscription refresh failure
2. discovery search can apply stale async responses out of order
3. analytics can leak raw error strings in auth/subscription failure events

Implementation order should follow risk priority and minimize scope:

1. fix bootstrap phase safety
2. add search stale-response guard
3. normalize analytics error payloads
4. document completion in sprint checklist

## Architecture Decisions

- Keep changes local to `apps/mobile` and avoid backend/schema changes.
- Use explicit, minimal state guards for concurrency safety rather than introducing large async frameworks.
- Represent analytics failures with normalized categories/codes and optional safe context, never raw exception strings.
- Keep successful flows unchanged; only harden failure paths and race behavior.

## Task List

### Phase 1: Bootstrap phase correctness

- [x] Task 1: Prevent onboarding fallback on subscription refresh failure after successful session restore
  - Description: isolate bootstrap session restore from subscription refresh failure handling so authenticated state remains intact when refresh fails transiently.
  - Acceptance criteria:
    - [x] Restored valid session keeps `AppPhase.authenticated` even if `refreshSubscription()` throws.
    - [x] Failure is captured as recoverable error state/telemetry without resetting onboarding.
    - [x] Existing unauthenticated/onboarding bootstrap behavior remains unchanged.
  - Verification:
    - [x] `Set-Location 'apps/mobile'; flutter test test/app_state_test.dart`
  - Dependencies: None
  - Files likely touched:
    - `apps/mobile/lib/features/auth/state/app_state.dart`
    - `apps/mobile/test/app_state_test.dart`
  - Estimated scope: Medium

### Phase 2: Search race safety

- [x] Task 2: Guard discovery state against stale search responses
  - Description: add request sequencing (or equivalent) so only the latest active search request may mutate search state.
  - Acceptance criteria:
    - [x] Overlapping requests cannot let older responses overwrite newer query/results.
    - [x] Pagination behavior remains correct when loading additional pages.
    - [x] Existing search/filter/sort UX remains unchanged for non-race paths.
  - Verification:
    - [x] `Set-Location 'apps/mobile'; flutter test test/home_shell_test.dart`
  - Dependencies: Task 1
  - Files likely touched:
    - `apps/mobile/lib/features/home/presentation/home_shell.dart`
    - `apps/mobile/test/home_shell_test.dart`
  - Estimated scope: Medium

### Phase 3: Analytics payload hardening

- [x] Task 3: Replace raw error strings with normalized analytics error values
  - Description: ensure auth and subscription failure tracking events emit safe error categories/codes only.
  - Acceptance criteria:
    - [x] No failure analytics payload uses raw `error.toString()` or raw `appState.errorMessage`.
    - [x] Payloads still allow downstream grouping/debugging via stable error taxonomy.
    - [x] UI error messaging behavior remains unchanged for end users.
  - Verification:
    - [x] `Set-Location 'apps/mobile'; flutter test test/auth_screen_test.dart test/subscription_screen_test.dart`
  - Dependencies: Task 1
  - Files likely touched:
    - `apps/mobile/lib/features/auth/presentation/auth_screen.dart`
    - `apps/mobile/lib/features/subscription/presentation/subscription_screen.dart`
    - `apps/mobile/test/auth_screen_test.dart`
    - `apps/mobile/test/subscription_screen_test.dart`
  - Estimated scope: Medium

### Checkpoint: After Tasks 1-3

- [x] Blocker 1 resolved with regression coverage
- [x] Blocker 2 resolved with race-focused regression coverage
- [x] Blocker 3 resolved with analytics payload assertions
- [x] `Set-Location 'apps/mobile'; flutter test` passes

### Phase 4: Final verification and sprint docs

- [x] Task 4: Run monorepo gate and record Sprint 16 status
  - Description: run final repo checks and update sprint checklist/doc status for Sprint 16.
  - Acceptance criteria:
    - [x] `pnpm.cmd check` passes
    - [x] Sprint 16 spec and implementation plan exist in `docs/`
    - [x] Sprint checklist reflects Sprint 16 progress/done state
  - Verification:
    - [x] `pnpm.cmd check`
    - [x] Manual doc review
  - Dependencies: Tasks 1-3
  - Files likely touched:
    - `docs/implementation-sprint-checklist.md`
    - `docs/sprint-16-spec.md`
    - `docs/sprint-16-implementation-plan.md`
  - Estimated scope: Small

### Checkpoint: Complete

- [x] Targeted mobile suites pass
- [x] Full mobile suite passes
- [x] Monorepo check gate passes
- [x] Sprint 16 blockers marked resolved in docs

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Bootstrap fix unintentionally changes onboarding transitions | High | Add explicit tests for no-session and invalid-session bootstrap paths alongside restored-session failure path. |
| Search race guard breaks pagination append behavior | High | Test reset vs load-more flows and assert `_page`/`_hasNext` consistency under overlapping requests. |
| Analytics normalization loses useful debug signal | Medium | Define a compact stable error taxonomy (`network`, `auth_failed`, `unknown`) and keep non-sensitive context fields. |
| Scope creep into backend analytics schema changes | Medium | Keep Sprint 16 strictly client payload normalization unless explicit approval is provided. |

## Open Questions

- Should normalized analytics error values be shared through a small helper in Sprint 16 or left duplicated for minimal-change safety?
- Should search concurrency mitigation include request cancellation now, or sequence-guard only for this sprint?
- Should Sprint 16 include a small ADR documenting analytics error taxonomy decisions?
