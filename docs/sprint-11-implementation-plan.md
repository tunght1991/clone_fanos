# Implementation Plan: Sprint 11 - Release Readiness and Contract Consistency

## Overview
Sprint 11 hardens the platform for release without adding new product scope. The work focuses on closing remaining trust-boundary leaks, keeping the API/mobile/admin/shared contract surface consistent, and making root validation strong enough to catch regressions before merge.

The implementation should proceed from the highest-risk backend boundaries outward:

1. lock production auth and subscription trust boundaries
2. enforce shared DTO and database invariants
3. harden search and asset-access validation
4. align admin and mobile behavior with backend-owned truth
5. extend repo-level validation so the new rules stay enforced

## Architecture Decisions
- Centralize request-principal rules in the HTTP auth boundary instead of duplicating them per controller.
- Treat `packages/shared` and `infra/migrations` as the canonical source of truth before updating backend or UI behavior.
- Keep mobile and admin as consumers of backend truth for entitlement, publication, and playability; do not reimplement business rules in the client unless the UI needs a local guard.
- Prefer small, verifiable slices that leave the system green after each phase.

## Task List

### Phase 1: Backend trust boundaries

- [x] Task 1: Lock the production auth boundary
  - Description: remove production use of fallback identity headers and require a verified bearer token for user-scoped API access.
  - Acceptance criteria:
    - [ ] Production request handling rejects missing bearer tokens instead of impersonating via `x-user-id`.
    - [ ] Dev/test paths still support the existing local fallback where needed.
    - [ ] Auth boundary tests cover both the allowed dev path and the rejected production path.
  - Verification:
    - [ ] `pnpm.cmd --dir apps/api test`
    - [ ] Focused auth boundary tests pass
  - Dependencies: None
  - Files likely touched:
    - `apps/api/src/http/auth-context.ts`
    - `apps/api/src/http/auth-context.test.ts`
    - `apps/api/src/http/auth.http.controller.ts`
  - Estimated scope: Small

- [x] Task 2: Harden subscription request handling
  - Description: make subscription checkout, verify, and webhook handling strictly trust backend-authenticated input only.
  - Acceptance criteria:
    - [ ] Webhook processing rejects missing or invalid signatures before any mutation.
    - [ ] Return URLs are normalized and restricted to relative paths or allowlisted origins.
    - [ ] Subscription tests cover success and failure paths for checkout, verify, and webhook handling.
  - Verification:
    - [ ] `pnpm.cmd --dir apps/api test`
    - [ ] Subscription-focused tests pass
  - Dependencies: Task 1
  - Files likely touched:
    - `apps/api/src/http/subscription.http.controller.ts`
    - `apps/api/src/modules/subscription/subscription.service.ts`
    - `apps/api/src/config/subscription.config.ts`
    - `apps/api/src/modules/subscription/subscription.service.test.ts`
  - Estimated scope: Medium

### Checkpoint: After Tasks 1-2
- [x] API test suite passes for auth and subscription paths
- [x] Production request boundaries no longer depend on fallback identity headers
- [x] Webhook and checkout return-url guards are covered by tests

### Phase 2: Shared contract and storage invariants

- [x] Task 3: Align shared subscription contract and database invariants
  - Description: remove `exactOptionalPropertyTypes` drift in shared entitlement types and enforce the subscription/narrator invariants in schema.
  - Acceptance criteria:
    - [x] Shared subscription entitlement helpers compile cleanly with exact optional types.
    - [x] Subscription identifiers that code treats as singular are unique in the schema.
    - [x] Narrator role/index invariants are enforced in migration/schema assertions.
  - Verification:
    - [x] `pnpm.cmd --dir packages/shared lint`
    - [x] `pnpm.cmd --dir packages/shared typecheck`
    - [x] `pnpm.cmd --dir apps/api test`
  - Dependencies: Task 2
  - Files likely touched:
    - `packages/shared/src/contracts/subscription.ts`
    - `infra/migrations/0001_initial.sql`
    - `apps/api/src/db/migration-schema.test.ts`
  - Estimated scope: Medium

- [x] Task 4: Harden search validation and asset-access entitlement checks
  - Description: reject malformed search filters before they reach SQL and gate premium audio asset access on entitlement.
  - Acceptance criteria:
    - [x] Search UUID filters are validated in the HTTP parser before repository access.
    - [x] Asset access for premium audio requires authenticated entitlement, not just an asset key.
    - [x] Search and asset-access tests prove both rejection and success paths.
  - Verification:
    - [x] `pnpm.cmd --dir apps/api test`
    - [x] Targeted search and asset-access tests pass
  - Dependencies: Tasks 1-3
  - Files likely touched:
    - `apps/api/src/http/search.http.parsers.ts`
    - `apps/api/src/http/search.http.parsers.test.ts`
    - `apps/api/src/http/assets.http.controller.ts`
    - `apps/api/src/http/assets.http.controller.test.ts`
    - `apps/api/src/modules/content/content.controller.ts`
    - `apps/api/src/modules/content/content.repository.ts`
  - Estimated scope: Medium

