# Implementation Plan: Mobile Web moving from mock to API

## Overview
Goal is for Flutter web to run against the same backend API as native mobile instead of falling back to mock automatically. The current blocker was HTTP repositories using `dart:io HttpClient`, which cannot run in the browser, so the work adds a browser-compatible transport and changes the repository selection policy.

## Architecture Decisions
- Web no longer uses `kIsWeb` to force mock repositories; mock only remains for explicit demo/test mode.
- Transport is split from `HttpClient` so the browser can use an appropriate implementation.
- Domain repositories and API contracts stay intact; only transport, session storage, and some bootstrap logic change.
- Delivery is vertical-slice first: auth/session, then discovery/player/subscription, then polish and smoke test.

## Task List

| Phase | Task | Status | Description | Acceptance Criteria | Verification | Dependencies | Files likely touched | Scope |
|---|---|---|---|---|---|---|---|---|
| 1 | Transport foundation | Done | Add browser-compatible transport for web and change repo selection to configuration-based instead of forcing mock on web. | Web build can create HTTP repositories when `API_BASE_URL` points to backend; mock is only used in explicit demo/test mode. | `flutter test` for app_config + repository selection; web build boot check. | None | `apps/mobile/lib/app/app_config.dart`, `apps/mobile/lib/app/clone_fanos_app.dart`, `apps/mobile/lib/features/*/domain/*.dart`, `apps/mobile/lib/features/*/data/*.dart` | Large |
| 2 | Web session/auth | Done | Move web session persistence to browser-safe storage and make login/refresh/me work via API. | Refresh after reload preserves session; logout clears session; `GET /auth/me` works in browser. | Targeted tests for auth/session bootstrap; manual login/logout/refresh on web. | Task 1 | `apps/mobile/lib/core/storage/*`, `apps/mobile/lib/features/auth/*`, `apps/mobile/lib/app/clone_fanos_app.dart`, `apps/mobile/test/*` | Medium |
| 3 | Core content flow on web | Done | Wire discovery/search/detail/player/progress/bookmark/subscription to the new API transport. | Browse/search/detail/player/progress/bookmark/favorite/subscription run on web with real API data. | Targeted widget/tests for core flows; manual browser smoke. | Tasks 1-2 | `apps/mobile/lib/features/discovery/*`, `apps/mobile/lib/features/player/*`, `apps/mobile/lib/features/engagement/*`, `apps/mobile/lib/features/subscription/*`, related tests | Large |
| 4 | Backend compatibility check | Pending | Confirm backend satisfies browser requirements: CORS, auth headers, response envelopes, asset access. | Browser requests do not hit CORS/auth/header errors; asset access and playback load correctly. | Manual browser smoke + backend targeted tests if needed. | Tasks 1-3 | `apps/api/src/http/*`, `docs/api-design.md` if needed | Medium |
| 5 | Polish and rollout guard | Pending | Clean up README/config, add test coverage for web API mode, keep demo mode separate for local/dev. | Docs clearly explain how to run web API mode; tests protect against regressions to mock-on-web. | Full targeted mobile tests; one final web smoke run. | Tasks 1-4 | `apps/mobile/README.md`, `apps/mobile/test/*`, `apps/mobile/lib/app/app_config.dart` | Small |

## Checkpoint: After Task 1
- `flutter test` for app config/repository selection passes.
- Web app builds against API transport without forcing mock via `kIsWeb`.

## Checkpoint: After Tasks 1-2
- Relevant config/session tests pass.
- Web app boots using API transport, not forced mock.
- Login/refresh/logout works on web.

## Checkpoint: After Tasks 3-4
- Browse/search/detail/player/progress/subscription work in the browser with real API data.
- No CORS/auth/header errors in dev browser.
- Asset access and playback do not break on web.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| `dart:io HttpClient` does not run on web | High | Implement browser-specific transport first, do not reuse the existing HTTP class directly. |
| Web session persistence is insufficient | High | Use browser-safe storage for session and test refresh/reload. |
| CORS or auth headers blocked by backend | Medium | Verify `Authorization`, `x-user-id`, and `Content-Type` from the browser. |
| Demo/mock leaks into web API mode | Medium | Move mock selection to an explicit flag instead of `kIsWeb`. |

## Open Questions
- Does web need persistent session across refresh, or is login-on-reload acceptable?
- Should web use bearer tokens like native, or move to cookie session later?
- Is the target just dev/staging, or is production browser rollout desired now?
