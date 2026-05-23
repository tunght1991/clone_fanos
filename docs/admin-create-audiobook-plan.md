# Plan: Admin Create Audiobook With Chapters

Source spec: [admin-create-audiobook-spec.md](./admin-create-audiobook-spec.md)

## Goal

Implement a single-submit admin create flow that persists a new audiobook and its initial chapters atomically in PostgreSQL, then returns the created audiobook DTO for downstream read/publish flows.

Status: implemented in codebase and verified by targeted API/admin tests.

## Major Components

1. Shared contract updates for nested audiobook create payloads
2. Backend request parsing and validation
3. Backend mutation service and repository transaction flow
4. Admin UI form for audiobook + chapter entry
5. Backend and UI tests for success, validation, and rollback behavior

## Implementation Order

1. Update shared DTOs and request schema to describe chapters inside the create payload.
2. Update backend controller/service/repository to persist audiobook + chapters in a single transaction.
3. Update admin CMS form to support nested chapter entry before submit.
4. Add tests for invalid payloads, successful persistence, and rollback on chapter failure.

## Risks

- The create request becomes broader than the current backend contract, so the shared DTO must stay strict and explicit.
- Chapter rollback behavior must be transactional; partial inserts are not acceptable.
- The admin UI can become too large if all chapter editing logic is built inline, so the form should remain componentized.
- Draft vs publish behavior must stay deterministic so the new flow does not accidentally expose unpublished content.

## Verification Checkpoints

- Shared contract tests pass for the new nested create request.
- Backend create-audiobook tests prove audiobook + chapters are inserted together.
- A chapter insert failure rolls back the entire create request.
- Admin form tests cover validation and submit success.
- The created audiobook remains visible through normal backend read APIs after creation.

## Tasks

- [x] Task: Extend shared create-audiobook contract for nested chapters
  - Acceptance: `AdminCreateAudiobookRequestDto` includes chapter input data with strict validation rules and no loose payload fields.
  - Verify: Shared contract/request-schema tests pass.
  - Files: `packages/shared/src/contracts/content.ts`, `apps/api/src/http/request-schema.ts`, `apps/api/src/http/request-schema.test.ts`

- [x] Task: Persist audiobook and chapters in one backend transaction
  - Acceptance: `POST /admin/audiobooks` writes the audiobook and its chapters atomically and returns the created audiobook DTO.
  - Verify: Backend mutation/service/repository tests pass, including rollback on chapter failure.
  - Files: `apps/api/src/http/admin.http.controller.ts`, `apps/api/src/modules/content/content.mutation.service.ts`, `apps/api/src/modules/content/content.repository.ts`, `apps/api/src/modules/content/content.mutation.service.test.ts`

- [x] Task: Add admin UI for creating audiobook with chapters
  - Acceptance: Admin can enter audiobook metadata and a chapter list in one form, submit once, and see validation or success feedback.
  - Verify: Admin UI tests pass for form validation, submit success, and request-in-flight state.
  - Files: `apps/admin/src/features/content-editor/content-editor-view.js`, `apps/admin/src/ui/views.js`, `apps/admin/src/styles.css`, `apps/admin/test/*`

- [x] Task: Wire end-to-end create flow to existing admin navigation
  - Acceptance: The admin CMS exposes a clear path to the new create-audiobook form without breaking current dashboard/editor flows.
  - Verify: Admin smoke checks and targeted UI tests pass.
  - Files: `apps/admin/src/features/content-dashboard/content-dashboard-view.js`, `apps/admin/src/features/content-editor/content-editor-view.js`, `apps/admin/src/ui/views.js`

- [x] Task: Lock regression coverage for read-back and rollback behavior
  - Acceptance: The created audiobook is visible through normal read APIs, and failed create requests do not leave orphaned chapters.
  - Verify: Backend integration tests and smoke tests pass.
  - Files: `apps/api/src/http/backend.smoke.test.ts`, `apps/api/src/modules/content/content.service.test.ts`, `apps/api/src/modules/content/content.controller.test.ts`

## Open Questions

1. Should the UI default new chapters to draft or ready?
2. Should chapter count be unrestricted, or should the form enforce a practical cap for MVP?
3. Should the create flow auto-generate chapter order indexes, or let the admin edit them directly?
4. Should the create form support copying chapters from an existing audiobook template later?
