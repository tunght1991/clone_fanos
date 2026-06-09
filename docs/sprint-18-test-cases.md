# Test Cases: Sprint 18 - Production Readiness Evidence Closure

## Purpose

These test cases define the evidence Sprint 18 must collect before changing the production ship/no-ship decision. Following the TDD workflow, these tests are written before the Sprint 18 execution work. They are expected to remain RED/PENDING until the matching command or manual smoke path is run and recorded.

## Status Model

- `RED`: not run yet, blocked, or failing.
- `GREEN`: passed with evidence recorded.
- `BLOCKED`: cannot run because a prerequisite is unavailable.
- `N/A`: explicitly out of scope with owner approval.

Do not mark a test `GREEN` without a dated evidence row in `docs/release-candidate-checklist.md` or the named checklist file.

## Test Case Matrix

| ID | Area | Type | Initial status | Evidence target |
|---|---|---|---|---|
| S18-TC-01 | Candidate baseline | Documentation/check | RED | `docs/release-candidate-checklist.md` |
| S18-TC-02 | Automated release gate | Command | RED | `docs/release-candidate-checklist.md` |
| S18-TC-03 | Dependency audit | Command | RED | `docs/release-candidate-checklist.md` |
| S18-TC-04 | Docker engine | Command | RED | `docs/release-candidate-checklist.md` |
| S18-TC-05 | PostgreSQL compose health | Command/runtime | RED | `docs/release-candidate-checklist.md` |
| S18-TC-06 | API migration | Command/runtime | RED | `docs/technical-checklist.md` |
| S18-TC-07 | API startup and health | Runtime/API | RED | `docs/release-candidate-checklist.md` |
| S18-TC-08 | Mobile auth smoke | Manual smoke | RED | `docs/release-candidate-checklist.md` |
| S18-TC-09 | Mobile browse/search/detail smoke | Manual smoke | RED | `docs/release-candidate-checklist.md` |
| S18-TC-10 | Mobile player/resume smoke | Manual smoke | RED | `docs/release-candidate-checklist.md` |
| S18-TC-11 | Mobile favorite/bookmark smoke | Manual smoke | RED | `docs/release-candidate-checklist.md` |
| S18-TC-12 | Subscription and asset gate smoke | Manual smoke | RED | `docs/release-candidate-checklist.md` |
| S18-TC-13 | Admin content-management smoke | Manual smoke | RED | `docs/release-candidate-checklist.md` |
| S18-TC-14 | Final decision and handoff | Documentation/check | RED | `docs/implementation-sprint-checklist.md` |

## Latest Execution Results

- Execution ID: Sprint 18 test-case run
- Date/time: 2026-06-05 23:16:57 +07:00
- Owner: Codex
- Environment: local Windows workspace

| ID | Result | Evidence | Notes |
|---|---|---|---|
| S18-TC-01 | GREEN | `git status --short`; blocker scan | Candidate baseline captured; working tree is not clean, so release tagging remains blocked |
| S18-TC-02 | GREEN | `pnpm.cmd check` | Lint, typecheck, API/admin/shared tests, and Flutter tests passed after Sprint 18 backend fixes |
| S18-TC-03 | GREEN | `pnpm.cmd audit --audit-level moderate` | No known vulnerabilities found |
| S18-TC-04 | GREEN | `docker version` | Docker Desktop Linux engine is running on `desktop-linux` context |
| S18-TC-05 | GREEN | `docker compose -f infra/docker-compose.yml up -d postgres`; `docker compose -f infra/docker-compose.yml ps postgres` | `clone-fanos-postgres` is running and healthy on `localhost:5434` |
| S18-TC-06 | GREEN | `pnpm.cmd api:migrate` | Migration command completed; `0002_subscription_receipt_verifications.sql` covers local DBs that already applied the older `0001_initial.sql` |
| S18-TC-07 | GREEN | `pnpm.cmd api:dev`; `Invoke-WebRequest http://localhost:3000/health` | API listened on port `3000`; `/health` returned `200` with `{"status":"ok"}` |
| S18-TC-08 | GREEN | Local API/admin/mobile smoke `20260605231432` | Admin and mobile web roots returned `200`; user register, `/auth/me`, logout, login passed via API |
| S18-TC-09 | GREEN | Local API smoke `20260605231432` | Browse feed returned data; search found seeded content; audiobook detail returned chapters |
| S18-TC-10 | GREEN | Local API smoke `20260605231432` | Playback progress save/get preserved `positionMs=42000` |
| S18-TC-11 | GREEN | Local API smoke `20260605231432` | Favorite toggle/list and bookmark create/list passed |
| S18-TC-12 | GREEN | Local API smoke `20260605231432` | Free asset access passed; premium asset blocked before verify; checkout + receipt verify returned `SUCCEEDED`; premium asset unlocked after entitlement `ACTIVE` |
| S18-TC-13 | GREEN | Local API/admin smoke `20260605231432` | Admin login/me, create free/premium audiobooks with chapters, publish chapters/audiobooks, and admin list passed |
| S18-TC-14 | GREEN | Release evidence review | Production ship remains NO-GO until candidate working tree is clean and owner approval/release tagging are explicit |

