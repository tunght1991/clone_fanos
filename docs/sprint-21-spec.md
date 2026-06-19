# Spec: Sprint 21 - In-App Resume Reminder v1

## Assumptions

1. Sprint 21 is the next Phase 2 sprint after Sprint 20.
2. Notifications should stay separate from the Sprint 20 retention read model, but reuse the same activity signals.
3. Scope is in-app only. No push provider, device permissions, or background scheduling in this sprint.
4. The sprint should not add user preference settings or a notification inbox management screen.
5. Existing Home, browse, player, and subscription flows stay unchanged unless the new reminder surface explicitly deep-links into them.

If any of these assumptions are wrong, revise this spec before implementation starts.

## Objective

Sprint 21 adds a small in-app resume reminder on Home so a returning user can jump back into an unfinished audiobook faster.

The backend should expose a read-only notification contract that identifies the best resume target from recent playback activity. The mobile app should render that reminder as a lightweight Home surface, track impression and tap analytics, and deep-link the user back into the correct audiobook or chapter.

This sprint is deliberately narrower than push notifications. It is a deterministic, read-only reminder surface, not a notification platform.

## Tech Stack

- Flutter mobile app in `apps/mobile`
- NestJS/TypeScript backend in `apps/api`
- Shared DTOs and contracts in `packages/shared`
- PostgreSQL-backed playback and engagement data
- Existing analytics event pipeline

## Commands

Install dependencies:

```bash
pnpm install
```

Run the release gate:

```bash
pnpm.cmd check
```

Run API tests:

```bash
pnpm.cmd api:test
```

Run mobile tests:

```powershell
Set-Location D:\01_Work\clone_fanos\apps\mobile
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat test
```

Run the local API with PostgreSQL for manual smoke:

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm.cmd api:migrate
pnpm.cmd api:dev
```

Optional dependency audit for release validation:

```bash
pnpm.cmd audit --audit-level moderate
```

## Project Structure

- `packages/shared/src/contracts/notification.ts` - shared notification DTOs and enums
- `apps/api/src/modules/notification/*` - read-only notification read model and service logic
- `apps/api/src/http/notification.http.controller.ts` - HTTP wiring for the new notification endpoint
- `apps/mobile/lib/features/notification/*` - mobile repository, models, and data loading
- `apps/mobile/lib/features/home/presentation/home_shell.dart` - Home surface that renders the reminder
- `apps/mobile/test/home_shell_test.dart` - widget coverage for reminder rendering and navigation
- `apps/api/src/http/backend.smoke.test.ts` - backend smoke coverage for the new contract
- `docs/api-design.md` - API contract source of truth
- `docs/mobile-screen-specs/02-home-browse.md` - Home UI contract and analytics mapping
- `docs/implementation-sprint-checklist.md` - sprint tracking once the plan is approved
- `docs/sprint-21-spec.md` - this sprint source of truth
- `docs/sprint-21-implementation-plan.md` - ordered task breakdown for implementation

## Code Style

Prefer a single deterministic reminder over a generic notification framework.

Keep the contract read-only, explicit, and easy to reason about:

```ts
export interface ResumeReminderDto {
  audiobookId: string;
  chapterId: string;
  title: string;
  subtitle: string | null;
  progressMs: number;
  lastActivityAt: string;
}

export interface NotificationHomeResponseDto {
  data: {
    resumeReminder: ResumeReminderDto | null;
  };
  meta: {
    generatedAt: string;
    windowDays: number;
  };
}
```

Conventions:

- Keep notification selection deterministic and bounded.
- Reuse existing playback and engagement signals instead of introducing a new write path.
- Use null to represent "no reminder available" rather than an empty object with sentinel fields.
- Keep Home rendering additive and compact so the current browse experience stays primary.
- If a UI token or component gap appears, prefer existing `DESIGN.md` tokens and patterns before adding a new visual rule.

## Testing Strategy

- Start with targeted API tests for the reminder selection logic and response shape.
- Add mobile widget tests for the Home reminder state, empty state, tap behavior, and analytics events.
- Cover the endpoint with backend smoke tests so the read model stays stable.
- Run `pnpm.cmd check` after targeted tests pass.
- Use a manual smoke pass against local seeded data to verify the reminder appears only when an unfinished listening session exists.

## Boundaries

- Always: keep the feature read-only; preserve existing Home browse/search/player flows; validate response shapes at the contract boundary; run targeted tests before broad validation; keep analytics payloads structured.
- Ask first: push notification providers, background scheduling, device permission prompts, database schema additions, new dependencies, or CI/deployment changes.
- Never: add silent background jobs, expose raw storage URLs or secrets, weaken auth or entitlement checks, or turn the reminder into a write-heavy notification system without a new spec.

## Success Criteria

- Home shows a single resume reminder when the user has an unfinished listening session inside the configured activity window.
- Home hides or collapses the reminder cleanly when there is nothing actionable.
- Tapping the reminder deep-links to the correct audiobook or chapter position.
- The reminder impression and tap are tracked with stable analytics event names and structured payloads.
- Existing browse, search, detail, player, and subscription flows continue to pass their current tests.
- The repo docs explain the in-app-only notification scope clearly.

## Open Questions

1. Should Sprint 22 expand this into push notifications, or keep all notifications in-app only?
2. Should the reminder surface stay on Home, or move to a dedicated notifications area later?
3. Should the read model surface only a resume reminder, or also a small backlog of recent system-generated notices?
