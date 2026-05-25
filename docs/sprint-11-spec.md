# Spec: Sprint 11 - Release Readiness and Contract Consistency

## Objective
Sprint 11 focuses on making the platform release-ready after the hardening work in Sprint 10. The goal is not to add new feature scope, but to eliminate remaining trust-boundary leaks and keep the cross-app contract surface deterministic.

This sprint is about:

- removing fallback identity paths from production request handling
- keeping subscription, asset access, and search validation strict
- revalidating restored mobile sessions before they become authenticated
- preventing unpublished chapters from being surfaced as playable
- keeping shared DTOs, database constraints, and UI behavior aligned
- making CI and root validation catch regressions across API, admin, mobile, and shared packages

Primary users impacted:

- end users using the mobile app
- admins managing content
- backend/platform engineers maintaining runtime behavior and deployment confidence

Success means the existing MVP flow remains stable while the remaining auth, entitlement, contract, and test/CI gaps become enforced by code and tests.

## Tech Stack

- Monorepo with `apps/api` (NestJS/TypeScript), `apps/mobile` (Flutter), `apps/admin` (web CMS), and `packages/shared`
- PostgreSQL for persistence and schema constraints
- Existing contract-first DTOs in `packages/shared`
- Existing docs in `docs/` as the source of truth for product and contract behavior
- pnpm workspace scripts for repo-level validation

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

Targeted admin tests:

```bash
pnpm.cmd --dir apps/admin test
```

Targeted mobile tests:

```bash
Set-Location 'apps/mobile'; flutter test
```

Pre-merge check:

```bash
pnpm.cmd check
```

## Project Structure

- `apps/api/src/http` - request/response boundary, auth, validation, and HTTP wiring
- `apps/api/src/modules/*` - business logic, repositories, and domain services
- `apps/admin/src/features/*` - admin UI flows, repository adapters, and editor state
- `apps/mobile/lib/features/*` - mobile state, screens, repositories, and player logic
- `packages/shared/src/contracts/*` - cross-app DTOs, enums, and shared validation rules
- `infra/migrations/*` - schema and migration source of truth
- `docs/*` - sprint docs, architecture notes, and contract references

## Code Style

- Validate at the edge, keep domain methods small, and prefer explicit result types over implicit side effects.
- Contract changes live in shared DTOs first, then propagate into backend, mobile, and admin.
- Keep guard logic easy to read and easy to test.

Example:

```ts
if (!principal?.userId) {
  throw new UnauthorizedException('Bearer token required');
}

if (!isUuid(filter.authorId)) {
  throw new BadRequestException('Invalid authorId');
}
```

## Testing Strategy

- API unit tests cover auth boundaries, webhook verification, search validation, entitlement checks, and repository assumptions.
- Admin tests cover editor fallback behavior, publish gating, and contract-dependent rendering.
- Mobile tests cover session bootstrap revalidation, playable chapter filtering, and player repository contract handling.
- Shared contract tests cover DTO shape changes and migration/schema expectations.
- CI must fail on regression in any of the above; targeted tests run first, full suites run before merge.

Minimum coverage expectations:

- Every new trust-boundary rule has at least one success case and one rejection case.
- Every schema constraint added in the sprint has a migration/schema assertion.
- Every mobile gating change has a widget or unit test that proves the bypass path is blocked.

## Boundaries

- Always: add regression tests with every boundary fix; keep behavior changes documented in the spec before implementation; follow `DESIGN.md` for any UI touched.
- Always: prefer backend-owned truth for subscription, entitlement, and publication state; keep mobile and admin as consumers of that truth.
- Ask first: database schema changes, CI/workflow changes, new dependencies, or any public DTO/contract shape change that affects more than one app.
- Never: reintroduce fallback identity paths in production, weaken validation to make tests pass, commit generated artifacts or secrets, or remove failing tests without explicit approval.

## Success Criteria

- Production routes no longer accept impersonation via fallback identity paths.
- Subscription, asset access, and search inputs reject malformed or unsafe requests before reaching storage or query execution.
- Persisted mobile sessions are revalidated before the app enters an authenticated state.
- Unpublished chapters cannot be selected or played from any mobile path.
- Shared DTOs and database constraints prevent silent drift between code and schema.
- CI and test commands catch regressions in API, admin, mobile, and shared before merge.
- The release checklist can be executed without manual verification of the hardened flows.

## Open Questions

- None blocking. This sprint assumes release-readiness hardening rather than new feature scope.
