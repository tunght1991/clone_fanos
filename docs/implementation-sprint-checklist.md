# Sprint Checklist

Trạng thái mặc định:
- `TODO`: chưa bắt đầu
- `DOING`: đang thực hiện
- `DONE`: đã hoàn thành

## Sprint 1: Nền tảng và contract

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| Dựng monorepo, scripts, lint/test/build cơ bản | Platform | DONE | Scaffold workspace và root scripts đã tạo |
| Thiết lập DB foundation và migrations lõi | Backend | DONE | Schema Postgres lõi đã được dựng trong `infra/migrations/0001_initial.sql` |
| Chuẩn hóa DTO chung cho asset access, subscription, search | Shared/Backend | DONE | Contract skeleton đã chốt trong `packages/shared` và `docs` |
| Chốt entity core: audiobook, chapter, narrator, subscription | Backend | DONE | Content và subscription core đã có repository/service/controller facade |

### Checkpoint Sprint 1

| Checkpoint | Owner | Status |
|---|---|---|
| DTO contract đã cố định | Shared | DONE |

Ghi chú:
- Hai mục bootstrap môi trường được tách sang [docs/technical-checklist.md](./technical-checklist.md).

## Sprint 2: Backend core

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| Auth và RBAC | Backend | DONE | Auth service, token bearer, refresh/logout, RBAC policy, admin guard, test xanh |
| Asset access service cho CDN / S3 / localfile | Backend/Platform | DONE | Có policy, runtime guard, service và test skeleton |
| API đọc audiobook list/detail | Backend | DONE | Đã có DTO, controller facade và content service path |
| NestJS HTTP wiring cho content/subscription | Backend | DONE | Đã có AppModule, bootstrap server, HTTP controller, và test xanh cho facade wiring |
| Playback progress và resume | Backend | DONE | Module playback, progress upsert/get và HTTP routes đã có |
| Bookmark, favorite, note | Backend | DONE | CRUD bookmark, toggle favorite, và CRUD note đã có |
| Search backend với Elasticsearch và index `SearchDocument` | Backend | DONE | `GET /search`, search service/repository, `SearchDocument` và reindex service đã có; adapter ES có thể cắm sau |

### Checkpoint Sprint 2

| Checkpoint | Owner | Status |
|---|---|---|
| User có thể login, browse, search, resume | Backend/Mobile | DONE | Backend auth/content/search/playback flow đã có |
| Asset access động hoạt động | Backend/Platform | DONE | Loader/policy/service đã có |
| Search trả kết quả đúng DTO | Backend | DONE | `GET /search` trả `SearchResponseDto` đúng contract |

## Sprint 3: Subscription và content ops

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| Subscription domain bao gồm billing/provider/webhook | Backend | DONE | Policy, repository, service, controller facade và webhook idempotency đã có |
| Admin content management APIs | Backend/Admin | DONE | Create/update/publish/unpublish audiobook và chapter đã có |
| Audit log cho publish/unpublish | Backend | DONE | `ContentAuditService` ghi log publish/unpublish và query trail theo entity |
| Reindex flow cho Elasticsearch khi content đổi | Backend/Platform | DONE | `ContentMutationService` enqueue reindex cho audiobook sau update/publish; alias swap an toàn và rollback đã có |
| Analytics ingest cơ bản | Backend | DONE | `POST /analytics/events` đã có và ingest theo user authenticated |

### Checkpoint Sprint 3

| Checkpoint | Owner | Status |
|---|---|---|
| Subscription entitlement hoạt động | Backend | DONE | Billing gộp trong Subscription, verify/checkout/webhook đã có |
| Admin quản lý nội dung end-to-end | Admin/Backend | DONE | Admin content workflow đã khớp contract và test/admin UI |
| Analytics không block luồng nghe | Backend | DONE | Endpoint ingest riêng, không nằm trên luồng playback |

## Sprint 4: Mobile MVP

