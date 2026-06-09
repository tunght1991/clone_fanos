# Release Candidate Checklist

This checklist is the release gate for the MVP release candidate. It records
what must pass before a ship/no-ship decision can be made. Keep detailed command
logs outside the repo unless a failure needs to be attached to a bug report.

## Release Scope

- Target audience: internal QA release candidate.
- Product scope: Phase 1 MVP only.
- Explicitly out of scope: Phase 2 retention features, AI features, app store
  packaging, live billing provider setup, and production deployment changes.

## Automated Gates

Run these commands from the repository root unless noted otherwise.

| Gate | Command | Required result | Evidence |
|---|---|---|---|
| Install | `pnpm install` | Completes without dependency resolution errors | Record result only |
| Build | `pnpm.cmd build` | All workspace builds complete | Record result only |
| Lint | `pnpm.cmd lint` | No lint/type compile failures | Record result only |
| Typecheck | `pnpm.cmd typecheck` | No TypeScript typecheck failures | Record result only |
| Unit/integration tests | `pnpm.cmd test` | API, admin, and shared tests pass | Record result only |
| Mobile tests | `Set-Location 'apps/mobile'; flutter test` | Mobile suite passes | Record result only |
| Release gate | `pnpm.cmd check` | Lint, typecheck, tests, and mobile tests pass | Required for Sprint closure |

## Local Infrastructure Preflight

Use this preflight when validating API/database readiness locally.

| Step | Command | Required result | Notes |
|---|---|---|---|
| Start PostgreSQL | `docker compose -f infra/docker-compose.yml up -d` | PostgreSQL container starts and publishes `localhost:5434` | Requires Docker Desktop |
| Run migrations | `pnpm.cmd api:migrate` | Migrations complete without error | Run after PostgreSQL is healthy |
| Start API | `pnpm.cmd api:dev` | API starts without startup error | Use for manual API smoke only |

## MVP Smoke Matrix

Manual smoke validation should use seeded/mock data unless a release environment
is explicitly assigned. Mark each row pass/fail in the evidence log.

| Area | Smoke path | Pass condition |
|---|---|---|
| Auth | Onboard, register or login, logout | User reaches authenticated state and can return to signed-out state |
| Browse | Open home feed and category content | Featured/new/continue sections render or show intentional empty states |
| Search | Submit search, change sort/filter, open detail | Latest query results display and detail navigation works |
| Player/resume | Start a playable chapter, seek, return to detail/home | Playback screen opens and resume position remains coherent |
| Favorite/bookmark | Toggle favorite and create a bookmark/note | State updates without blocking playback or navigation |
| Subscription entitlement | Open paywall, select plan, run verify/unlock path with mock/sandbox state | Premium access changes only after entitlement success |
| Asset access | Open free and premium playable content | Free content plays; premium content respects entitlement gate |
| Admin content management | Open dashboard, create/edit content draft, review publish controls | Admin flow works without contract drift or broken navigation |
| API preflight | Run migration and API startup locally | API starts after migrations without schema/runtime errors |

## Evidence Log Template

Copy this block into the release notes or checklist update for each candidate
run. Do not paste bulky command output unless a failure requires investigation.

```markdown
## Release Candidate Evidence

- Candidate ID:
- Date/time:
- Owner:
- Git commit or working tree note:

| Test case(s) | Gate | Command or smoke path | Result | Notes |
|---|---|---|---|---|
| S18-TC-02 | Release gate | `pnpm.cmd check` | PASS/FAIL | |
| S18-TC-08 | Auth smoke | Onboard/login/logout | PASS/FAIL | |
| S18-TC-09 | Browse smoke | Home feed/category | PASS/FAIL | |
| S18-TC-09 | Search smoke | Query/filter/detail | PASS/FAIL | |
| S18-TC-10 | Player/resume smoke | Start/seek/resume | PASS/FAIL | |
| S18-TC-11 | Favorite/bookmark smoke | Toggle/create note | PASS/FAIL | |
| S18-TC-12 | Subscription smoke | Paywall/select/verify/unlock | PASS/FAIL | |
| S18-TC-12 | Asset access smoke | Free/premium playback gate | PASS/FAIL | |
| S18-TC-13 | Admin smoke | Dashboard/edit/publish controls | PASS/FAIL | |
| S18-TC-04..07 | API preflight | Docker/PostgreSQL/migration/API startup/health | PASS/FAIL | |

### Blockers

- None, or list each blocker with owner and next action.

### Accepted Residual Risks

- None, or list each accepted risk with explicit owner approval.

### Ship/No-Ship Decision

- Decision:
- Decider:
- Rationale:
```