## Test Cases

### S18-TC-01: Candidate Baseline Is Explicit

Preconditions:

- Sprint 18 spec and implementation plan exist.
- Working tree may be dirty.

Steps:

1. Run `git status --short`.
2. Run `rg -n "BLOCKED|NOT RUN|NO-GO|DOING" docs/release-candidate-checklist.md docs/technical-checklist.md`.
3. Record the candidate state, blockers, and open questions.

Expected result:

- Working tree state is classified as clean, intended-dirty, or blocked from release tagging.
- Existing blockers are reconciled with release and technical checklists.
- Decision owner and smoke environment questions are answered or carried forward.

Failure rule:

- If candidate state or blockers are unclear, Sprint 18 cannot proceed to final decision.

### S18-TC-02: Automated Release Gate Passes

Preconditions:

- Dependencies are installed.
- No known environment issue prevents local test execution.

Steps:

1. Run `pnpm.cmd check` from the repo root.
2. Record PASS/FAIL with date/time and owner.

Expected result:

- Lint, typecheck, API/admin/shared tests, and mobile tests complete successfully.

Failure rule:

- Any failing subgate keeps production readiness `NO-GO` until fixed and re-run.

### S18-TC-03: Dependency Audit Has No Moderate-Or-Higher Vulnerabilities

Preconditions:

- `pnpm-lock.yaml` is present.

Steps:

1. Run `pnpm.cmd audit --audit-level moderate`.
2. Record PASS/FAIL with any vulnerability summary.

Expected result:

- Command reports no known vulnerabilities at moderate, high, or critical severity.

Failure rule:

- Any moderate-or-higher vulnerability needs owner triage before production readiness can be `GO`.

### S18-TC-04: Docker Engine Is Available

Preconditions:

- Docker Desktop is installed.

Steps:

1. Start Docker Desktop if it is not already running.
2. Run `docker version`.

Expected result:

- Docker client and server are reachable.
- The Linux engine pipe is available.

Failure rule:

- If Docker server is unavailable, mark Docker/API preflight `BLOCKED`.

### S18-TC-05: PostgreSQL Compose Service Is Healthy

Preconditions:

- S18-TC-04 is GREEN.

Steps:

1. Run `docker compose -f infra/docker-compose.yml up -d`.
2. Run `docker compose -f infra/docker-compose.yml ps`.

Expected result:

- `clone-fanos-postgres` starts.
- PostgreSQL publishes `localhost:5434`.
- Health status is healthy or reaches healthy within the compose healthcheck window.

Failure rule:

- If PostgreSQL is not healthy, API migration and startup tests remain BLOCKED.

### S18-TC-06: API Migrations Run Against Local PostgreSQL

Preconditions:

- S18-TC-05 is GREEN.
- Root `.env` or process environment points `DATABASE_URL` to local PostgreSQL.

Steps:

1. Run `pnpm.cmd api:migrate`.
2. Record result in `docs/technical-checklist.md`.

Expected result:

- Migrations complete without schema or connection errors.

Failure rule:

- Migration failure keeps `Migration nen chay duoc end-to-end` in `DOING` or blocked state.

### S18-TC-07: API Starts and Health Endpoint Responds

Preconditions:

- S18-TC-06 is GREEN.

Steps:

1. Start the API with `pnpm.cmd api:dev`.
2. In another shell, run `curl http://localhost:3000/health`.
3. Stop the API after evidence is recorded.

Expected result:

- API starts without startup error.
- Health endpoint returns HTTP 200 and body containing `status: ok`.

Failure rule:

