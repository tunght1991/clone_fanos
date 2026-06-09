# Spec: Sprint 19 - Flutter Web API Parity

## Assumptions

1. Sprint 19 targets Flutter web API parity, not a new product feature.
2. Native mobile behavior stays unchanged.
3. Web should use the backend API through explicit configuration; mock/demo mode remains available only by explicit opt-in.
4. No backend schema change is expected unless browser compatibility work proves it is necessary.

If any of these assumptions are wrong, revise this spec before implementation starts.

## Objective

Sprint 19 removes the current web fallback-to-mock behavior and makes Flutter web run against the same backend API used by native mobile. The goal is to let the browser exercise real auth, content, player, progress, bookmark, favorite, and subscription flows without platform-based repo switching.

This sprint is about transport and bootstrap parity, not feature expansion. The result should let another engineer run the web app in Chrome, point it at a local API, and verify that the same product flows work with browser-safe session handling.

## Tech Stack

- Flutter web in `apps/mobile`
- Existing NestJS/TypeScript API in `apps/api`
- Existing shared DTOs/contracts in `packages/shared`
- Browser-safe transport and storage adapters in Dart
- Local PostgreSQL + API runtime for manual smoke

## Commands

Install dependencies:

```bash
pnpm install
```

Run the root validation gate:

```bash
pnpm.cmd check
```

Run mobile tests:

```powershell
Set-Location D:\01_Work\clone_fanos\apps\mobile
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat test
```

Run the API locally for browser smoke:

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm.cmd api:migrate
pnpm.cmd api:dev
```

Run the web app against the local API:

```powershell
Set-Location D:\01_Work\clone_fanos\apps\mobile
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat run -d chrome --dart-define=API_BASE_URL=http://localhost:3000
```

Build the web target:

```powershell
Set-Location D:\01_Work\clone_fanos\apps\mobile
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat build web --dart-define=API_BASE_URL=http://localhost:3000
```

## Project Structure

- `apps/mobile/lib/app/app_config.dart` - runtime mode and API base URL selection
- `apps/mobile/lib/app/clone_fanos_app.dart` - app bootstrap and repository wiring
- `apps/mobile/lib/core/storage/*` - browser-safe session storage and persisted bootstrap state
- `apps/mobile/lib/features/auth/*` - login, logout, refresh, and `me` flow
- `apps/mobile/lib/features/discovery/*` - browse/search/detail repositories and state
- `apps/mobile/lib/features/player/*` - playback, resume, and progress sync
- `apps/mobile/lib/features/engagement/*` - favorite and bookmark data paths
- `apps/mobile/lib/features/subscription/*` - entitlement and plan flows
- `apps/mobile/test/*` - config, session, and flow tests
- `apps/api/src/http/*` - only if browser compatibility work needs CORS/auth/header adjustments
- `docs/mobile-web-api-plan.md` - implementation direction that the sprint spec formalizes
- `docs/sprint-19-spec.md` - this sprint source of truth
- `docs/implementation-sprint-checklist.md` - sprint tracking after the spec is approved

## Code Style

Prefer explicit configuration over platform inference. Web must not silently switch to mock because it is running in a browser.

Keep transport selection centralized and keep repository construction boring and obvious:

```dart
class RepositoryFactory {
  const RepositoryFactory({
    required this.config,
    required this.transport,
  });

  final AppConfig config;
  final ApiTransport transport;

  AudiobookRepository createAudiobookRepository() {
    if (config.mode == AppMode.demo) {
      return MockAudiobookRepository();
    }
    return ApiAudiobookRepository(transport: transport);
  }
}
```

Conventions:

- Use explicit runtime modes such as `demo`, `test`, and `api`.
- Keep browser-safe session/storage logic behind a narrow adapter.
- Preserve shared DTOs and response shapes unless a browser-compatibility blocker proves otherwise.
- Avoid `kIsWeb` as a repository-selection switch.

## Testing Strategy

- Start with targeted Dart tests for config selection, browser-safe session storage, and auth bootstrap behavior.
- Add or update web-oriented widget/integration tests for login, logout, refresh, browse, search, and detail flows against API-backed repositories.
- Use a manual Chrome smoke run against a local API to verify the browser path end to end.
- Run `pnpm.cmd check` once targeted tests pass and the web path is verified.
- If backend compatibility changes are needed, cover them with focused API tests around CORS, auth headers, or response handling.

## Boundaries

- Always: preserve native mobile behavior; keep demo/mock mode explicit; validate browser-configured API base URLs; keep docs aligned with the chosen web runtime mode; run targeted tests before broad validation.
- Ask first: new dependencies, auth model changes, CORS policy changes, CI or deployment changes, or any backend schema change.
- Never: reintroduce web-forced mock selection, commit secrets, weaken auth, alter unrelated mobile features, or change shared contracts without updating the spec first.

## Success Criteria

- Flutter web can boot with `API_BASE_URL` set and use the real backend instead of being forced to mock by platform detection.
- Explicit demo/test mode still works and remains separate from API mode.
- Browser session bootstrap, login, logout, and refresh work with the chosen browser-safe storage strategy.
- Core browser flows for browse, search, detail, player, progress, bookmark, favorite, and subscription run against the API.
- Any browser-compatibility adjustments needed on the API are documented and tested.
- The repo docs clearly explain how to run the web app in API mode.

## Open Questions

1. Should browser session state persist across page refresh, or is re-login acceptable for Sprint 19?
2. Should the web path use bearer tokens only, or should we move toward cookie-based sessions later?
3. Is Sprint 19 targeting dev/staging only, or is production browser rollout in scope?
4. What should the explicit non-API mode be called in the app config: `demo`, `test`, or another name?
5. If backend compatibility work is needed, should it stay in Sprint 19 or be split into a follow-up sprint?