Ghi chú: detail design mobile screen specs đã có trong `docs/mobile-screen-specs/`, có thể bắt đầu UI implementation theo từng màn.

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| Mobile auth + onboarding | Mobile | DONE | App shell, onboarding flow, login/register flow, and auth gate are implemented |
| Browse/search/detail flow | Mobile | DONE | Home browse, search, detail navigation with mock/HTTP repository support |
| Player + progress + asset access | Mobile/Backend | DONE | Player screen, resume, seek, speed, sleep timer, asset access, and progress sync are implemented |
| Bookmark/favorite/subscription state | Mobile/Backend | DONE | Bookmark list, favorite toggle, subscription screen, và bookmark action trong player/detail đã có |
| Premium gating trên mobile | Mobile | DONE | Detail/player chặn premium theo entitlement subscription |

### Checkpoint Sprint 4

| Checkpoint | Owner | Status |
|---|---|---|
| Mobile user flow chính chạy được | Mobile | DONE | Browse/search/detail/player/subscription flow đã nối end-to-end |
| Resume nghe chính xác | Mobile/Backend | DONE | Player resume từ progress và sync vị trí nghe |
| Premium content bị chặn đúng | Mobile/Backend | DONE | Premium flag now resolves against subscription entitlement before playback |

## Sprint 5: Admin UI và hardening

Ghi chú: detail design admin screen specs đã có trong `docs/admin-screen-specs/`, có thể bắt đầu CMS UI theo từng màn.

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| Admin CMS UI | Admin | DONE | Content dashboard, editor, chapters, taxonomy và audit trail UI đã có |
| Tests cho backend/mobile/admin core flow | Backend/Mobile/Admin | DONE | Đã có test coverage cho API, mobile và admin core flows |
| Logging, audit, rate limit, error handling | Backend | DONE | Request logging, audit trace, rate limit và HTTP error handling đã có |
| Kiểm tra security baseline và rollback path cho search index | Backend/Platform | DONE | Security headers, CORS, body limit và rollback path đã có |

### Checkpoint Sprint 5

| Checkpoint | Owner | Status |
|---|---|---|
| Admin UI thao tác được content | Admin | DONE | Content editor, chapter manager, taxonomy và audit trail đã thao tác được |
| Core flow có test và observability | Backend/Mobile/Admin | DONE | Test suite và request-level observability đã có |
| Search index có chiến lược rollback | Backend/Platform | DONE | Alias swap an toàn và rollbackLastSwap đã có |

## Sprint 6: Ổn định phát hành

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| End-to-end smoke test toàn hệ thống | Backend/Mobile/Admin | DONE | Smoke test core flow auth/content/search/playback/audit đã có trong suite API |
| Fix regression và polish UX | Backend/Mobile/Admin | DONE | Mobile auth password rule đã khớp backend, mobile test suite xanh |
| Rà lại docs và contract cuối cùng | BA/Architecture | DONE | `api-design`, `spec`, `prd`, `mobile/admin screen specs`, và `architecture` đã được đồng bộ |
| Xác nhận scope MVP đã khớp thực thi | BA/Product | DONE | Scope MVP đã khớp với implementation và docs contract hiện tại |

### Checkpoint Sprint 6

| Checkpoint | Owner | Status |
|---|---|---|
| Backend core end-to-end | Backend | DONE | Smoke test core flow đã khóa các đường chính của backend |
| Mobile app user flow chính | Mobile | DONE | Onboarding -> auth -> browse/search -> detail -> player flow đã có widget smoke test |
| Admin CMS content workflow | Admin | DONE | Tạo/sửa/publish/unpublish audiobook và chapter đã khớp contract admin hiện tại |
| Subscription billing và asset access ổn định | Backend/Platform | DONE | `GET /subscriptions/me` đã map đúng entitlement/status theo DTO contract |
| Narrator 3 giọng và Elasticsearch search hoạt động đúng | Backend | DONE | `audiobook_narrators.role_index` bị khóa trong 1..3 và search/reindex suite đã xanh |

