# Implementation Checklist

Tr?ng th?i m?c ??nh: `Ch?a b?t ??u`

## Phase 1: N?n t?ng

- [x] **T1 - Kh?i t?o monorepo v? c?u tr?c d? ?n**
  - [x] T?o `apps/mobile`, `apps/admin`, `apps/api`, `packages/shared`, `infra`, `tests`
  - [x] Thi?t l?p lint, format, test, build c? b?n
  - [x] Chu?n h?a workspace package manager v? scripts

- [x] **T2 - Thi?t l?p database foundation v? migrations**
  - [x] T?o migration cho `Audiobook`, `Chapter`, `Narrator`, `AudiobookNarrator`
  - [x] T?o migration cho `Category`, `Tag`, `Bookmark`, `Favorite`, `Note`
  - [x] T?o migration cho `SubscriptionPlan`, `Subscription`, `AnalyticsEvent`
  - [x] Th?m index v? r?ng bu?c d? li?u c? b?n

### Checkpoint: Sau T1-T2

- [ ] Repo d?ng ???c local
- [ ] DB schema n?n ch?y ???c
- [ ] Kh?ng c?n m? h? v? entity l?i v? quan h?

## Phase 2: Contract v? domain core

- [x] **T3 - Chu?n h?a shared DTO v? validation schema**
  - [x] T?o `AssetAccessDto`, `GetAssetAccessDto`
  - [x] T?o `SubscriptionDetailDto`, `SubscriptionCheckoutRequestDto`, `SubscriptionCheckoutResponseDto`, `SubscriptionWebhookEventDto`
  - [x] T?o `SearchQueryDto`, `SearchResponseDto`, `SearchAudiobookHitDto`
  - [x] T?o DTO cho playback, bookmark, favorite, note
  - [x] Chu?n h?a contract query cho search v? payload cho asset access / playback

- [x] **T4 - D?ng domain core cho content v? narrator**
  - [x] T?o service/repository cho audiobook, chapter, narrator
  - [x] Enforce t?i ?a 3 narrator cho m?t audiobook
  - [x] Chu?n h?a `AudiobookDetailDto` tr? v? `narrators[]`

- [x] **T5 - D?ng subscription domain bao g?m billing**
  - [x] T?o service cho plan, entitlement, billing provider
  - [x] T?o checkout flow
  - [x] T?o webhook flow idempotent
  - [x] Chu?n h?a `GET /subscriptions/me`

### Checkpoint: Sau T3-T5

- [x] Contract DTO ?? c? ??nh
- [x] Content core v? subscription core ch?y ??c l?p
- [x] Kh?ng c?n module payment ri?ng

## Phase 3: Core backend MVP

- [x] **T6 - Authentication v? RBAC**
  - [x] User register/login/refresh/logout
  - [x] Admin scope t?ch ri?ng
  - [x] Guard cho admin endpoint

- [x] **T7 - Asset access service v?i signed URL qua CDN / S3 / LOCALFILE**
  - [x] T?o `POST /assets/access`
  - [x] Implement adapter cho `CDN`
  - [x] Implement adapter cho `S3`
  - [x] Implement adapter cho `LOCALFILE`

- [x] **T8 - API ??c danh s?ch/chi ti?t audiobook**
  - [x] T?o `GET /audiobooks`
  - [x] T?o `GET /audiobooks/:id`
  - [x] Tr? `author` v? `narrators[]` ??ng contract

- [x] **T9 - Playback progress v? resume**
  - [x] T?o `POST /playback/progress`
  - [x] T?o `GET /playback/progress/:audiobookId`
  - [x] L?u v? resume ??ng v? tr?

- [x] **T10 - Bookmark, favorite, note**
  - [x] T?o API CRUD bookmark
  - [x] T?o API toggle favorite
  - [x] T?o API CRUD note

- [x] **T11 - Search backend v?i Elasticsearch v? query contract r? r?ng**
  - [x] T?o `GET /search`
  - [x] D?ng search service/repository v? DTO response
  - [x] D?ng `SearchDocument`
  - [x] D?ng reindex flow

### Checkpoint: Sau T6-T11

- [x] User c? th? login, browse, search, resume
- [x] Asset access ho?t ??ng
- [x] Search tr? k?t qu? ??ng contract

## Phase 4: Subscription v? content ops

- [x] **T12 - Subscription domain v? webhook**
  - [x] Checkout flow
  - [x] Webhook idempotent
  - [x] `GET /subscriptions/me`

- [x] **T13 - Admin content management APIs**
  - [x] Upload audiobook
  - [x] Upload chapters
  - [x] Publish / unpublish content

- [x] **T14 - Audit log cho publish/unpublish**
  - [x] Ghi audit action
  - [x] Tra c?u l?ch s? thay ??i

- [x] **T15 - Reindex flow cho Elasticsearch khi content ??i**
  - [x] Enqueue reindex khi content publish/update
  - [x] Swap alias an to?n

- [x] **T16 - Analytics ingest c? b?n**
  - [x] `POST /analytics/events`
  - [x] Ingest c?c event ch?nh: `app_opened`, `audiobook_viewed`, `chapter_started`, `chapter_completed`, `playback_paused`, `playback_resumed`, `bookmark_created`, `favorite_created`, `subscription_started`, `subscription_cancelled`
  - [x] Kh?ng block lu?ng nghe

### Checkpoint: Sau T12-T16

- [ ] Subscription check / checkout ho?t ??ng
- [ ] Admin qu?n l? n?i dung end-to-end
- [ ] Analytics kh?ng block lu?ng nghe

## Phase 5: Mobile MVP

- [x] `docs/mobile-screen-specs/` ?? c? detail design cho lu?ng mobile MVP
- [x] **T17 - Mobile auth + onboarding**
- [x] **T18 - Browse/search/detail flow**
- [x] **T19 - Player + progress + signed asset access**
- [x] **T20 - Bookmark/favorite/subscription status**
- [x] **T21 - Premium gating tr?n mobile**

### Checkpoint: Sau T17-T21

- [x] Mobile user flow ch?nh ch?y ???c
- [x] Resume nghe ch?nh x?c
- [x] Premium content b? ch?n ??ng

## Phase 6: Ho?n thi?n

- [x] `docs/admin-screen-specs/` ?? c? detail design cho lu?ng admin CMS
- [x] **T22 - Admin CMS UI**
- [x] **T23 - Tests cho backend/mobile/admin core flow**
- [x] **T24 - Logging, audit, rate limit, error handling**
- [x] **T25 - Ki?m tra security baseline v? rollback path cho search index**

### Checkpoint: Sau T22-T25

- [x] Admin UI thao t?c ???c content
- [x] Core flow c? test v? observability
- [x] Search index c? chi?n l??c rollback
