# Implementation Plan: Sprint 15 - Search and Filter Terminology Consistency

## Overview

Sprint 15 removes the remaining search/filter wording drift across mobile discovery and admin management surfaces. The goal is to make the labels users see feel consistent and intentional while leaving query behavior, routing, and backend contracts unchanged.

The implementation should proceed in this order:

1. normalize mobile discovery search labels and empty-state copy
2. normalize admin dashboard search/filter copy
3. normalize admin taxonomy and audit filter copy
4. record the final state in docs and the sprint checklist

## Architecture Decisions

- Keep terminology changes local to the surfaces that render them; do not introduce backend or shared-contract changes for copy-only work.
- Prefer small string constants or tiny formatting helpers only when they make a single surface easier to reason about.
- Preserve all existing search behavior, sort behavior, routes, and analytics events.
- Keep the sprint checklist and docs as the final record of what terminology was standardized.

## Task List

### Phase 1: Mobile search copy

- [x] Task 1: Normalize mobile discovery search labels and hints
  - Description: update the home/search surface so the search header, hint text, sort/filter labels, and empty-state copy use consistent terminology without changing search behavior.
  - Acceptance criteria:
    - [x] The search header and hint text use the same terminology family.
    - [x] Sort/filter labels remain functionally identical but read consistently.
    - [x] Existing browse/search/detail flow continues to work unchanged.
  - Verification:
    - [x] `Set-Location 'apps/mobile'; flutter test test/home_shell_test.dart`
  - Dependencies: None
  - Files likely touched:
    - `apps/mobile/lib/features/home/presentation/home_shell.dart`
    - `apps/mobile/test/home_shell_test.dart`
  - Estimated scope: Medium

### Phase 2: Admin dashboard search/filter copy

- [x] Task 2: Normalize content dashboard terminology
  - Description: update the admin content dashboard search and filter copy so it matches the same terminology family used elsewhere in the product.
  - Acceptance criteria:
    - [x] The dashboard search placeholder and labels are consistent.
    - [x] Reset/apply/filter wording is clear and stable.
    - [x] Dashboard behavior, pagination, and item navigation remain unchanged.
  - Verification:
    - [x] `pnpm.cmd --dir apps/admin test`
  - Dependencies: Task 1
  - Files likely touched:
    - `apps/admin/src/features/content-dashboard/content-dashboard-view.js`
    - `apps/admin/test/content-dashboard-view.test.js`
  - Estimated scope: Small

- [x] Task 3: Normalize taxonomy and audit filter terminology
  - Description: update the taxonomy search form and audit filter form so their wording matches the dashboard terminology without changing filtering behavior.
  - Acceptance criteria:
    - [x] Taxonomy search copy is consistent with the dashboard search vocabulary.
    - [x] Audit filter copy uses the same search/filter terminology family.
    - [x] Taxonomy and audit behavior remain unchanged.
  - Verification:
    - [x] `pnpm.cmd --dir apps/admin test`
  - Dependencies: Task 2
  - Files likely touched:
    - `apps/admin/src/features/taxonomy/taxonomy-view.js`
    - `apps/admin/src/features/audit/audit-view.js`
    - `apps/admin/test/taxonomy-view.test.js`
    - `apps/admin/test/audit-view.test.js`
  - Estimated scope: Medium

### Checkpoint: After Tasks 1-3

- [x] Mobile search copy is consistent and existing flow still works
- [x] Admin dashboard, taxonomy, and audit terminology are aligned
- [x] Targeted mobile and admin suites are green

### Phase 3: Documentation and release guard

- [x] Task 4: Update docs and sprint checklist to record Sprint 15 closure
  - Description: add Sprint 15 to the sprint checklist and update the supporting docs so the final state of the terminology cleanup is explicit.
  - Acceptance criteria:
    - [x] Sprint 15 appears in the master sprint checklist.
    - [x] The risk rows reflect the Sprint 15 closure state.
    - [x] The Sprint 15 spec and implementation plan are both present in `docs/`.
  - Verification:
    - [x] Manual doc review
  - Dependencies: Tasks 1-3
  - Files likely touched:
    - `docs/implementation-sprint-checklist.md`
    - `docs/sprint-15-spec.md`
    - `docs/sprint-15-implementation-plan.md`
  - Estimated scope: Small

### Checkpoint: Complete

- [x] `Set-Location 'apps/mobile'; flutter test test/home_shell_test.dart` passes
- [x] `pnpm.cmd --dir apps/admin test` passes
- [x] Sprint 15 acceptance criteria are reflected in code, tests, and docs

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Copy drifts between mobile and admin after the sprint | Medium | Keep wording aligned to a single terminology family and cover it with rendered-string tests. |
| Search behavior changes by accident while editing labels | High | Limit the work to presentation text and assert that navigation/query behavior remains unchanged. |
| Admin surfaces diverge because each view owns its own strings | Medium | Standardize wording across dashboard, taxonomy, and audit together in one pass. |
| Scope expands into localization or backend contract work | High | Keep Sprint 15 strictly UI copy and docs unless a contract gap is explicitly approved. |

## Open Questions

- Should the product keep the current mixed English/Vietnamese style per surface, or should a later sprint standardize language more aggressively?
- Should the dashboard, taxonomy, and audit strings stay surface-local, or should they later be extracted into a small shared copy module?
- Should analytics event names be included in a future terminology cleanup, or remain outside this sprint?