## Sprint 7: Rework Subscription Flow

Mục tiêu: triển khai lại subscription theo flow mới trong `docs/flow-diagram.md`:

`Paywall -> Select Plan -> Payment -> Success/Failed -> Verify receipt / entitlement -> Unlock content`

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| Chốt state machine cho subscription flow mới | BA/Backend/Mobile | DONE | State machine và luật chuyển trạng thái đã được chốt trong `packages/shared/src/contracts/subscription.ts` |
| Chốt API contract cho plan, payment attempt, receipt verify, entitlement status | Backend/BA | DONE | `plans`, `checkout`, `verify` và `entitlement.status` đã được khóa trong `packages/shared` và `docs/api-design.md` |
| Cập nhật backend entitlement làm nguồn sự thật | Backend | DONE | Entitlement được resolve từ subscription snapshot, có `status`, `checkedAt`, `source` và verify trả kết quả theo entitlement thật |
| Implement receipt verification idempotent | Backend | DONE | Receipt replay không grant lại entitlement; verify cùng receipt trả về trạng thái hiện tại |
| Rebuild paywall và select plan flow | Mobile | DONE | Màn paywall dẫn sang select plan, sau đó mới sang payment |
| Rebuild payment result flow trên mobile | Mobile | DONE | `Payment Success` chuyển sang verify, `Payment Failed` cho retry, không unlock trực tiếp |
| Sync entitlement sau payment success | Mobile/Backend | DONE | App submit receipt/token và poll/refresh trạng thái khi verify pending |
| Gating premium content theo entitlement | Mobile/Backend | DONE | Premium content chỉ mở khi entitlement success, fail thì quay về paywall |
| Thêm analytics funnel subscription | Backend/Analytics/Mobile | DONE | Track paywall, select plan, payment start/success/fail, verify success/fail, unlock |
| Smoke test end-to-end subscription flow mới | Backend/Mobile/QA | DONE | Kiểm tra happy path, failed payment, pending verification, retry và resume app |

### Checkpoint Sprint 7

| Checkpoint | Owner | Status | Ghi chú |
|---|---|---|---|
| Payment success chưa unlock trực tiếp | Backend/Mobile | DONE | Unlock chỉ xảy ra sau verify receipt / entitlement success |
| Failed payment có retry path rõ ràng | Mobile/Backend | DONE | Người dùng có thể retry payment hoặc thoát về paywall |
| Entitlement là nguồn sự thật | Backend | DONE | `/subscriptions/me` hoặc endpoint tương đương phản ánh đúng trạng thái |
| Subscription funnel có thể đo được | Backend/Analytics | DONE | Có đủ event để theo dõi conversion và drop-off |

## Sprint 8: UI theo DESIGN.md

Mục tiêu: chuẩn hóa toàn bộ UI theo `DESIGN.md`, ưu tiên đồng bộ palette, typography, spacing, radius và component patterns giữa mobile và admin.

### Kế hoạch theo tuần