## Ship/No-Ship Criteria

Ship only when all required criteria are true:

- `pnpm.cmd check` passes on the release candidate working tree.
- No critical MVP smoke path is failing.
- All release blockers have an owner and are resolved or explicitly deferred.
- Any accepted residual risk is documented with owner approval.
- No active release-readiness sprint task remains `TODO` or `DOING` in the master checklist.

No-ship when any required criterion is false.

## Latest Internal QA RC Evidence

- Candidate ID: Internal QA RC - Sprint 17 readiness
- Date/time: 2026-06-03 14:06:47 +07:00
- Owner: Codex
- Git commit or working tree note: working tree includes Sprint 16 mobile hardening plus Sprint 17 release-readiness docs

| Gate | Command or smoke path | Result | Notes |
|---|---|---|---|
| Release gate | `pnpm.cmd check` | PASS | Lint, typecheck, workspace tests, and mobile tests passed on 2026-06-03 |
| Internal QA RC decision | User-approved internal QA candidate promotion | GO | Candidate may move to internal QA validation |
| Manual smoke matrix | Documentation-defined MVP smoke paths | NOT RUN | Required during internal QA validation before any production ship decision |

### Blockers

- None identified for internal QA RC promotion during automated gate verification.
- Production ship remains blocked until manual smoke, local infra/API preflight where required, and owner ship/no-ship decision are complete.

### Accepted Residual Risks

- Manual MVP smoke paths have not been executed before internal QA RC promotion.
- Local Docker/API migration preflight was documented but not run before internal QA RC promotion.
- Working tree is not clean; release tagging should happen only after the intended candidate changes are committed.

### Ship/No-Ship Decision

- Decision: GO for internal QA RC; NO-GO for production ship.
- Decider: user request on 2026-06-03.
- Rationale: automated release gate passed, and internal QA is the next validation stage. Production ship still requires manual MVP smoke evidence, local infra/API preflight where required, clean candidate tagging, and product/platform owner approval.

## CF-03 Release Readiness Evidence

- Candidate ID: CF-03 release readiness follow-up
- Date/time: 2026-06-04 11:23:52 +07:00
- Owner: Codex
- Git commit or working tree note: working tree includes Sprint 16/17 changes plus CF-01 subscription live-mode guard and CF-02 dependency audit override

| Gate | Command or smoke path | Result | Notes |
|---|---|---|---|
| Release gate | `pnpm.cmd check` | PASS | Lint, typecheck, workspace tests, and mobile tests passed on 2026-06-04 |
| Dependency audit | `pnpm.cmd audit --audit-level moderate` | PASS | No known vulnerabilities after `qs@6.15.2` override |
| PostgreSQL preflight | `docker compose -f infra/docker-compose.yml up -d` | BLOCKED | Docker CLI is installed, but Docker Desktop Linux engine is not running: `dockerDesktopLinuxEngine` pipe not found |
| API migration preflight | `pnpm.cmd api:migrate` | NOT RUN | Blocked by PostgreSQL container startup failure |
| API startup preflight | `pnpm.cmd api:dev` | NOT RUN | Blocked by PostgreSQL container startup failure |
| Manual MVP smoke matrix | Auth, browse, search, player, favorite/bookmark, subscription, asset access, admin | NOT RUN | Requires manual/runtime validation after Docker/API preflight is available |
| Automated smoke coverage | Existing API/admin/shared/mobile test suites | PASS | Covers core auth, browse/search/detail/player, subscription unlock, asset/admin paths, but does not replace manual smoke evidence |

### CF-03 Blockers

- Docker Desktop must be started before local PostgreSQL, migration, and API startup preflight can be completed.
- Manual MVP smoke matrix remains required before any production ship decision.
- Working tree is not clean; release tagging should happen only after intended candidate changes are committed.

### CF-03 Accepted Residual Risks

- None accepted for production ship.
- Internal QA can continue only with the documented limitation that local API preflight and manual smoke are still pending.

### CF-03 Ship/No-Ship Decision

- Decision: NO-GO for production ship.
- Decider: Codex execution evidence on 2026-06-04.
- Rationale: automated gates pass, but Docker/API preflight and manual MVP smoke evidence are incomplete, and the candidate working tree is not clean.

