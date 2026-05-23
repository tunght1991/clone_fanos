# API App

Backend NestJS/TypeScript cho nền tảng audiobook/audio learning.

## Trách nhiệm

- Auth và RBAC
- Audiobook, chapter, narrator, category, tag
- Playback progress
- Bookmark, favorite, note
- Subscription entitlement + billing/webhook
- Asset access
- Search backend
- Analytics ingest
- Admin CMS APIs

## Trạng thái

- Runtime HTTP đã có
- Migration runner đã có
- Auth/content/search/playback/subscription/analytics core đã có

## Start

Chạy migrate rồi start API:

```bash
pnpm migrate
pnpm start
```

Nếu PowerShell chặn `pnpm`, dùng:

```bash
pnpm.cmd migrate
pnpm.cmd start
```

## Dev login

Môi trường development tự bootstrap tài khoản admin mặc định:

- Email: `admin@fonos.test`
- Password: `Secret123!`

Nếu cần đổi, set `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, và `ADMIN_BOOTSTRAP_DISPLAY_NAME` trong `.env`.

## Ghi chú kiến trúc

- Controller chỉ xử lý request/response
- Business logic nằm trong service layer
- Data access đi qua repository
- Asset URL phải đi qua `AssetAccess`

## Local dev

> Cần Docker Desktop service chạy để có PostgreSQL local trước khi migrate/boot API.

```bash
pnpm migrate
pnpm dev
```

> Nếu PowerShell chặn `pnpm`, hãy chạy `pnpm.cmd migrate` hoặc `pnpm.cmd dev`.
