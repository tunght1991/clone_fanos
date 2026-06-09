# Technical Checklist

Trang thai mac dinh:
- `TODO`: chua bat dau
- `DOING`: dang thuc hien
- `DONE`: da hoan thanh

## Local bootstrap

| Item | Owner | Status | Ghi chu |
|---|---|---|---|
| Repo chay local duoc end-to-end | Platform | DONE | Local Docker/PostgreSQL/API health preflight passed; Sprint 18 smoke `20260605231432` verified API auth, content, playback, engagement, subscription/asset gate, admin web root, and mobile web bootstrap |
| Migration nen chay duoc end-to-end | Backend | DONE | `pnpm.cmd api:migrate` completed against local PostgreSQL; `0002_subscription_receipt_verifications.sql` covers DBs that already applied the older initial migration |