## Sprint 18 Production Readiness Evidence

- Candidate ID: Sprint 18 production-readiness evidence closure
- Date/time: 2026-06-05 23:16:57 +07:00
- Owner: Codex
- Git commit or working tree note: working tree is not clean; release tagging remains blocked until intended candidate changes are committed

| Test case(s) | Gate | Command or smoke path | Result | Notes |
|---|---|---|---|---|
| S18-TC-01 | Candidate baseline | `git status --short`; blocker scan | PASS | Baseline captured; working tree has modified and untracked files, so release tagging is blocked |
| S18-TC-02 | Release gate | `pnpm.cmd check` | PASS | Lint, typecheck, API/admin/shared tests, and mobile tests passed on 2026-06-05 23:16 |
| S18-TC-03 | Dependency audit | `pnpm.cmd audit --audit-level moderate` | PASS | No known vulnerabilities found |
| S18-TC-04 | Docker engine | `docker version` | PASS | Docker Desktop Linux engine is running on `desktop-linux` context |
| S18-TC-05 | PostgreSQL compose health | `docker compose -f infra/docker-compose.yml up -d postgres`; `docker compose -f infra/docker-compose.yml ps postgres` | PASS | `clone-fanos-postgres` is running and healthy on `localhost:5434` |
| S18-TC-06 | API migration preflight | `pnpm.cmd api:migrate` | PASS | `0002_subscription_receipt_verifications.sql` added/applied for local DBs that already skipped the updated `0001_initial.sql` |
| S18-TC-07 | API startup and health | `pnpm.cmd api:dev`; `Invoke-WebRequest http://localhost:3000/health` | PASS | API listened on port `3000`; `/health` returned `200` with `{"status":"ok"}` |
| S18-TC-08 | Auth smoke | Admin/mobile web roots plus user register, `/auth/me`, logout, login via local API | PASS | Smoke execution `20260605231432`; mobile web server returned Flutter bootstrap on `127.0.0.1:53542`; admin root/config returned `200` |
| S18-TC-09 | Browse/search/detail smoke | `GET /audiobooks`, `GET /search`, `GET /audiobooks/:id` | PASS | Seeded free audiobook found by search; detail returned chapter data |
| S18-TC-10 | Player/resume smoke | `POST /playback/progress`; `GET /playback/progress/:audiobookId` | PASS | Saved and reloaded `positionMs=42000` |
| S18-TC-11 | Favorite/bookmark smoke | `POST/GET /favorites`; `POST/GET /bookmarks` | PASS | Favorite toggle/list and bookmark create/list passed for seeded audiobook |
| S18-TC-12 | Subscription and asset gate smoke | `POST /assets/access`; `GET /subscriptions/plans`; `POST /subscriptions/checkout`; `POST /subscriptions/verify` | PASS | Premium asset returned `403` before entitlement; receipt verify returned `SUCCEEDED`; entitlement `ACTIVE`; premium asset unlocked |
| S18-TC-13 | Admin content-management smoke | Admin login/me; create/publish/list free and premium content via `/admin/*` API | PASS | Created two audiobooks with chapters, published chapters/books, and list query returned seeded item |
| S18-TC-14 | Final decision and handoff | Release evidence review | PASS | Decision recorded as NO-GO for production ship until clean candidate and owner approval |

### Sprint 18 Blockers

- Working tree is not clean; release tagging should happen only after intended candidate changes are committed.
- Production release/tag/deploy remains ask-first and needs explicit owner approval.

### Sprint 18 Accepted Residual Risks

- None accepted for production ship.
- Sprint 18 smoke used local seeded data and sandbox billing, not a dedicated production-like release environment.

### Sprint 18 Ship/No-Ship Decision

- Decision: NO-GO for production ship.
- Decider: Codex execution evidence on 2026-06-05.
- Rationale: automated gate, dependency audit, Docker/PostgreSQL, migration, API health, and local MVP smoke pass. Production ship still requires a clean intended candidate, explicit owner approval, and release tagging/deployment authorization.

## Smoke Helper Decision

No `tools/release-smoke.ps1` helper is added in Sprint 17. The release gate stays
documentation-driven because the existing root scripts are explicit, short, and
already compose the test suites. Add a helper in a later sprint only if repeated
manual release runs show command ordering mistakes.
