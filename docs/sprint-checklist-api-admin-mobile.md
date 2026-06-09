# Sprint Checklist: GhÃ©p API Vá»›i Admin VÃ  Mobile

TÃ i liá»‡u nÃ y lÃ  báº£n rÃºt gá»n tá»« [docs/implementation-plan-api-admin-mobile.md](./implementation-plan-api-admin-mobile.md) Ä‘á»ƒ giao viá»‡c theo tuáº§n.

Tráº¡ng thÃ¡i máº·c Ä‘á»‹nh:
- `TODO`: chÆ°a báº¯t Ä‘áº§u
- `DOING`: Ä‘ang thá»±c hiá»‡n
- `DONE`: Ä‘Ã£ hoÃ n thÃ nh trong repo

## Sprint 1: KhÃ³a contract vÃ  ranh giá»›i truy cáº­p

| Task | Owner | Status | Ghi chÃº |
|---|---|---|---|
| KhÃ³a DTO/enums chung cho auth, audiobook, chapter, subscription, search, asset | Shared/Backend | DONE | Æ¯u tiÃªn cáº­p nháº­t `packages/shared` trÆ°á»›c |
| Chuáº©n hÃ³a session, refresh, `GET /auth/me`, role admin/user | Backend | DONE | Admin vÃ  mobile pháº£i dÃ¹ng cÃ¹ng nguá»“n session |
| KhÃ³a asset access/signed URL policy | Backend/Platform | DONE | KhÃ´ng lá»™ raw storage URL |

### Checkpoint Sprint 1

| Checkpoint | Owner | Status | Ghi chÃº |
|---|---|---|---|
| Contract chung Ä‘Ã£ á»•n Ä‘á»‹nh | Shared | DONE | KhÃ´ng cÃ²n field/enum lá»‡ch giá»¯a admin vÃ  mobile |
| Auth/role boundary Ä‘Ã£ rÃµ | Backend | DONE | Admin khÃ´ng Ä‘i vÃ o user-only flow sai |
| Asset access an toÃ n | Backend/Platform | DONE | URL truy cáº­p tÃ i nguyÃªn khÃ´ng bá»‹ expose |

## Sprint 2: API content tháº­t cho admin vÃ  mobile

| Task | Owner | Status | Ghi chÃº |
|---|---|---|---|
| HoÃ n thiá»‡n content read model cho mobile | Backend/Mobile | DONE | List, detail, chapter list, search, category/tag |
| HoÃ n thiá»‡n content write model cho admin | Backend/Admin | DONE | Create, update, publish, unpublish audiobook/chapter |
| Chuáº©n hÃ³a taxonomy vÃ  audit trail | Backend/Admin | DONE | Author, narrator, category, tag, audit publish/update |

### Checkpoint Sprint 2

| Checkpoint | Owner | Status | Ghi chÃº |
|---|---|---|---|
| Mobile Ä‘á»c Ä‘Æ°á»£c content live | Backend/Mobile | DONE | KhÃ´ng cÃ²n phá»¥ thuá»™c mock cho luá»“ng chÃ­nh |
| Admin thao tÃ¡c content live | Backend/Admin | DONE | Publish/unpublish pháº£n Ã¡nh Ä‘Ãºng lÃªn read model |
| Audit/taxonomy hoáº¡t Ä‘á»™ng | Backend/Admin | DONE | CÃ³ log cho hÃ nh Ä‘á»™ng quan trá»ng |

## Sprint 3: Ná»‘i admin CMS vÃ o API tháº­t

| Task | Owner | Status | Ghi chÃº |
|---|---|---|---|
| Thay demo fallback báº±ng live API trong admin | Admin | DONE | Dashboard, editor, chapters dÃ¹ng backend tháº­t |
| HoÃ n thiá»‡n upload cover/audio | Admin/Backend | DONE | Upload qua contract backend, khÃ´ng lá»™ URL raw |
| HoÃ n thiá»‡n publish/unpublish UX | Admin/Backend | DONE | Loading, error, retry, empty state rÃµ rÃ ng |

### Checkpoint Sprint 3

| Checkpoint | Owner | Status | Ghi chÃº |
|---|---|---|---|
| Admin CMS cháº¡y end-to-end | Admin | DONE | List/detail/create/update/publish hoáº¡t Ä‘á»™ng |
| Upload media á»•n Ä‘á»‹nh | Admin/Backend | DONE | CÃ³ thá»ƒ kiá»ƒm tra upload vÃ  truy cáº­p asset há»£p lá»‡ |
| KhÃ´ng cÃ²n fallback data cho core content | Admin | DONE | Luá»“ng content chÃ­nh dÃ¹ng API tháº­t hoÃ n toÃ n |