| Tuần | Trọng tâm | Owner | Status | Ghi chú |
|---|---|---|---|---|
| Tuần 1 | Chốt token mapping và dựng foundation UI | Platform/Mobile/Admin | DONE | Mobile theme foundation, primitives và bridge cho admin đã hoàn tất |
| Tuần 2 | Shared primitives cho mobile và restyle entry screens | Mobile | DONE | Button, card, chip, input, onboarding, auth, home shell đã được restyle theo design system |
| Tuần 3 | Mobile content/subscription surfaces và admin primitives | Mobile/Admin | DONE | Player, paywall, select plan, payment, bookmarks, favorites và admin primitives đã hoàn tất; admin feature screens đã được restyle |
| Tuần 4 | Admin feature screens, polish và accessibility | Admin/Platform/Mobile | DONE | Dashboard, editor, taxonomy, audit, contrast, focus, responsive QA đã hoàn tất |

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| Chốt mapping token từ `DESIGN.md` sang implementation | Platform/Mobile/Admin | DONE | `app_theme.dart` đã map palette, typography và radius theo design token |
| Xây shared UI primitives cho mobile | Mobile | DONE | Shared section header, empty/state card, meta chip, status chip và cover badge đã được tách dùng chung |
| Xây shared UI primitives cho admin | Admin | DONE | Shared shell, button, badge, alert, empty state và panel primitives đã được tách dùng chung |
| Restyle mobile shell và các màn entry | Mobile | DONE | Onboarding, auth, home shell, navigation, search entry và profile entry đã theo cùng visual system |
| Restyle mobile content, playback và subscription surfaces | Mobile | DONE | Player, subscription, bookmarks và favorites đã hoàn tất theo design system |
| Restyle admin dashboard/content/editor stack | Admin | DONE | Dashboard, content list, editor, chapter manager, taxonomy và audit trail đã theo cùng visual system |
| Polish, accessibility và token gap closure | Platform/Mobile/Admin | DONE | Focus state, contrast, responsive edge cases và token gap closure đã hoàn tất |

### Checkpoint Sprint 8

| Checkpoint | Owner | Status | Ghi chú |
|---|---|---|---|
| Token mapping đã chốt | Platform | DONE | `DESIGN.md` đã map sang `app_theme.dart`, không còn lệch palette/typography/radius ở nền tảng mobile |
| Mobile UI core screens theo design system | Mobile | DONE | Auth, onboarding, home, player, subscription, bookmarks và favorites đã đồng bộ theme |
| Admin UI core screens theo design system | Admin | DONE | Dashboard, content editor, taxonomy và audit trail đã đồng bộ |
| Accessibility và polish đạt mức chấp nhận | Platform/Mobile/Admin | DONE | Contrast, focus state, spacing và responsive behavior đã được rà lại và chấp nhận |

## Sprint 9: Admin Create Audiobook With Chapters

Mục tiêu: cho phép admin tạo audiobook và chapters trong cùng một submit, lưu atomic vào PostgreSQL, rồi trả về bản ghi tạo mới để tiếp tục publish/index workflow.

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| Extend shared create-audiobook contract for nested chapters | Shared/API | DONE | `AdminCreateAudiobookRequestDto` đã chứa chapter input với validation strict |
| Persist audiobook and chapters in one backend transaction | Backend | DONE | `POST /admin/audiobooks` lưu audiobook + chapters atomically và trả DTO tạo mới |
| Add admin UI for creating audiobook with chapters | Admin | DONE | Form tạo mới nhập metadata + chapter list trong một submit |
| Wire end-to-end create flow to existing admin navigation | Admin | DONE | Đường vào form tạo mới đã nối từ CMS hiện tại |
| Lock regression coverage for read-back and rollback behavior | Backend/Admin/QA | DONE | Verify read-back, rollback khi chapter fail, và no orphan rows |

### Checkpoint Sprint 9

| Checkpoint | Owner | Status | Ghi chú |
|---|---|---|---|
| Create flow lưu atomic vào DB | Backend | DONE | Audiobook + chapters cùng lưu hoặc rollback toàn bộ |
| Admin form submit một lần thành công | Admin | DONE | UI cho phép tạo audiobook và chapters trong một submit |
| Read-back và rollback ổn định | Backend/QA | DONE | Bản ghi tạo mới đọc lại được, request lỗi không để lại dữ liệu rác |

Ghi chú:
- Trạng thái Sprint 9 đã được đối chiếu với code thực tế và targeted tests trong `apps/api` và `apps/admin`.

## Sprint 10: Risk Hardening and Scope Control

