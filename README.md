# Clone Fonos

Nền tảng audiobook và audio learning mobile-first, định vị theo hướng:

> Spotify for Knowledge Workers

## Cấu trúc repo

- `apps/mobile`: ứng dụng Flutter cho người dùng cuối
- `apps/admin`: CMS web cho quản trị nội dung
- `apps/api`: backend NestJS/TypeScript
- `packages/shared`: DTO, schema và type dùng chung
- `infra`: migration và hạ tầng cục bộ
- `docs`: spec, architecture, API, data model, security, checklist

## Trạng thái hiện tại

- Sprint 1 đến Sprint 6 đã hoàn thành trong checklist hiện tại.
- Sprint 7 đang triển khai lại subscription flow theo mô hình `Paywall -> Select Plan -> Payment -> Verify entitlement -> Unlock content`.
- Trọng tâm hiện tại là chốt state machine, contract API, entitlement là nguồn sự thật, và các nhánh retry/pending/fail trên mobile.
- Checklist chi tiết nằm ở [docs/implementation-sprint-checklist.md](docs/implementation-sprint-checklist.md).

## Mục tiêu MVP

- Đăng ký / đăng nhập
- Browse, search, xem detail audiobook
- Audio player, resume, bookmark, favorite
- Subscription entitlement + billing
- Admin CMS quản lý content
- Search bằng Elasticsearch

## Lệnh gốc

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
pnpm typecheck
```

## Start Nhanh

### API

```bash
pnpm --dir apps/api migrate
pnpm --dir apps/api dev
```

### Admin

```bash
pnpm --dir apps/admin dev
```

### Mobile

```powershell
Set-Location D:\01_Work\clone_fanos\apps\mobile
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat pub get
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat run
```

## Local dev nhanh

> Cần Docker Desktop service chạy để compose PostgreSQL local.
>
> PostgreSQL local của `clone-fanos` dùng cổng `5433` trên máy host để tránh xung đột với instance khác.

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm api:migrate
pnpm api:dev
```

> PowerShell shortcut: `infra/local-dev.ps1`
>
> Nếu `pnpm` bị chặn bởi Execution Policy, dùng `cmd /c pnpm ...` hoặc chạy trực tiếp `pnpm.cmd`.

## Tài liệu

- [Spec](docs/spec.md)
- [Architecture](docs/architecture.md)
- [API Design](docs/api-design.md)
- [Data Model](docs/data-model.md)
- [Security](docs/security.md)
- [Sprint Checklist](docs/implementation-sprint-checklist.md)