## Sprint 4: Ná»‘i mobile vÃ o API tháº­t

| Task | Owner | Status | Ghi chÃº |
|---|---|---|---|
| Ná»‘i auth vÃ  bootstrap mobile | Mobile | DONE | Login/register/refresh/me/session restore |
| Ná»‘i discovery/search/detail | Mobile | DONE | Browse, category, search, audiobook detail live |
| Ná»‘i player/progress/bookmark | Mobile/Backend | DONE | Resume, seek, bookmark timestamp, playback progress |
| Ná»‘i subscription entitlement | Mobile/Backend | DONE | Paywall vÃ  unlock dá»±a trÃªn entitlement tháº­t |

### Checkpoint Sprint 4

| Checkpoint | Owner | Status | Ghi chÃº |
|---|---|---|---|
| Mobile user flow chÃ­nh cháº¡y live | Mobile | DONE | Tá»« login tá»›i nghe audiobook tháº­t |
| Resume vÃ  bookmark hoáº¡t Ä‘á»™ng | Mobile/Backend | DONE | Tiáº¿n Ä‘á»™ nghe vÃ  bookmark lÆ°u Ä‘Ãºng |
| Premium gating Ä‘Ãºng | Mobile/Backend | DONE | Chá»‰ má»Ÿ ná»™i dung premium khi entitlement há»£p lá»‡ |

## Sprint 5: Äá»“ng bá»™ váº­n hÃ nh vÃ  hardening

| Task | Owner | Status | Ghi chÃº |
|---|---|---|---|
| Chuáº©n hÃ³a analytics events | Backend/Mobile/Admin | DONE | app_opened, audiobook_viewed, chapter_started, bookmark_created, subscription_* |
| Reindex vÃ  Ä‘á»“ng bá»™ publish | Backend/Platform | DONE | Publish/unpublish pháº£i pháº£n Ã¡nh Ä‘Ãºng search/public read model |
| Hardening security vÃ  E2E smoke test | Backend/Mobile/Admin | DONE | Validation, rate limit, timeout, smoke test core flow |

### Checkpoint Sprint 5

| Checkpoint | Owner | Status | Ghi chÃº |
|---|---|---|---|
| Analytics Ä‘á»§ dÃ¹ng cho funnel | Backend | DONE | Äo Ä‘Æ°á»£c retention vÃ  conversion cÆ¡ báº£n |
| Search vÃ  publish Ä‘á»“ng bá»™ | Backend/Platform | DONE | Content Ä‘á»•i tráº¡ng thÃ¡i pháº£n Ã¡nh Ä‘Ãºng ra user |
| Core flow á»•n Ä‘á»‹nh | Backend/Mobile/Admin | DONE | Admin publish -> mobile browse/playback cháº¡y Ä‘Æ°á»£c |

## Rá»§i Ro Theo DÃµi

| Rá»§i ro | Owner | Status | Ghi chÃº |
|---|---|---|---|
| Lá»‡ch contract giá»¯a admin vÃ  mobile | Shared/Backend | DONE | Shared DTOs, backend validation, admin/mobile behavior, and root validation now guard contract drift |
| Asset URL bá»‹ lá»™ | Backend/Platform | DONE | Asset access is backend-resolved through `AssetAccess`; production rejects `LOCALFILE` and avoids raw storage URL as client contract |
| Publish xong nhÆ°ng search chÆ°a cáº­p nháº­t | Backend/Platform | DONE | Content mutations enqueue audiobook reindex; bulk/single reindex and alias rollback have coverage |
| Demo fallback cÃ²n sÃ³t | Admin/Mobile | DONE | Main flows use API-backed repositories; mock/demo data remains limited to explicit local/test fallback paths |
| Subscription verify phá»©c táº¡p | Backend/Mobile | DONE | Checkout, verify, webhook, and entitlement are separated; premium unlock depends on entitlement success |

## Gá»£i Ã Lá»‹ch Giao Viá»‡c

- Tuáº§n 1: Sprint 1
- Tuáº§n 2: Sprint 2
- Tuáº§n 3: Sprint 3
- Tuáº§n 4: Sprint 4
- Tuáº§n 5: Sprint 5

