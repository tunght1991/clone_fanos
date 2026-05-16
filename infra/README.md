# Infra

Hạ tầng cục bộ và migration cho hệ thống.

## Nội dung

- Database migrations
- Local infra assets
- Scripts hỗ trợ khởi tạo môi trường

## Trạng thái

- Có migration skeleton ban đầu
- Có compose local cho PostgreSQL

## Local dev

> Yêu cầu: Docker Desktop service phải đang chạy để `docker compose` có thể khởi động PostgreSQL.
>
> Container PostgreSQL của `clone-fanos` publish ra `localhost:5433` trên máy host.

1. Khởi động PostgreSQL:

```bash
docker compose -f infra/docker-compose.yml up -d
```

> Nếu bạn dùng PowerShell, có thể chạy `infra/local-dev.ps1` để bật Postgres rồi migrate luôn.
>
> Nếu `pnpm` bị chặn bởi Execution Policy, helper đã gọi `cmd /c pnpm api:migrate` để tránh lỗi này.

2. Chạy migration nền:

```bash
pnpm api:migrate
```

3. Chạy API local:

```bash
pnpm api:dev
```
