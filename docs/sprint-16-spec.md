# Spec: Sprint 16 - Mobile Release Blocker Resolution

## Assumptions

I am making the following assumptions for Sprint 16:

1. Sprint 16 is a stabilization sprint focused on release blockers, not new product features.
2. Scope is limited to mobile auth bootstrap, mobile search request concurrency safety, and analytics error payload hygiene.
3. API contracts, database schema, and subscription business rules remain unchanged.
4. Existing UI wording and flows should stay intact unless required to surface safe/recoverable error states.

If any of these assumptions are wrong, the spec should be revised before implementation starts.

## Objective

Sprint 16 removes the remaining mobile blockers that currently prevent a safe ship decision:

- prevent authenticated users from being forced back to onboarding when subscription refresh fails during bootstrap
- prevent stale search responses from overwriting newer search state in discovery
- prevent raw internal error strings from being sent to analytics payloads

Primary users impacted:

- signed-in mobile users during app startup and entitlement refresh
- mobile users searching and filtering discovery results
- platform/security stakeholders relying on clean analytics telemetry

Success means mobile behavior remains functionally equivalent for happy paths while failure paths become safe, deterministic, and privacy-hardened.

## Tech Stack

- Monorepo with `apps/mobile` (Flutter), `apps/api` (NestJS/TypeScript), `apps/admin`, and `packages/shared`
- Existing analytics ingestion pathway already consumed by mobile surfaces
- Existing test suites in `apps/mobile/test` and monorepo checks via `pnpm.cmd check`

## Commands

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

Targeted mobile tests:

```bash
Set-Location 'apps/mobile'; flutter test test/app_state_test.dart test/home_shell_test.dart test/auth_screen_test.dart test/subscription_screen_test.dart
```

Full mobile test suite:

```bash
Set-Location 'apps/mobile'; flutter test
```

Pre-merge check:

```bash
pnpm.cmd check
```

## Project Structure

- `apps/mobile/lib/features/auth/state/app_state.dart` - bootstrap/session/subscription refresh phase control
- `apps/mobile/lib/features/home/presentation/home_shell.dart` - search submission and result state updates
- `apps/mobile/lib/features/auth/presentation/auth_screen.dart` - auth analytics events and error payload mapping
- `apps/mobile/lib/features/subscription/presentation/subscription_screen.dart` - subscription analytics events and error payload mapping
- `apps/mobile/test/app_state_test.dart` - bootstrap/auth state correctness coverage
- `apps/mobile/test/home_shell_test.dart` - discovery search behavior regression coverage
- `apps/mobile/test/auth_screen_test.dart` - auth analytics/event behavior coverage
- `apps/mobile/test/subscription_screen_test.dart` - subscription analytics/event behavior coverage
- `docs/implementation-sprint-checklist.md` - sprint status tracking

## Code Style

- Keep fixes local to the feature modules that own behavior; avoid broad refactors.
- Prefer explicit guard logic for async race safety over abstraction-heavy orchestration.
- Normalize analytics error payloads to stable codes/categories, not raw exception text.
- Maintain current UI copy and interaction pattern unless needed to represent recoverable failure safely.

Example:

```dart
if (requestId != _latestSearchRequestId) {
  return;
}
```

## Testing Strategy

- Add/adjust widget/state tests to prove bootstrap keeps authenticated phase when subscription refresh fails.
- Add/adjust search tests that simulate overlapping requests and assert stale responses are ignored.
- Add/adjust analytics tests asserting payloads contain safe error categories/codes only.
- Keep regression focus on behavior and payload contract, not internal implementation details.
- Run targeted mobile tests first, then full `flutter test`, then `pnpm.cmd check`.

## Boundaries

- Always: fix only the three Sprint 16 blocker areas; add regression tests with each behavioral change; preserve existing success-path UX.
- Ask first: API schema changes, dependency additions, new analytics event names, CI/workflow changes, or cross-app refactors.
- Never: send raw backend/internal exception strings to analytics payloads; weaken existing auth/subscription checks; remove failing tests without approval.

## Success Criteria

- Bootstrap no longer forces onboarding due to transient subscription refresh failure when session restore succeeds.
- Discovery search ignores stale async responses and preserves newest query/result state deterministically.
- Auth/subscription analytics failure events no longer include raw `error.toString()` or raw backend message text.
- Targeted mobile tests and full mobile suite pass, and `pnpm.cmd check` remains green.

## Open Questions

- Should analytics error normalization use a shared helper immediately in Sprint 16, or stay screen-local and consolidate in a later cleanup sprint?
- Should stale-search protection be request-id based only, or should cancellation also be introduced now?
- Should recoverable bootstrap subscription failures expose a dedicated UI banner in this sprint, or remain silent with telemetry only?