Mục tiêu: khóa các rủi ro còn lại quanh subscription, search/reindex, offline playback, narrator role rules, và asset access consistency.

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| Chốt subscription scope và entitlement behavior | Backend/Product | DONE | Subscription flow và entitlement đã được siết theo contract |
| Khóa search/reindex consistency sau content changes | Backend/Platform | DONE | Reindex rollback và search validation đã có coverage |
| Giữ offline playback không vượt MVP | Mobile/Product | DONE | Offline playback boundary đã được khóa theo runtime contract |
| Enforce narrator cardinality và role rules | Backend/Admin/Mobile | DONE | `role_index` 1..3 và primary narrator invariant đã được enforced |
| Đồng nhất asset access giữa backend và mobile | Backend/Mobile | DONE | Asset access contract và premium gating đã đồng bộ |

### Checkpoint Sprint 10

| Checkpoint | Owner | Status | Ghi chú |
|---|---|---|---|
| Subscription entitlement ổn định | Backend | DONE | `/subscriptions/me` phản ánh entitlement đúng contract |
| Search/reindex không drift | Backend/Platform | DONE | Alias swap, rollback và search filter validation đã xanh |
| Offline playback boundary giữ nguyên | Mobile | DONE | Mobile không tự mở rộng offline capability ngoài MVP |
| Narrator rules đồng nhất | Backend/Admin/Mobile | DONE | Backend, admin và mobile cùng tuân theo cùng invariant |
| Asset access contract đồng nhất | Backend/Mobile | DONE | Premium asset access chỉ mở theo entitlement hợp lệ |

## Sprint 11: Release Readiness and Contract Consistency

Mục tiêu: đưa hệ thống tới trạng thái release-ready bằng cách khóa các trust boundary còn lại, giữ contract giữa backend/mobile/admin/shared nhất quán, và mở rộng CI/test coverage cho các rủi ro còn lại.

| Task | Owner | Status | Ghi chú |
|---|---|---|---|
| Loại bỏ fallback identity paths trong production request handling | Backend | DONE | Production routes phải buộc bearer token |
| Giữ subscription, asset access và search validation strict | Backend | DONE | Webhook signature, returnUrl guard và UUID parsing phải được khóa |
| Revalidate mobile sessions trước khi vào authenticated state | Mobile | DONE | Stored session phải được kiểm tra lại qua `me()` trước khi activate |
| Chặn unpublished chapters trên mọi mobile path | Mobile | DONE | Playable chapter filtering phải được enforced ở load, select, và start |
| Đồng bộ shared DTOs, DB constraints và UI behavior | Shared/Backend/Admin/Mobile | DONE | Contract drift bị chặn bởi schema, validation và tests |
| Mở rộng CI/root validation cho API, admin, mobile, shared | Platform/QA | DONE | `pnpm check` bao phủ mobile test và shared contract checks |

### Checkpoint Sprint 11

| Checkpoint | Owner | Status | Ghi chú |
|---|---|---|---|
| Production auth boundary đã được khóa | Backend | DONE | Không còn impersonation qua fallback identity path |
| Mobile bootstrap an toàn hơn | Mobile | DONE | Restored session không còn tự động vào authenticated state khi chưa được revalidate |
| Contract drift bị chặn | Shared/Backend | DONE | DTO và migration assertions ngăn lệch schema/runtime |
| Root validation đủ rộng | Platform/QA | DONE | `pnpm check` và targeted suites chặn regression trước merge |

## Rủi ro theo dõi xuyên suốt

| Rủi ro | Owner | Status | Ghi chú |
|---|---|---|---|
| Billing/subscription có xu hướng phình scope | Backend/Product | TODO |  |
| Elasticsearch mapping/reindex cần kiểm soát chặt | Backend/Platform | TODO |  |
| Offline playback dễ vượt MVP nếu không khóa phạm vi | Mobile/Product | TODO |  |
| Narrator 3 giọng cần enforce ở backend và UI | Backend/Admin/Mobile | TODO |  |
| Asset access động phải đồng nhất giữa backend và mobile | Backend/Mobile | TODO |  |
