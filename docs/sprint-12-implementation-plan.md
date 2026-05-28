# Implementation Plan: Sprint 12 - Backend/Platform Risk Closure

## Overview

Sprint 12 is a hardening and closure pass. The backend already carries the intended rules for subscription, search reindex, asset access, and shared contracts, so the work here is to make that state explicit, verify the relevant tests, and update the sprint checklist to reflect closure.

The implementation should proceed from the highest-risk backend boundaries outward:

1. confirm subscription and billing scope stays backend-owned
2. confirm search reindex remains deterministic and rollback-safe
3. confirm asset access stays backend-resolved only
4. confirm shared contract helpers and backend validation remain aligned
5. record the closed state in docs and the sprint checklist

## Architecture Decisions

- Keep subscription entitlement decisions in backend services and shared contract helpers.
- Keep search reindex deterministic through explicit alias management and rollback coverage.
- Keep asset access resolution behind the backend HTTP boundary.
- Keep shared contracts as the source of truth for enums, DTO shapes, and invariant helpers.
- Treat docs and the sprint checklist as the canonical record of risk closure.

## Task List

### Phase 1: Backend risk closure confirmation

- [x] Task 1: Confirm subscription and billing scope is backend-owned
  - Description: verify that billing, receipt verification, and webhook handling stay governed by backend policy and shared entitlement helpers.
  - Acceptance criteria:
    - [x] Subscription verification remains idempotent for the same receipt reference.
    - [x] Webhook processing rejects missing or invalid signatures before mutation.
    - [x] Entitlement resolution continues to come from backend snapshot state, not client inference.
  - Verification:
    - [x] `pnpm.cmd --dir apps/api test`
  - Dependencies: None
  - Files likely touched:
    - `apps/api/src/modules/subscription/subscription.service.ts`
    - `apps/api/src/modules/subscription/subscription.service.test.ts`
    - `packages/shared/src/contracts/subscription.ts`
  - Estimated scope: Small

- [x] Task 2: Confirm search reindex consistency and rollback coverage
  - Description: verify that publish/update reindex flows stay deterministic and preserve rollback behavior.
  - Acceptance criteria:
    - [x] Bulk reindex uses a deterministic published-document order.
    - [x] Single-document reindex deletes stale index entries when content is no longer published.
    - [x] Alias rollback for the last successful bulk swap remains covered by tests.
  - Verification:
    - [x] `pnpm.cmd --dir apps/api test`
  - Dependencies: Task 1
  - Files likely touched:
    - `apps/api/src/modules/search/search.reindex.service.ts`
    - `apps/api/src/modules/search/search.reindex.service.test.ts`
    - `apps/api/src/modules/search/search.index.repository.ts`
  - Estimated scope: Small

- [x] Task 3: Confirm asset access stays backend-resolved only
  - Description: verify that the asset access HTTP boundary continues to resolve premium access server-side and never exposes raw storage URLs.
  - Acceptance criteria:
    - [x] Premium audio access checks entitlement at the backend boundary.
    - [x] Asset access resolution remains provider-backed and time-limited.
    - [x] Asset access tests cover the allowed and forbidden paths.
  - Verification:
    - [x] `pnpm.cmd --dir apps/api test`
  - Dependencies: Task 1
  - Files likely touched:
    - `apps/api/src/http/assets.http.controller.ts`
    - `apps/api/src/modules/assets/asset-access.service.ts`
    - `apps/api/src/modules/assets/asset-access.service.test.ts`
  - Estimated scope: Small

### Phase 2: Shared contract alignment and documentation closure

- [x] Task 4: Confirm shared contracts and backend validation stay aligned
  - Description: verify that the shared subscription and asset contracts still match backend validation rules and invariant helpers.
  - Acceptance criteria:
    - [x] Shared subscription contract tests still pass.
    - [x] Shared asset contract tests still pass.
    - [x] Backend parsers continue to enforce the same contract surface.
  - Verification:
    - [x] `pnpm.cmd --dir packages/shared typecheck`
    - [x] `pnpm.cmd --dir packages/shared test`
  - Dependencies: Tasks 1-3
  - Files likely touched:
    - `packages/shared/src/contracts/subscription.ts`
    - `packages/shared/src/contracts/asset.ts`
    - `apps/api/src/http/request-schema.ts`
  - Estimated scope: Small

- [x] Task 5: Update sprint checklist and docs to reflect closure
  - Description: add the Sprint 12 closure state to the sprint checklist and supporting docs so the risk items are explicitly marked done.
  - Acceptance criteria:
    - [x] Sprint 12 appears in the master sprint checklist.
    - [x] The risk-tracking rows reflect the closed state.
    - [x] The new sprint spec and implementation plan are present in `docs/`.
  - Verification:
    - [x] Manual doc review
  - Dependencies: Tasks 1-4
  - Files likely touched:
    - `docs/implementation-sprint-checklist.md`
    - `docs/sprint-12-spec.md`
    - `docs/sprint-12-implementation-plan.md`
  - Estimated scope: Small

### Checkpoint: After Tasks 1-5

- [x] Backend risk boundaries remain owned by backend services and shared contracts
- [x] Search reindex and rollback behavior remains deterministic
- [x] Asset access remains backend-resolved only
- [x] Sprint checklist records the closed state explicitly

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Documentation drifts away from code state | Medium | Keep the sprint checklist and sprint docs aligned with the actual verified backend behavior. |
| Future changes re-open subscription scope | High | Keep entitlement logic in backend/shared helpers and maintain idempotent verification tests. |
| Search reindex regressions become non-deterministic | High | Keep alias swap and rollback coverage in targeted API tests. |
| Asset access starts leaking raw storage details | High | Keep the HTTP boundary as the only place that resolves access URLs. |

## Open Questions

- None blocking. The sprint is intentionally scoped as backend/platform risk closure rather than new feature work.
