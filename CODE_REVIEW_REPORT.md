# Code Review Report

Scope: reviewed the current `sprint8-ui-polish` codebase state against `main`, with emphasis on the mobile UI/analytics work and the admin UI restyle that landed in the latest Sprint 8 commit (`7a5e4e1`).

Verification reviewed:
- `flutter test test/mock_discovery_repository_test.dart test/home_shell_test.dart test/app_flow_test.dart test/subscription_screen_test.dart test/player_screen_test.dart test/app_state_test.dart test/auth_screen_test.dart`
- Result: all tests passed

## Findings

### 1. Important - bootstrap treats subscription refresh failures like onboarding

`apps/mobile/lib/features/auth/state/app_state.dart:56-83`

`bootstrap()` wraps session load, onboarding state, and `refreshSubscription()` in one `try/catch`. If the user has a valid session but `refreshSubscription()` throws, the code falls into the `catch` block and forces `_phase = AppPhase.onboarding`.

That is a correctness bug:
- the user is still authenticated locally
- a transient subscription backend failure should not send them back to onboarding
- the UI can temporarily hide the signed-in state until the next manual recovery

Fix recommendation:
- separate session/bootstrap state from subscription refresh failure handling
- keep the authenticated phase when subscription refresh fails
- surface the refresh error as a recoverable state instead of reclassifying the user

### 2. Important - search requests can race and overwrite newer results

`apps/mobile/lib/features/home/presentation/home_shell.dart:404-467`

`_submitSearch()` applies the response unconditionally after `await widget.appState.contentRepository.searchAudiobooks(...)`. The search flow can trigger overlapping requests from:
- debounced typing
- premium/category filter changes
- sort changes
- manual submit
- pagination

Because there is no request token, cancellation, or query/version check, a slower earlier request can complete after a newer one and overwrite:
- `_items`
- `_currentQuery`
- `_queryController.text`
- `_page` / `_hasNext`

That makes the search tab vulnerable to stale results and stale text state.

Fix recommendation:
- add a request sequence number and ignore stale responses, or
- cancel/replace in-flight requests before applying results

### 3. Important - analytics sends raw error strings to the tracking backend

`apps/mobile/lib/features/auth/presentation/auth_screen.dart:155-193`
`apps/mobile/lib/features/subscription/presentation/subscription_screen.dart:219-311`

Several analytics events include `error.toString()` or `widget.appState.errorMessage` directly in payloads.

This is a privacy/security hygiene problem:
- raw exception text can expose internal server details
- backend messages may include identifiers, stack fragments, or other sensitive context
- analytics payloads usually have wider retention and access than local UI errors

Fix recommendation:
- send normalized error codes or categories to analytics
- keep the raw string only for local UI state and debug logs
- avoid shipping server exception text to the analytics pipeline

### 4. Optional - `HomeShell` has grown into a god widget

`apps/mobile/lib/features/home/presentation/home_shell.dart:18, 852, 949`

The home module now owns browse, search, detail, favorites/profile entry, and multiple analytics flows in a single ~1846-line file. This is not a functional bug, but it is a maintainability risk:
- harder to review changes safely
- harder to isolate search/detail regressions
- harder to reuse pieces across screens

Consider splitting search/detail/favorites sections into smaller feature widgets or files. `player_screen.dart` is also large (~1100 lines) and would benefit from the same treatment.

## Overall Assessment

- Correctness: mostly good, but the bootstrap and search race issues should be fixed before merge.
- Readability: acceptable for the current sprint, but `HomeShell` has become too large.
- Architecture: the new design-system primitives are a net improvement, but the largest screens should be split next.
- Security: analytics error payloads should be normalized before shipping.
- Performance: no major hot-path concern found beyond the search concurrency issue.

## Verdict

Request changes.

The codebase is materially better after Sprint 8, but the bootstrap error handling, search race condition, and analytics error leakage are quality gaps that should be addressed before merging the branch.
