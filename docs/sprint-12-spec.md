# Spec: Sprint 12 - Backend/Platform Risk Closure

## Objective

Sprint 12 closes the remaining backend/platform risk surfaces after the release-readiness work in Sprint 11. The goal is not to add new user-facing scope, but to make the last long-lived risk items explicit in docs, tests, and the sprint checklist so they do not drift again.

This sprint is about:

- keeping subscription and billing scope backend-owned
- keeping search reindex and rollback deterministic after content changes
- keeping asset access resolved by the backend only
- keeping shared contracts aligned with backend validation rules
- recording the closure state in the sprint checklist and supporting docs

Primary users impacted:

- backend/platform engineers maintaining runtime behavior
- admin operators relying on stable search and content behavior
- end users indirectly, through safer subscription and asset-access handling

Success means the existing MVP flow stays unchanged while the remaining backend/platform risk items are documented as closed and verified by tests.

## Tech Stack

- Monorepo with `apps/api` (NestJS/TypeScript), `apps/admin` (web CMS), `apps/mobile` (Flutter), and `packages/shared`
- PostgreSQL for persistence and invariants
- Elasticsearch-backed search reindex flow
- Existing shared contracts in `packages/shared`
- Existing docs in `docs/` as the source of truth for product and contract behavior

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

Test:

```bash
pnpm.cmd test
```

Targeted API tests:

```bash
pnpm.cmd --dir apps/api test
```

Targeted shared contract checks:

```bash
pnpm.cmd --dir packages/shared typecheck
pnpm.cmd --dir packages/shared test
```

Pre-merge check:

```bash
pnpm.cmd check
```

## Project Structure

- `apps/api/src/modules/subscription/*` - subscription flow, webhook handling, entitlement mapping
- `apps/api/src/modules/search/*` - search query handling, reindex service, alias swap/rollback behavior
- `apps/api/src/http/assets.http.controller.ts` - asset access enforcement at the HTTP boundary
- `packages/shared/src/contracts/*` - shared DTOs, enums, and invariant helpers
- `docs/implementation-sprint-checklist.md` - sprint status and risk closure tracking
- `docs/api-design.md` - API contract rules
- `docs/security.md` - asset and subscription security boundaries

## Code Style

- Keep backend-owned truth in shared helpers or services first, then consume it from controllers.
- Validate at the boundary, keep domain methods small, and prefer explicit failures over implicit fallback behavior.
- Treat backend as the source of truth for billing, entitlement, search reindex, and asset-access decisions.

Example:

```ts
export function assertValidRoleIndex(roleIndex: number): void {
  if (!Number.isInteger(roleIndex) || roleIndex < 1 || roleIndex > 3) {
    throw new BadRequestException('Invalid narrator role index');
  }
}
```

## Testing Strategy

- API unit tests cover billing/verify/webhook rules, search input validation, asset-access resolution, and contract guards.
- Shared contract tests cover DTO shape, enums, and invariant helpers.
- Every rule in scope needs both a success path and a rejection path test.
- The sprint checklist must reflect the closure state that is actually verified in code.

## Boundaries

- Always: keep Sprint 12 limited to backend/platform risk closure; add regression tests with every rule change; update docs when a contract changes; preserve existing MVP behavior.
- Ask first: database schema changes, new dependencies, CI/workflow changes, Elasticsearch mapping changes, or any public DTO shape change that affects more than one app.
- Never: add new product features, widen client-side unlock rules, expose raw storage URLs, weaken validation to make tests pass, or remove failing tests without approval.

## Success Criteria

- Subscription and billing logic remains backend-owned and does not drift outside the approved flow.
- Search reindex remains deterministic after publish/update, with explicit rollback coverage.
- Asset access remains backend-resolved only and never exposes raw storage URLs.
- Shared contracts and backend validation stay aligned with the implemented rules.
- Sprint 12 is reflected in the sprint checklist and docs with a clear done/not-done state for the scoped risk items.

## Open Questions

- None blocking. This sprint is a closure pass for backend/platform risk items rather than new feature work.
