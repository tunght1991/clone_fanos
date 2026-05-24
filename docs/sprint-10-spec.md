# Spec: Sprint 10 - Risk Hardening and Scope Control

## Objective
Sprint 10 focuses on reducing remaining delivery risk after Sprint 9 is complete. The goal is not to add new product scope, but to lock down the parts of the platform that can regress or expand unexpectedly:

- subscription scope and entitlement behavior
- Elasticsearch reindex/search consistency after content changes
- offline playback boundary so it does not expand beyond MVP
- narrator cardinality and role rules
- asset access consistency between backend and mobile

Primary users impacted:

- end users listening to audiobook content
- admins publishing and updating content
- backend/platform engineers maintaining runtime behavior

Success means the existing MVP flow stays stable while these five risk areas become enforced by code, tests, and docs.

## Tech Stack

- Monorepo with `apps/api` (NestJS/TypeScript), `apps/mobile` (Flutter), `apps/admin` (web CMS), and `packages/shared`
- PostgreSQL for persistence
- Elasticsearch for search and reindex flow
- Existing contract-first DTOs in `packages/shared`
- Existing docs in `docs/` as the contract source of truth

## Commands

Build:

```bash
pnpm build
```

Test:

```bash
pnpm test
```

Lint:

```bash
pnpm lint
```

Typecheck:

```bash
pnpm typecheck
```

Targeted verification during implementation:

```bash
pnpm --dir apps/api test
pnpm --dir apps/api lint
pnpm --dir apps/mobile test
pnpm --dir apps/admin test
```

If a task touches only contracts or docs, prefer the smallest package-level check that exercises the change.

## Project Structure

- `apps/api/` -> backend API, subscription, search, asset access, analytics, and admin content behavior
- `apps/mobile/` -> end-user mobile flows, gating, playback, and asset consumption
- `apps/admin/` -> CMS flows that may need to reflect new constraints
- `packages/shared/` -> DTOs, enums, and contract types that define cross-app behavior
- `docs/` -> PRD, API design, data model, security, flow diagram, and sprint checklist

Likely touch points for Sprint 10:

- `packages/shared/src/contracts/`
- `apps/api/src/modules/subscription/`
- `apps/api/src/modules/search/`
- `apps/api/src/modules/assets/`
- `apps/api/src/modules/content/`
- `apps/mobile/lib/`
- `docs/api-design.md`
- `docs/security.md`
- `docs/data-model.md`
- `docs/implementation-sprint-checklist.md`

## Code Style

Follow the existing repository style:

- contract-first types in shared package before implementation details
- explicit DTO validation at API boundaries
- avoid duplicating business rules across mobile and backend when the backend can be source of truth
- keep platform-specific behavior behind small adapters
- prefer small, named service methods over large conditional blocks

Example style for a cross-layer rule:

```ts
export function isNarratorRoleIndexValid(roleIndex: number): boolean {
  return Number.isInteger(roleIndex) && roleIndex >= 1 && roleIndex <= 3;
}
```

This rule should then be reused in validation, service logic, and tests rather than reimplemented ad hoc.

## Testing Strategy

Use targeted tests first, then broader suite checks:

- backend unit/service tests for subscription, search reindex, asset access, and narrator validation
- integration or API tests for publish/update/reindex, entitlement resolution, and asset access response shape
- mobile tests for gating and asset resolution behavior where the client consumes backend decisions
- contract tests when shared DTOs or enums change

Test expectations:

- every risk area introduced in Sprint 10 must have at least one regression test
- no behavior change is considered complete without a verification command or test result
- tests should fail before code changes when a bug or missing rule exists

## Boundaries

- Always:
  - keep changes scoped to the five risk areas unless a blocker requires a narrowly related fix
  - update docs when a contract or rule changes
  - run targeted tests before broader suite commands
  - preserve MVP behavior unless the spec explicitly expands it

- Ask first:
  - database schema changes
  - new dependencies
  - CI/CD changes
  - changes to production search mappings or reindex strategy
  - any new offline playback capability beyond current MVP behavior

- Never:
  - remove failing tests to make the sprint pass
  - commit secrets or raw storage URLs
  - widen subscription unlock rules on the client side
  - duplicate source-of-truth rules in mobile if backend can enforce them
  - expand scope into new monetization or media features

## Success Criteria

- Subscription flows remain limited to the already-approved entitlement model and cannot bypass verify/entitlement checks.
- Search results remain consistent after content update/publish, with reindex behavior covered by tests.
- Offline playback stays within current MVP scope, with explicit non-goals documented if needed.
- Narrator data is validated so role indices remain within 1..3 everywhere the rule matters.
- Asset access resolution is consistent between backend and mobile, with no raw storage URL exposure.
- Sprint 10 has targeted regression coverage for each of the five risk areas.

## Tasks

- [x] Task: Lock shared contracts and validation rules
  - Acceptance: shared DTOs/enums/rules cover entitlement status, asset access, narrator role index, and any search event shape that needs alignment; offline playback remains documented as a non-goal
  - Verify: targeted contract/type tests or package-level typecheck for `packages/shared`
  - Files: `packages/shared/src/contracts/*`, `docs/api-design.md`, `docs/data-model.md`, `docs/security.md`

- [x] Task: Harden subscription entitlement flow in backend
  - Acceptance: verify/entitlement paths cannot bypass server-side checks; existing happy path still works; regression tests cover failed and pending cases
  - Verify: targeted API/service tests in `apps/api`
  - Files: `apps/api/src/modules/subscription/*`, related backend tests

- [x] Task: Harden search reindex and mapping behavior
  - Acceptance: publish/update content triggers deterministic reindex behavior; mapping changes are minimal and covered by tests; rollback or failure behavior is explicit
  - Verify: targeted search/reindex tests in `apps/api`
  - Files: `apps/api/src/modules/search/*`, `apps/api/src/modules/content/*`, search-related tests, and mapping files if required

- [x] Task: Enforce asset access and narrator constraints in backend
  - Acceptance: asset access responses remain backend-resolved only; narrator role index stays within `1..3` at boundary validation and persistence
  - Verify: targeted service/API tests in `apps/api`
  - Files: `apps/api/src/modules/assets/*`, `apps/api/src/modules/content/*`, narrator-related validation/tests

- [x] Task: Align mobile gating and asset consumption with backend rules
  - Acceptance: mobile uses backend entitlement and asset-access decisions without introducing new offline playback scope; gating behavior matches contract
  - Verify: targeted mobile tests for gating/asset resolution
  - Files: `apps/mobile/lib/*`, especially subscription, playback, and asset access screens/services

- [x] Task: Synchronize docs and sprint checklist with implemented rules
  - Acceptance: docs reflect the final contract and the sprint checklist records the updated state of Sprint 10
  - Verify: manual review against implemented behavior and checklist entries
  - Files: `docs/api-design.md`, `docs/security.md`, `docs/data-model.md`, `docs/implementation-sprint-checklist.md`, `docs/sprint-10-spec.md`

## Open Questions

Resolved:

- All five risk areas are treated equally.
- Offline playback is a hard non-goal for this sprint.
- The sprint includes implementation changes, not docs only.
- Elasticsearch mappings may be changed if required, but only with tight scope and tests.
