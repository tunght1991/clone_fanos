# Clone Fonos

Mobile-first audiobook and audio learning platform positioned as:

> Spotify for Knowledge Workers

## Repository Structure

- `apps/mobile`: Flutter app for end users
- `apps/admin`: CMS web app for content admins
- `apps/api`: NestJS/TypeScript backend
- `packages/shared`: shared DTOs, schemas, and types
- `infra`: migrations and local infrastructure
- `docs`: specs, architecture, API, data model, security, and sprint checklists

## Current Status

- Sprint 1 through Sprint 16 are closed in the current sprint checklist.
- Sprint 17 is focused on MVP Phase 1 release candidate readiness.
- Current focus: release gate, smoke evidence, runbook/rollback notes, and ship/no-ship criteria.
- Detailed sprint status: [docs/implementation-sprint-checklist.md](docs/implementation-sprint-checklist.md).
- Release candidate checklist: [docs/release-candidate-checklist.md](docs/release-candidate-checklist.md).
- Release runbook: [docs/release-runbook.md](docs/release-runbook.md).

## MVP Goals

- Register and login
- Browse, search, and view audiobook detail
- Audio player, resume, bookmark, and favorite
- Subscription entitlement and billing
- Admin CMS content management
- Elasticsearch-backed search

## Root Commands

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
pnpm typecheck
```

## Release Gate

```bash
pnpm.cmd check
```

## Quick Start

### API

```bash
pnpm.cmd --dir apps/api migrate
pnpm.cmd --dir apps/api dev
```

### Admin

```bash
pnpm.cmd --dir apps/admin dev
```

### Mobile

```powershell
Set-Location D:\01_Work\clone_fanos\apps\mobile
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat pub get
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat run
```

## Local Dev

Docker Desktop must be running for local PostgreSQL.

The local `clone-fanos` PostgreSQL container publishes to `localhost:5434` on
the host to avoid conflicts with other local PostgreSQL instances.

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm.cmd api:migrate
pnpm.cmd api:dev
```

PowerShell shortcut: `infra/local-dev.ps1`.

If `pnpm` is blocked by Execution Policy, use `cmd /c pnpm ...` or call
`pnpm.cmd` directly.

## Documentation

- [Spec](docs/spec.md)
- [Architecture](docs/architecture.md)
- [API Design](docs/api-design.md)
- [Data Model](docs/data-model.md)
- [Security](docs/security.md)
- [Sprint Checklist](docs/implementation-sprint-checklist.md)
- [Release Candidate Checklist](docs/release-candidate-checklist.md)
- [Release Runbook](docs/release-runbook.md)
