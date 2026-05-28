# Implementation Plan: Sprint 14 - Offline UX Signals and Narrator Copy Consistency

## Overview

Sprint 14 is a product-surface consistency sprint after Sprint 13. The goal is to remove remaining ambiguity in offline-related UI messaging and narrator copy without widening the MVP capability model.

The implementation should move in this order:

1. tighten mobile-facing offline state copy so it reflects existing contract state only
2. align admin narrator labels and related copy with the validated 1..3 slot model
3. record the closed state in docs and the sprint checklist

## Architecture Decisions

- Keep backend-owned capability decisions unchanged; UI should only format or surface state that already exists.
- Prefer small presentation helpers or local view-model formatting over new API fields or DB changes.
- Keep offline messaging explicit but conservative: do not imply a new capability, only a clearer description of the current state.
- Keep narrator slot naming and related labels consistent across admin and mobile so copy does not drift.
- Treat docs and the sprint checklist as the final release record for the sprint.

## Task List

### Phase 1: Mobile offline messaging

- [x] Task 1: Normalize mobile offline state text and placement
  - Description: update the mobile player and any adjacent content surfaces so offline-related messaging is explicit, consistent, and based only on the existing backend/shared contract state.
  - Acceptance criteria:
    - [x] Mobile surfaces render streaming-only vs available-offline wording only from existing access state.
    - [x] No new offline-ready mode or unlock path is introduced.
    - [x] Existing player/detail flows remain functional and visually consistent.
  - Verification:
    - [x] `Set-Location 'apps/mobile'; flutter test`
  - Dependencies: None
  - Files likely touched:
    - `apps/mobile/lib/features/player/presentation/player_screen.dart`
    - `apps/mobile/lib/features/discovery/*`
    - `apps/mobile/test/player_screen_test.dart`
    - `apps/mobile/test/app_flow_test.dart`
  - Estimated scope: Medium

- [x] Task 2: Add mobile regression tests for offline messaging
  - Description: cover the explicit offline/streaming messaging path and the blocked offline-ready path so the UI cannot drift back toward implying a capability that does not exist.
  - Acceptance criteria:
    - [x] Tests cover the streaming-only path.
    - [x] Tests assert the offline-ready wording does not appear when the contract does not allow it.
    - [x] Tests still pass for premium unlock and existing playback navigation.
  - Verification:
    - [x] `Set-Location 'apps/mobile'; flutter test`
  - Dependencies: Task 1
  - Files likely touched:
    - `apps/mobile/test/player_screen_test.dart`
    - `apps/mobile/test/mock_player_repository_test.dart`
    - `apps/mobile/test/app_flow_test.dart`
  - Estimated scope: Small

### Checkpoint: After Tasks 1-2

- [x] Mobile offline-related messaging is explicit and consistent
- [x] No offline capability expansion has been introduced
- [x] Targeted mobile tests are green

### Phase 2: Admin narrator copy consistency

- [x] Task 3: Align admin narrator labels and error copy with the validated slot model
  - Description: update the admin content editor labels and validation messaging so narrator slot naming stays aligned with the supported 1..3 role model and the copy used by mobile/shared surfaces.
  - Acceptance criteria:
    - [x] The editor uses consistent wording for the three narrator slots.
    - [x] Validation copy clearly rejects invalid narrator assignments.
    - [x] Any surfaced search/filter labels remain aligned with the same slot terminology.
  - Verification:
    - [x] `pnpm.cmd --dir apps/admin test`
  - Dependencies: Task 2
  - Files likely touched:
    - `apps/admin/src/features/content-editor/content-editor-data.js`
    - `apps/admin/src/features/content-editor/content-editor-view.js`
    - `apps/admin/test/content-editor-data.test.js`
  - Estimated scope: Medium

- [x] Task 4: Add admin regression tests for narrator label behavior
  - Description: lock the narrator copy and slot behavior so invalid role indices and inconsistent labels cannot reappear in the admin editor.
  - Acceptance criteria:
    - [x] Tests cover valid narrator slot labeling.
    - [x] Tests cover invalid narrator role index rejection.
    - [x] Tests cover any copy changes made in the admin editor surface.
  - Verification:
    - [x] `pnpm.cmd --dir apps/admin test`
  - Dependencies: Task 3
  - Files likely touched:
    - `apps/admin/test/content-editor-data.test.js`
    - `apps/admin/test/content-editor-repository.test.js`
  - Estimated scope: Small

### Checkpoint: After Tasks 3-4

- [x] Admin narrator copy stays aligned with the validated slot model
- [x] Invalid narrator combinations are still rejected
- [x] Targeted admin tests are green

### Phase 3: Documentation and release guard

- [x] Task 5: Update docs and sprint checklist to record Sprint 14 closure
  - Description: add Sprint 14 to the sprint checklist and update the supporting docs so the final state of the scoped UI consistency work is explicit.
  - Acceptance criteria:
    - [x] Sprint 14 appears in the master sprint checklist.
    - [x] The risk rows reflect the Sprint 14 closure state.
    - [x] The Sprint 14 spec and implementation plan are both present in `docs/`.
  - Verification:
    - [x] Manual doc review
  - Dependencies: Tasks 1-4
  - Files likely touched:
    - `docs/implementation-sprint-checklist.md`
    - `docs/sprint-14-spec.md`
    - `docs/sprint-14-implementation-plan.md`
  - Estimated scope: Small

### Checkpoint: Complete

- [x] `Set-Location 'apps/mobile'; flutter test` passes
- [x] `pnpm.cmd --dir apps/admin test` passes
- [x] Sprint 14 acceptance criteria are reflected in code, tests, and docs

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| UI copy drifts between mobile and admin | Medium | Keep wording aligned with the same underlying slot and capability model, and cover it with tests. |
| Offline messaging starts implying a new capability | High | Render only backend/shared contract state and avoid introducing any new unlock path. |
| Scope expands into API or DB changes | High | Keep this sprint limited to UI copy, presentation helpers, and docs unless a contract gap is discovered and approved. |
| Narrator terminology becomes inconsistent in different surfaces | Medium | Use the same slot naming in admin and mobile-facing copy, and keep regression tests close to the edited views. |

## Open Questions

- Should Sprint 14 include a visible offline indicator in mobile, or only refine the existing state text and placement?
- Should narrator work stop at copy and label consistency, or also update search/filter labels in admin and mobile?
- Should any Sprint 14 change require an API contract update, or can it stay UI-only and shared-contract-only?