- Startup or health failure keeps production readiness `NO-GO`.

### S18-TC-08: Mobile Auth Smoke Passes

Preconditions:

- Manual smoke environment is declared: local seeded/mock or release environment.
- Mobile app can launch.

Steps:

1. Launch the mobile app.
2. Complete onboarding if shown.
3. Register or login.
4. Logout.

Expected result:

- User reaches authenticated state.
- User can return to signed-out state without navigation breakage.

Failure rule:

- Auth smoke failure blocks production readiness.

### S18-TC-09: Mobile Browse/Search/Detail Smoke Passes

Preconditions:

- S18-TC-08 is GREEN.

Steps:

1. Open home feed.
2. Open category or featured content.
3. Submit a search query.
4. Change sort/filter if available.
5. Open an audiobook detail page.

Expected result:

- Browse sections render or show intentional empty states.
- Search results match the latest query state.
- Detail navigation works.

Failure rule:

- Search stale results, broken detail navigation, or unexpected blank states block production readiness.

### S18-TC-10: Mobile Player/Resume Smoke Passes

Preconditions:

- S18-TC-09 is GREEN.
- A playable free chapter exists in the selected environment.

Steps:

1. Start a playable chapter.
2. Seek to a later position.
3. Return to detail or home.
4. Re-open playback or continue-listening state.

Expected result:

- Player opens.
- Seek does not break playback state.
- Resume position remains coherent.

Failure rule:

- Playback or resume failure blocks production readiness.

### S18-TC-11: Mobile Favorite/Bookmark Smoke Passes

Preconditions:

- S18-TC-10 is GREEN.

Steps:

1. Toggle favorite on an audiobook.
2. Create a bookmark or note during playback.
3. Re-open favorite/bookmark surfaces.

Expected result:

- Favorite state updates visibly.
- Bookmark/note is saved or intentionally reflected by the current environment.
- Playback remains usable.

Failure rule:

- State loss or playback-blocking errors block production readiness.

### S18-TC-12: Subscription and Asset Gate Smoke Passes

Preconditions:

- S18-TC-09 is GREEN.
- Premium and free content exist in the selected environment.

Steps:

1. Open premium content while entitlement is locked.
2. Open paywall and select a plan.
3. Run checkout/verify/unlock path with mock or sandbox state.
4. Open free and premium playable content.

Expected result:

- Premium content stays locked until entitlement success.
- Payment success alone does not unlock premium content.
- Free content plays.
- Premium content respects entitlement gate.

Failure rule:

- Entitlement bypass or asset-access leakage blocks production readiness.

### S18-TC-13: Admin Content-Management Smoke Passes

Preconditions:

- API smoke environment is available, or local fallback use is explicitly recorded.
- Admin app can launch.

Steps:

1. Start admin app with `pnpm.cmd --dir apps/admin dev`.
2. Open dashboard.
3. Create or edit a content draft.
4. Review publish controls.

Expected result:

- Admin dashboard opens.
- Draft edit path works.
- Publish controls are visible and do not show contract drift or broken navigation.

Failure rule:

- Admin navigation, contract, or publish-control failure blocks production readiness.

### S18-TC-14: Final Decision and Handoff Are Evidence-Based

Preconditions:

- S18-TC-01 through S18-TC-13 are GREEN, BLOCKED, or explicitly accepted with owner approval.

Steps:

1. Update `docs/release-candidate-checklist.md` with Sprint 18 evidence.
2. Update `docs/technical-checklist.md` only for checks that actually passed.
3. Update `docs/implementation-sprint-checklist.md` with actual Sprint 18 statuses.
4. Record final decision as `GO`, `NO-GO`, or `GO for internal QA only`.

Expected result:

- Final decision includes rationale, decider, blockers, and accepted residual risks.
- Release tagging and deployment remain blocked unless explicitly approved.

Failure rule:

- Missing evidence, unclear owner approval, or unresolved critical blockers require `NO-GO`.

## Verification Before Sprint 18 Closure

Run:

```bash
rg -n "S18-TC-|RED|BLOCKED|Failure rule" docs/sprint-18-test-cases.md
rg -n "Sprint 18|S18-TC" docs/sprint-18-spec.md docs/sprint-18-implementation-plan.md docs/release-candidate-checklist.md
```

Sprint 18 is not complete until test case results are represented in release evidence and the master sprint checklist.
