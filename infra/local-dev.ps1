param(
  [switch]$SkipMigrate
)

$ErrorActionPreference = 'Stop'

$composeFile = Join-Path $PSScriptRoot 'docker-compose.yml'

docker compose -f $composeFile up -d postgres

if (-not $SkipMigrate) {
  Push-Location (Join-Path $PSScriptRoot '..')
  try {
    cmd /c pnpm api:migrate
  } finally {
    Pop-Location
  }
}

Write-Host 'PostgreSQL local environment is ready.'