### Checkpoint: After Tasks 3-4
- [x] Shared contract and schema checks are green
- [x] Search and asset-access boundaries are enforced before storage/query execution
- [x] API regression tests cover the new guards

### Phase 3: Admin and mobile consistency

- [x] Task 5: Align admin content editor fallback behavior with backend truth
  - Description: keep chapter counts and publish gating deterministic when API payloads are incomplete or stale.
  - Acceptance criteria:
    - [x] Chapter count is derived from the available chapter list when API data is missing or unreliable.
    - [x] Publish/unpublish gating remains correct under busy and fallback states.
    - [x] Admin tests cover the fallback and publish-control behavior.
  - Verification:
    - [x] `pnpm.cmd --dir apps/admin test`
  - Dependencies: Tasks 3-4
  - Files likely touched:
    - `apps/admin/src/features/content-editor/content-editor-data.js`
    - `apps/admin/src/features/content-editor/content-editor-repository.js`
    - `apps/admin/test/content-editor-repository.test.js`
  - Estimated scope: Small

- [x] Task 6: Revalidate restored mobile sessions during bootstrap
  - Description: ensure a stored session does not become authenticated until it is rechecked against the auth backend.
  - Acceptance criteria:
    - [x] Bootstrapped sessions are validated through `me()` before the app enters the authenticated phase.
    - [x] Invalid or revoked sessions are cleared from local storage.
    - [x] Mobile state tests cover valid, invalid, refreshed, and cleared bootstrap flows.
  - Verification:
    - [x] `Set-Location 'apps/mobile'; flutter test test/app_state_test.dart`
  - Dependencies: Tasks 1 and 3
  - Files likely touched:
    - `apps/mobile/lib/features/auth/state/app_state.dart`
    - `apps/mobile/test/app_state_test.dart`
  - Estimated scope: Small

- [x] Task 7: Prevent unpublished chapters from being surfaced as playable
  - Description: block unpublished chapters in the mobile home and player flows so the UI never exposes non-playable content.
  - Acceptance criteria:
    - [x] Home and player logic filter out unpublished chapters consistently.
    - [x] Initial playback, chapter selection, and navigation all respect the playability guard.
    - [x] Widget/unit tests prove the bypass path is blocked.
  - Verification:
    - [x] `Set-Location 'apps/mobile'; flutter test test/home_shell_test.dart test/player_screen_logic_test.dart test/player_screen_test.dart`
  - Dependencies: Task 4
  - Files likely touched:
    - `apps/mobile/lib/features/home/presentation/home_shell.dart`
    - `apps/mobile/lib/features/player/presentation/player_screen.dart`
    - `apps/mobile/lib/features/player/presentation/player_screen_logic.dart`
    - `apps/mobile/test/home_shell_test.dart`
    - `apps/mobile/test/player_screen_logic_test.dart`
    - `apps/mobile/test/player_screen_test.dart`
  - Estimated scope: Medium

### Checkpoint: After Tasks 5-7
- [x] Admin content editor still publishes safely under fallback conditions
- [x] Mobile bootstrap does not trust stale stored sessions
- [x] Mobile cannot surface unpublished chapters as playable

### Phase 4: Validation and rollout guard

- [x] Task 8: Expand root validation and release regression coverage
  - Description: make repo-level validation exercise the mobile suite and keep the shared contract checks in the standard path.
  - Acceptance criteria:
    - [x] Root `check` command includes mobile test coverage.
    - [x] Shared contract checks remain part of the repo-wide validation path.
    - [x] A representative mobile flow test still passes after the stricter auth/session/playability rules.
  - Verification:
    - [x] `pnpm.cmd lint`
    - [x] `pnpm.cmd typecheck`
    - [x] `pnpm.cmd check`
    - [x] `pnpm.cmd mobile:test`
  - Dependencies: Tasks 1-7
  - Files likely touched:
    - `package.json`
    - `apps/mobile/test/app_flow_test.dart`
  - Estimated scope: Small

### Checkpoint: Complete
- [x] `pnpm.cmd check` passes
- [x] `pnpm.cmd --dir apps/api test` passes
- [x] `pnpm.cmd --dir apps/admin test` passes
- [x] `Set-Location 'apps/mobile'; flutter test` passes
- [x] All Sprint 11 acceptance criteria are covered by tests

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Stricter auth handling breaks local dev/test ergonomics | High | Keep the fallback path available outside production and cover both paths with tests. |
| Database constraints expose pre-existing duplicate data | High | Add schema assertions early and keep the invariant change isolated so cleanup can be handled explicitly if needed. |
| Mobile bootstrap validation clears sessions too aggressively | Medium | Validate with `me()` after refresh and keep the failure path deterministic and test-covered. |
| Repo-level validation becomes too slow or brittle | Medium | Keep targeted package tests as the first checkpoint, and only rely on the full root check as the final guard. |

## Open Questions
- None blocking. The sprint is intentionally scoped as release-readiness hardening rather than new feature work.
