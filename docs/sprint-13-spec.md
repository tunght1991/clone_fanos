# Spec: Sprint 13 - Mobile Scope Freeze and Narrator Rule Closure

## Objective

Sprint 13 closes the remaining product-facing risk surfaces after Sprint 12 by hardening the mobile scope boundary around offline playback and the narrator rule set. The goal is not to add new product capability, but to keep the MVP boundary explicit in backend, mobile, admin, shared contracts, and sprint docs so client behavior does not drift.

This sprint is about:

- keeping offline playback outside the MVP unless explicitly allowed by backend contract
- enforcing narrator role rules consistently across backend, admin, and mobile
- keeping shared content contracts aligned with backend validation
- recording the closure state in the sprint checklist and supporting docs

Primary users impacted:

- mobile users consuming playback and content detail flows
- admin operators editing content and narrator assignments
- backend/platform engineers maintaining content invariants and request validation

Success means the existing MVP flow stays unchanged while offline playback and narrator-structure rules remain enforced by code, shared contracts, and tests.

## Tech Stack

- Monorepo with `apps/api` (NestJS/TypeScript), `apps/admin` (web CMS), `apps/mobile` (Flutter), and `packages/shared`
- PostgreSQL for persistence and invariants
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

Targeted mobile tests:

```bash
Set-Location 'apps/mobile'; flutter test
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

- `apps/api/src/modules/content/*` - content detail, narrator validation, and backend invariants
- `apps/api/src/http/request-schema.ts` - API boundary validation and normalization
- `apps/api/src/db/migration-schema.test.ts` - schema assertions for narrator and content invariants
- `apps/mobile/lib/features/player/*` - playback state, offline boundary handling, and player UI
- `apps/mobile/lib/features/home/*` - content surfacing and player entry points
- `apps/mobile/lib/features/discovery/*` - content discovery and narrator-facing metadata
- `packages/shared/src/contracts/content.ts` - shared content DTOs and narrator role rules
- `packages/shared/src/contracts/asset.ts` - shared asset contract surface for offline-capable flags
- `docs/implementation-sprint-checklist.md` - sprint status and risk closure tracking
- `docs/api-design.md` - API contract rules
- `docs/security.md` - asset, playback, and subscription security boundaries

## Code Style

- Keep invariant checks in shared helpers or backend services first, then consume them from controllers and UI.
- Validate at the boundary, keep domain methods small, and prefer explicit failures over implicit fallback behavior.
- Treat backend and shared contracts as the source of truth for narrator counts, role indices, and playback capability flags.

Example:

```ts
export function assertValidNarratorRoleIndex(roleIndex: number): void {
  if (!Number.isInteger(roleIndex) || roleIndex < 1 || roleIndex > 3) {
    throw new Error(`Invalid narrator role index ${roleIndex}`);
  }
}
```

## Testing Strategy

- API unit tests cover narrator role validation, content invariants, and request parsing.
- Mobile tests cover offline playback gating, player state, and bypass prevention.
- Shared contract tests cover DTO shape, enums, and invariant helpers.
- Every rule in scope needs both a success path and a rejection path test.
- The sprint checklist must reflect the closure state that is actually verified in code.

## Boundaries

- Always: keep Sprint 13 limited to mobile-scope freeze and narrator rule closure; add regression tests with every rule change; update docs when a contract changes; preserve existing MVP behavior.
- Ask first: database schema changes, new dependencies, CI/workflow changes, public DTO shape changes, or any expansion of offline playback capability beyond the current MVP boundary.
- Never: add new product features, widen client-side unlock rules, expose raw storage URLs, let mobile infer narrator or offline capability without backend contract support, or remove failing tests without approval.

## Success Criteria

- Offline playback remains bounded by the current MVP contract and cannot be enabled by client-side assumptions alone.
- Narrator role rules remain enforced across backend, admin, and mobile with the same 1..3 invariant and primary narrator rule.
- Shared contracts and backend validation stay aligned with the implemented content rules.
- Sprint 13 is reflected in the sprint checklist and docs with a clear done/not-done state for the scoped risk items.

## Open Questions

- Should Sprint 13 include any visible mobile UX work for offline indicators, or remain strictly boundary enforcement and contract alignment?
- Is the narrator work limited to role validation and content editing, or should it also include any search/display copy adjustments in mobile/admin?
