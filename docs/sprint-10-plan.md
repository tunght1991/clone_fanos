# Implementation Plan: Sprint 10 - Risk Hardening and Scope Control

## Overview
Sprint 10 is a hardening sprint. It does not add new product scope. The goal is to lock five remaining risk areas at the code and contract level:

- subscription entitlement behavior
- search/reindex consistency
- asset access consistency
- narrator role constraints
- mobile gating consistency

Offline playback is a non-goal for this sprint.

## Architecture Decisions

- Backend is the source of truth for entitlement, asset access, narrator rules, and search/reindex behavior.
- Mobile only consumes backend contracts and must not create alternate business rules.
- Elasticsearch mapping may change only if needed to preserve deterministic search/reindex behavior.
- Offline playback must not expand beyond the current MVP boundary.

## Task List

### Phase 1: Foundation and contract lock

#### Task 1: Lock shared contracts and validation rules

**Description:** Align shared DTOs, enums, and validation rules so backend and mobile use the same contract for entitlement, asset access, narrator role index, and related event shapes.

**Subtasks:**
- Review `packages/shared` for the contracts involved in Sprint 10.
- Tighten narrator role validation to `1..3`.
- Make the asset access contract explicitly backend-resolved.
- Update docs where contract rules are clarified.
- Record offline playback as a non-goal.

**Acceptance criteria:**
- Shared contract is unambiguous for backend and mobile.
- Narrator validation is explicit and reusable.
- Offline playback is documented as a non-goal.

**Verification:**
- Targeted typecheck or contract tests for `packages/shared`.
- Manual review of updated docs.

**Dependencies:** None

**Files likely touched:**
- `packages/shared/src/contracts/*`
- `docs/api-design.md`
- `docs/data-model.md`
- `docs/security.md`
- `docs/sprint-10-spec.md`

**Estimated scope:** M

---

### Phase 2: Backend hardening

#### Task 2: Harden subscription entitlement flow in backend

**Description:** Ensure verify/entitlement paths cannot be bypassed and that subscription state remains server authoritative.

**Subtasks:**
- Review checkout, verify, and `/subscriptions/me`.
- Enforce server-side entitlement checks.
- Cover pending, failed, replay, and happy path with regression tests.
- Keep mobile as a consumer of backend state only.

**Acceptance criteria:**
- No client bypass can unlock premium.
- Pending/failed/replay behavior is consistent.
- Happy path remains intact.

**Verification:**
- `pnpm --dir apps/api test`
- Targeted subscription tests

**Dependencies:** Task 1

**Files likely touched:**
- `apps/api/src/modules/subscription/*`
- `apps/api/test/*`

**Estimated scope:** M

---

#### Task 3: Harden search reindex and mapping behavior

**Description:** Make publish/update-driven search reindex deterministic and safe, with minimal mapping changes only if required.

**Subtasks:**
- Review content mutation trigger points.
- Confirm mapping changes are truly necessary before editing them.
- Add regression tests for publish/update/reindex.
- Make rollback/failure behavior explicit.

**Acceptance criteria:**
- Publish/update content triggers deterministic reindex.
- Search reflects updated content correctly.
- Mapping changes, if any, are minimal and tested.

**Verification:**
- `pnpm --dir apps/api test`
- Targeted search/reindex tests

**Dependencies:** Task 1

**Files likely touched:**
- `apps/api/src/modules/search/*`
- `apps/api/src/modules/content/*`
- related tests and mapping/config files

**Estimated scope:** M/L

---

### Checkpoint: After Tasks 1-3

- [ ] Shared contracts are locked.
- [ ] Subscription entitlement has no obvious bypass.
- [ ] Search/reindex regression coverage exists.
- [ ] Docs are in sync with contract changes.
- [ ] Review with human before moving to mobile/backend constraints.

---

### Phase 3: Backend constraints and mobile alignment

#### Task 4: Enforce asset access and narrator constraints in backend

**Description:** Ensure asset access is backend-resolved only and narrator role indices are constrained at the backend boundary.

**Subtasks:**
- Review asset access service and API response shape.
- Confirm no raw storage URL leaks through the API.
- Enforce narrator role index in `1..3` at validation and persistence boundaries.
- Add tests for both constraints.

**Acceptance criteria:**
- Asset access is backend-resolved only.
- Raw storage URL is not exposed.
- Narrator role index is enforced server-side.

**Verification:**
- `pnpm --dir apps/api test`
- Targeted asset/narrator tests

**Dependencies:** Task 1

**Files likely touched:**
- `apps/api/src/modules/assets/*`
- `apps/api/src/modules/content/*`
- narrator-related validation/tests

**Estimated scope:** M

---

#### Task 5: Align mobile gating and asset consumption with backend rules

**Description:** Make mobile consume backend entitlement and asset access contracts without expanding offline playback scope.

**Subtasks:**
- Review gating and playback-related flows.
- Ensure mobile does not introduce its own unlock rules.
- Keep offline playback bounded to current MVP behavior.
- Align mobile asset handling with backend responses.

**Acceptance criteria:**
- Mobile uses backend entitlement and asset access as source of truth.
- No new offline playback capability is introduced.
- Gating behavior matches backend contract.

**Verification:**
- `pnpm --dir apps/mobile test`
- Targeted mobile gating/asset tests

**Dependencies:** Tasks 1, 2, 4

**Files likely touched:**
- `apps/mobile/lib/*`
- related mobile tests

**Estimated scope:** M

---

### Checkpoint: After Tasks 4-5

- [ ] Asset access backend/mobile behavior is aligned.
- [ ] Narrator constraint is enforced in backend.
- [ ] Mobile has not expanded offline playback scope.
- [ ] Gating matches backend entitlement behavior.
- [ ] Review with human before docs synchronization.

---

### Phase 4: Docs synchronization and final validation

#### Task 6: Synchronize docs and sprint checklist with implemented rules

**Description:** Update the architecture, security, data model, and sprint checklist docs so they match the final implemented behavior.

**Subtasks:**
- Update API design docs if contract changes landed.
- Update security docs if any boundary changed.
- Update data model docs if narrator or asset rules changed.
- Update sprint checklist status for Sprint 10.
- Keep the spec file aligned with final decisions.

**Acceptance criteria:**
- Docs match runtime behavior.
- Sprint checklist reflects actual status.
- No ambiguous or stale rule text remains.

**Verification:**
- Manual review against implementation and checklist entries.

**Dependencies:** Tasks 1-5

**Files likely touched:**
- `docs/api-design.md`
- `docs/security.md`
- `docs/data-model.md`
- `docs/implementation-sprint-checklist.md`
- `docs/sprint-10-spec.md`

**Estimated scope:** S/M

---

### Checkpoint: Complete

- [ ] Subscription, search, asset access, narrator constraints, and mobile gating all have regression coverage.
- [ ] Offline playback remains a non-goal.
- [ ] Docs and checklist are synchronized with implementation.
- [ ] Ready for review.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Subscription rules diverge between backend and mobile | High | Keep backend authoritative and make mobile contract-driven |
| Elasticsearch mapping changes cause unexpected search regressions | High | Keep mapping changes minimal and test them directly |
| Asset access leaks raw storage URLs | High | Review response shapes and test boundary behavior |
| Narrator constraints are encoded inconsistently | Med | Validate at backend boundary and share rule definitions |
| Offline playback scope expands | Med | Treat offline playback as a non-goal and reject expansion |

## Open Questions

- If implementation reveals the need for a migration, should it be split into its own task?
- Should the implementation order prioritize subscription and asset access first, or search and narrator constraints first?
