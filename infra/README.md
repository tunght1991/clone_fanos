# Infra

Local infrastructure and migration assets for the system.

## Contents

- Database migrations
- Local infrastructure assets
- Helper scripts for local environment bootstrap

## Status

- Initial migration skeleton exists.
- Local PostgreSQL compose setup exists.
- Sprint 17 release-candidate preflight uses local PostgreSQL plus
  `pnpm.cmd api:migrate`.

## Local Dev

Docker Desktop must be running before `docker compose` can start PostgreSQL.

The `clone-fanos` PostgreSQL container publishes to `localhost:5434` on the host.

1. Start PostgreSQL:

```bash
docker compose -f infra/docker-compose.yml up -d
```

PowerShell users can run `infra/local-dev.ps1` to start Postgres and run
migrations.

If `pnpm` is blocked by Execution Policy, the helper uses
`cmd /c pnpm api:migrate` to avoid that issue.

2. Run migrations:

```bash
pnpm.cmd api:migrate
```

3. Start the API:

```bash
pnpm.cmd api:dev
```

## Release Candidate Preflight

Sprint 17 release validation uses these local infrastructure steps:

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm.cmd api:migrate
pnpm.cmd api:dev
```

See [../docs/release-runbook.md](../docs/release-runbook.md).
