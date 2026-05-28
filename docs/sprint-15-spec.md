# Spec: Sprint 15 - Search and Filter Terminology Consistency

## Assumptions

I am making the following assumptions for Sprint 15:

1. Sprint 15 is still a hardening/polish sprint, not a feature sprint.
2. The scope is limited to search/filter terminology and visible copy on mobile and admin surfaces.
3. No API contract, database schema, or dependency changes are expected.
4. The current mixed English/Vietnamese style should stay intact per surface; the goal is consistency, not a full localization pass.

If any of these assumptions are wrong, the spec should be revised before implementation starts.

## Objective

Sprint 15 removes the remaining terminology drift in search and filter surfaces after Sprint 14. The goal is to make the words users see on mobile discovery and admin management screens feel consistent, predictable, and aligned to the same product vocabulary, without changing search behavior.

This sprint should:

- standardize search and filter labels on the mobile discovery surface
- align content dashboard, taxonomy, and audit filter wording in admin
- keep all search behavior, sorting, filtering, and routing unchanged
- record the final state in docs and the sprint checklist

Primary users impacted:

- mobile users searching for audiobooks
- admin operators filtering content, taxonomy, and audit records
- backend/platform engineers who want UI copy to remain aligned with existing contract-driven behavior

Success means the search and filter experience reads consistently across the product while the underlying functionality stays identical.

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

Targeted mobile tests:

```bash
Set-Location 'apps/mobile'; flutter test test/home_shell_test.dart
```

Targeted admin tests:

```bash
pnpm.cmd --dir apps/admin test
```

Targeted admin view tests:

```bash
pnpm.cmd --dir apps/admin test
```

Pre-merge check:

```bash
pnpm.cmd check
```

## Project Structure

- `apps/mobile/lib/features/home/presentation/home_shell.dart` - mobile discovery search, sort, and filter copy
- `apps/mobile/test/home_shell_test.dart` - widget coverage for search labels and existing flow behavior
- `apps/admin/src/features/content-dashboard/content-dashboard-view.js` - content dashboard search/filter copy
- `apps/admin/src/features/taxonomy/taxonomy-view.js` - taxonomy search copy
- `apps/admin/src/features/audit/audit-view.js` - audit filter copy
- `apps/admin/test/content-dashboard-view.test.js` - dashboard copy regression tests
- `apps/admin/test/taxonomy-view.test.js` - taxonomy copy regression tests
- `apps/admin/test/audit-view.test.js` - audit copy regression tests
- `docs/implementation-sprint-checklist.md` - sprint status and risk tracking
- `docs/` - sprint spec and implementation-plan documents

## Code Style

- Keep copy changes local to the surface that renders them unless a small helper improves readability without widening scope.
- Prefer small, explicit string constants or formatting helpers over clever abstractions.
- Do not change search behavior, query parsing, routing, or analytics event names when only terminology is in scope.

Example:

```dart
String formatSearchHint(String entityLabel) {
  return 'Search $entityLabel';
}
```

## Testing Strategy

- Mobile widget tests should assert the updated labels, hints, and empty states while preserving the existing search flow.
- Admin view tests should assert the updated dashboard, taxonomy, and audit copy without depending on implementation details.
- Tests should focus on rendered strings and preserved behavior, not on how the copy is assembled.
- No API tests or shared-contract tests are expected unless the scope changes.
- Every copy change in scope needs a regression test.

## Boundaries

- Always: keep Sprint 15 limited to search/filter terminology consistency; add regression tests with every copy change; update docs when a label or rule changes; preserve existing search behavior.
- Ask first: database schema changes, new dependencies, CI/workflow changes, API contract changes, localization framework changes, or any change that alters search/filter behavior instead of copy.
- Never: change query semantics, widen backend search contracts, expose new capabilities through labels, remove failing tests without approval, or silently reword unrelated product surfaces.

## Success Criteria

- Mobile discovery search labels read consistently and still drive the same search behavior.
- Admin content dashboard, taxonomy, and audit filter labels use consistent terminology for search and filtering.
- Search/filter terminology changes are covered by regression tests in mobile and admin.
- Sprint 15 is reflected in the sprint checklist and docs with a clear done/not-done state for the scoped work.

## Open Questions

- Should Sprint 15 keep the current mixed English/Vietnamese style per surface, or move toward a more uniform language policy in a later sprint?
- Should the content dashboard, taxonomy, and audit views share a small copy helper later, or stay surface-local for now?
- Should any future terminology cleanup also cover analytics event names, or remain strictly UI copy?
