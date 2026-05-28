# Implementation Plan: Sprint 13 - Mobile Scope Freeze and Narrator Rule Closure

## Overview

Sprint 13 is a closure sprint for the remaining product-facing risk surfaces after Sprint 12. The goal is not to introduce new capability, but to freeze the MVP boundary around offline playback and narrator rules so backend, shared contracts, admin, and mobile all keep the same behavior.

The implementation should proceed from the highest-risk contract surfaces outward:

1. lock offline playback capability to the current MVP contract
2. enforce narrator role rules consistently in backend and shared helpers
3. propagate the contract to mobile and admin consumers
4. record the closed state in docs and the sprint checklist

## Architecture Decisions

- Keep offline-capability decisions backend-owned and represented as an explicit contract flag, not inferred by client code.
- Keep narrator role index and primary-narrator rules in shared helpers and backend validation first, then consume them from admin and mobile.
- Keep UI changes conservative: reflect backend truth, but do not widen feature scope or add a new offline playback mode.
- Treat docs and the sprint checklist as the canonical record of risk closure.

## Task List

### Phase 1: Backend and shared-contract freeze

- [x] Task 1: Lock offline playback to the current MVP contract
  - Description: verify that the backend continues to normalize offline capability to `false` for the current asset-access flow, and keep the shared asset contract aligned with that boundary.
  - Acceptance criteria:
    - [ ] The API boundary still normalizes inbound asset-access requests so offline capability cannot be enabled by client payloads.
    - [ ] The shared asset contract still exposes the offline-capable flag with the same meaning used by the backend.
    - [ ] API tests cover the allowed stream path and the rejected/normalized offline path.
  - Verification:
    - [ ] `pnpm.cmd --dir apps/api test`
    - [ ] `pnpm.cmd --dir packages/shared test`
  - Dependencies: None
  - Files likely touched:
    - `apps/api/src/http/request-schema.ts`
    - `apps/api/src/http/request-schema.test.ts`
    - `packages/shared/src/contracts/asset.ts`
    - `packages/shared/src/contracts/asset.test.ts`
  - Estimated scope: Small

- [x] Task 2: Enforce narrator role rules in backend content validation
  - Description: verify that narrator role index, primary narrator, and content-detail validation remain enforced by the backend and shared contract helpers.
  - Acceptance criteria:
    - [ ] Content detail and admin content flows still reject narrator roles outside the supported 1..3 range.
    - [ ] The migration/schema assertions still protect the narrator invariants.
    - [ ] Shared content contract tests continue to express the narrator-role boundary.
  - Verification:
    - [ ] `pnpm.cmd --dir apps/api test`
    - [ ] `pnpm.cmd --dir packages/shared test`
  - Dependencies: None
  - Files likely touched:
    - `apps/api/src/modules/content/content.service.ts`
    - `apps/api/src/modules/content/admin-content.service.ts`
    - `apps/api/src/db/migration-schema.test.ts`
    - `packages/shared/src/contracts/content.ts`
  - Estimated scope: Small

### Checkpoint: After Tasks 1-2

- [x] Offline playback remains normalized to the current MVP boundary
- [x] Narrator role validation remains backend-owned and shared-contract aligned
- [x] Shared contract and API tests are green for the frozen boundaries

### Phase 2: Consumer alignment

- [x] Task 3: Align mobile playback behavior with the offline boundary
  - Description: update the mobile player and repository flow so the UI reflects backend-provided asset access without inferring a new offline mode.
  - Acceptance criteria:
    - [ ] The mobile player continues to treat offline capability as unavailable unless backend contract explicitly allows it.
    - [ ] Player UI and state logic do not surface offline-ready behavior beyond the current MVP boundary.
    - [ ] Mobile tests cover the allowed streaming path and the blocked offline-ready path.
  - Verification:
    - [ ] `Set-Location 'apps/mobile'; flutter test`
  - Dependencies: Task 1
  - Files likely touched:
    - `apps/mobile/lib/features/player/data/http_player_repository.dart`
    - `apps/mobile/lib/features/player/presentation/player_screen.dart`
    - `apps/mobile/lib/features/player/domain/player_models.dart`
    - `apps/mobile/test/http_player_repository_test.dart`
    - `apps/mobile/test/player_screen_test.dart`
  - Estimated scope: Medium

- [x] Task 4: Constrain admin narrator editing to the validated narrator model
  - Description: keep the admin content editor aligned with the backend narrator rules so editors cannot create invalid narrator combinations.
  - Acceptance criteria:
    - [ ] The editor UI remains limited to the supported narrator slot structure.
    - [ ] Validation errors are shown when narrator assignments violate the contract.
    - [ ] Admin tests cover valid narrator selection and invalid narrator enforcement.
  - Verification:
    - [ ] `pnpm.cmd --dir apps/admin test`
  - Dependencies: Task 2
  - Files likely touched:
    - `apps/admin/src/features/content-editor/content-editor-data.js`
    - `apps/admin/src/features/content-editor/content-editor-view.js`
    - `apps/admin/src/features/content-editor/content-editor-repository.js`
    - `apps/admin/test/content-editor-repository.test.js`
  - Estimated scope: Medium

### Checkpoint: After Tasks 3-4

- [x] Mobile player behavior matches the backend offline boundary
- [x] Admin narrator editing cannot drift outside the validated 1..3 role model
- [x] Targeted mobile and admin suites remain green

### Phase 3: Documentation and release guard

- [x] Task 5: Update docs and sprint checklist to record Sprint 13 closure
  - Description: add the Sprint 13 status to the sprint checklist and supporting docs so the remaining risk items are explicitly tracked as closed or open.
  - Acceptance criteria:
    - [x] Sprint 13 appears in the master sprint checklist.
    - [x] The open risk rows reflect the Sprint 13 closure state.
    - [x] The Sprint 13 spec and implementation plan are present in `docs/`.
  - Verification:
    - [x] Manual doc review
  - Dependencies: Tasks 1-4
  - Files likely touched:
    - `docs/implementation-sprint-checklist.md`
    - `docs/sprint-13-spec.md`
    - `docs/sprint-13-implementation-plan.md`
  - Estimated scope: Small

### Checkpoint: Complete

- [x] `pnpm.cmd --dir apps/api test` passes
- [x] `pnpm.cmd --dir packages/shared test` passes
- [x] `pnpm.cmd --dir apps/admin test` passes
- [x] `Set-Location 'apps/mobile'; flutter test` passes
- [x] Sprint 13 acceptance criteria are reflected in code, tests, and docs

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Offline playback scope expands through client-side inference | High | Keep the backend as the only source of truth for offline-capable flags and cover the normalized false path with tests. |
| Narrator validation diverges between backend, admin, and mobile | High | Keep role-index invariants in shared/backend helpers first, then update consumer tests to match the same contract. |
| Admin editor changes become too permissive | Medium | Keep editor slots constrained to the validated narrator model and verify invalid combinations are rejected. |
| Mobile UI starts implying an offline feature that is not in scope | Medium | Treat offline-ready UI as a backend-controlled state, not as a local capability. |

## Open Questions

- Should Sprint 13 include any visible offline indicators in the mobile UI, or should it remain a pure contract freeze?
- Should narrator changes be limited to validation and slot enforcement, or should copy/search labels also be updated across admin and mobile?
