# Spec: Sprint 14 - Offline UX Signals and Narrator Copy Consistency

## Assumptions

I am making the following assumptions for Sprint 14:

1. Sprint 14 follows Sprint 13 and should stay in the hardening/polish lane, not add new product capability.
2. Backend-owned contracts remain the source of truth for offline access and narrator rules.
3. Any change in this sprint should only expose state that already exists in backend/shared contracts.
4. No database schema changes or new dependencies are expected.

If any of these assumptions are wrong, the spec should be revised before implementation starts.

## Objective

Sprint 14 is a product-surface consistency sprint. The goal is to remove the remaining ambiguity around offline playback and narrator labeling without widening the MVP feature set.

This sprint should make the user-facing state easier to understand while preserving the backend-owned boundaries established in earlier sprints:

- show offline-related state only when it is already provided by backend contract or existing shared model
- keep narrator labels, slot naming, and search/display copy aligned across mobile and admin
- avoid introducing any new offline playback mode or narrator capability
- keep the docs and checklist aligned with the implemented behavior

Primary users impacted:

- mobile users who need clear playback state
- admin operators editing content and narrator assignments
- backend/platform engineers maintaining shared contract consistency

Success means the UI becomes clearer without changing the underlying capability model.

## Tech Stack

- Monorepo with `apps/api` (NestJS/TypeScript), `apps/admin` (web CMS), `apps/mobile` (Flutter), and `packages/shared`
- PostgreSQL for persistence and invariants
- Existing shared contracts in `packages/shared`
- Existing docs in `docs/` as the source of truth for sprint status and product rules

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

Targeted admin tests:

```bash
pnpm.cmd --dir apps/admin test
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

- `apps/mobile/lib/features/player/*` - playback UI, offline-related state, and state labels
- `apps/mobile/lib/features/discovery/*` - content metadata and copy surfaced in browse/detail flows
- `apps/mobile/test/*` - widget and repository tests for player UX and metadata display
- `apps/admin/src/features/content-editor/*` - narrator editing UI and content labels
- `apps/admin/test/*` - editor validation and label behavior tests
- `apps/api/src/modules/content/*` - backend validation that feeds the shared narrator model
- `packages/shared/src/contracts/content.ts` - shared narrator rules and invariant helpers
- `packages/shared/src/contracts/asset.ts` - shared asset access boundary for offline-capable flags
- `docs/implementation-sprint-checklist.md` - sprint status and risk tracking
- `docs/` - sprint spec and implementation-plan documents

## Code Style

- Keep the backend/shared contract as the source of truth; UI should only render or mirror states that are already available.
- Validate at the boundary, keep helper functions small, and avoid duplicating the same invariant in multiple clients.
- Prefer explicit state names in the UI over inferred behavior.

Example:

```ts
export function formatOfflineAccessLabel(offlineCapable: boolean): string {
  return offlineCapable ? 'Available offline' : 'Streaming only';
}
```

## Testing Strategy

- Mobile widget tests should cover the visible playback state, including the absence of implied offline capability when the contract says streaming-only.
- Admin tests should cover narrator label rendering and validation behavior for the supported slot model.
- Shared contract tests should continue to verify narrator and asset invariant helpers if any contract surface changes.
- API tests should be updated only if the sprint needs a new normalization rule or contract guard.
- Every rule in scope needs both a success path and a rejection path test.

## Boundaries

- Always: keep Sprint 14 limited to offline UX signals and narrator copy consistency; add regression tests with every behavior change; update docs when a contract or rule changes; preserve existing MVP behavior.
- Ask first: database schema changes, new dependencies, CI/workflow changes, public DTO shape changes, or any expansion of offline playback capability beyond the current MVP boundary.
- Never: add new product features, widen client-side unlock rules, expose raw storage URLs, let mobile infer capability without backend/shared contract support, or remove failing tests without approval.

## Success Criteria

- Offline-related UI messaging is explicit and consistent, but capability remains backend-owned and unchanged.
- Narrator labels, slot naming, and any related copy are consistent across mobile and admin.
- Shared contracts and backend validation remain aligned with the implemented rules.
- Sprint 14 is reflected in the sprint checklist and docs with a clear done/not-done state for the scoped work.

## Open Questions

- Should Sprint 14 include any new visible offline indicator in mobile, or only refine the existing state text and placement?
- Should narrator work stop at copy/label consistency, or also update search/filter labels in admin and mobile?
- Should any of the Sprint 14 changes require an API contract update, or can they remain UI-only and shared-contract-only?
