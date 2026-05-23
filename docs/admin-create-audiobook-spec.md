# Spec: Admin Create Audiobook -> Persist to Database

## Objective

Add a content-creation flow in the admin CMS that lets an authorized admin create a new audiobook record and its initial chapters in a single submit, then persist the whole bundle to the database safely.

### What this feature must solve

- Admin can create a new audiobook from the CMS.
- The created audiobook is stored in the database, not only in UI state or memory.
- The created audiobook and its initial chapters are written atomically or with an equivalent all-or-nothing guarantee.
- The created record becomes available to backend read APIs and, after publish/index sync, to the user app.
- The flow validates required fields before saving and returns a stable record ID on success.

### Primary user story

- As an admin, I want to create a new audiobook and save it to the database so that the content library can be managed centrally.

## Assumptions

1. The admin CMS already authenticates the user and enforces admin-only access.
2. The backend is the source of truth for audiobook persistence.
3. PostgreSQL is the persistence layer for audiobook data.
4. The admin UI is a web app that talks to the backend through REST endpoints.
5. The audiobook create flow will cover metadata plus required or optional initial chapters in one transaction or a safe equivalent.
6. Uploading actual audio files is out of scope for this spec; the feature stores metadata and asset keys/URLs only.

## Tech Stack

- Backend: NestJS
- Database: PostgreSQL
- Admin UI: Node-based web admin app
- API style: REST
- Validation: backend DTO validation at the boundary

## Commands

Build:

```bash
pnpm build
```

Test:

```bash
pnpm test
```

Targeted backend test:

```bash
pnpm api:test
```

Targeted admin test:

```bash
pnpm --dir apps/admin test
```

Dev:

```bash
pnpm dev
```

If database migrations are needed:

```bash
pnpm api:migrate
```

## Project Structure

```text
apps/api/                  -> Backend HTTP API, services, repositories, DTOs
apps/admin/                -> Admin CMS UI
infra/migrations/          -> Database schema migrations
packages/shared/           -> Shared contracts and DTO shapes
docs/                      -> Spec and API documentation
```

### Expected backend flow

```text
Admin UI form
  -> POST /admin/audiobooks
  -> service validation + transaction
  -> insert audiobook row
  -> insert chapter rows in the same submit
  -> return created audiobook DTO
```

## Code Style

Keep the create flow thin at the controller layer and move business rules into a service.

```ts
@Post('/admin/audiobooks')
async createAudiobook(@Body() dto: CreateAudiobookDto) {
  return this.contentService.createAudiobook(dto);
}

async createAudiobook(dto: CreateAudiobookDto) {
  await this.validator.assertValid(dto);

  return this.db.transaction(async (tx) => {
    const audiobook = await tx.audiobooks.create({
      data: mapAudiobook(dto),
    });

    await tx.chapters.createMany({
      data: dto.chapters.map((chapter, index) => mapChapter(chapter, audiobook.id, index)),
    });

    return audiobook;
  });
}
```

### Style rules

- Keep request validation at the boundary.
- Use transactions when parent and child records must stay consistent.
- Return canonical DTOs from the backend, not raw ORM objects.
- Prefer explicit field names over implicit mapping magic.
- Keep UI components dumb: submit form data, show validation, display success/error states.

## Testing Strategy

### Backend tests

- Service unit tests for:
  - required-field validation
  - successful create flow
  - chapter ordering persistence
  - duplicate slug/title conflict handling if applicable
  - rollback behavior when chapter insert fails
  - reject invalid chapter payloads before any database write
- Integration tests for:
  - `POST /admin/audiobooks` returns the created audiobook
  - database row is actually persisted
  - chapter rows are persisted in the right order
  - a failure in any chapter write rolls back the full create request

### Admin UI tests

- Form validation tests
- Submit success path
- Error banner path
- Disabled submit while request is in flight

### Data integrity checks

- A created audiobook must be visible in `GET /audiobooks/:id`
- A created audiobook must not appear in public browse/search unless published, if the product keeps draft content hidden
- A failed create request must not leave an audiobook without its intended initial chapters.

## Boundaries

- Always:
  - validate all required audiobook fields before saving
  - persist the audiobook in the database
  - persist chapter order deterministically
  - return a stable ID on success
  - write tests for success and failure paths
- Ask first:
  - changing the database schema
  - adding new storage tables for drafts/assets
  - adding file upload support for audio
  - changing publish/index behavior
- Never:
  - save audiobook data only in client state
  - bypass backend validation
  - write partial records without a transaction or compensating rollback
  - expose raw storage credentials or direct internal DB details to the admin UI

## Success Criteria

- Admin can open a create-audiobook form and submit it successfully.
- Backend stores the audiobook in PostgreSQL.
- The response includes the new audiobook ID and persisted metadata.
- Chapters, if included, are stored with the correct parent audiobook reference and order.
- Failed validation blocks the save and shows field-level feedback.
- Failed persistence does not leave orphaned chapter rows or half-written records.
- The created audiobook is retrievable through the normal backend read flow.

## Open Questions

1. Should create support drafts only, or should it create and publish in one step?
2. Should slug/SEO identifier be auto-generated, required, or omitted entirely for MVP?
3. Are asset keys sufficient for MVP, or do we need a metadata field for the eventual upload pipeline?
4. Should the admin UI allow create from scratch only, or clone from an existing audiobook template?
