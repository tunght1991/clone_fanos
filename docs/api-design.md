# Thiết Kế API: Nền Tảng Audiobook / Audio Learning

## 1. Mục tiêu

Thiết kế API nhất quán, dễ mở rộng và đủ rõ để mobile app, admin CMS và các dịch vụ nội bộ dùng chung một backend mà không trộn trách nhiệm.

## 2. Nguyên tắc

- REST là mặc định cho MVP.
- Contract-first: định nghĩa request/response trước khi triển khai.
- Validation chỉ thực hiện ở biên hệ thống.
- Error response phải thống nhất toàn hệ thống.
- List endpoint phải có pagination.
- Ưu tiên thay đổi theo hướng bổ sung, tránh phá vỡ backward compatibility.
- Không expose raw storage URL cho audio hoặc media nhạy cảm.

## 3. Nhóm API chính

- `/auth`
- `/users`
- `/audiobooks`
- `/chapters`
- `/playback`
- `/bookmarks`
- `/favorites`
- `/notes`
- `/subscriptions`
- `/search`
- `/assets`
- `/admin/*`
- `/analytics`

## 4. Quy ước chung

### 4.1 Đặt tên

- URL dùng danh từ số nhiều.
- Query params dùng `camelCase`.
- Response fields dùng `camelCase`.
- Boolean fields dùng tiền tố `is`, `has`, `can`.
- Enum dùng `UPPER_SNAKE_CASE`.

### 4.2 Response thành công

```json
{
  "data": {},
  "meta": {}
}
```

### 4.3 Response lỗi

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": {}
  }
}
```

### 4.4 Mã lỗi chuẩn

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONFLICT`
- `RATE_LIMITED`
- `PAYMENT_REQUIRED`
- `INTERNAL_ERROR`

## 5. Pagination và filtering

### 5.1 List endpoint

```text
GET /audiobooks?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
```

### 5.2 Metadata pagination

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8,
    "hasNext": true
  }
}
```

### 5.3 Filtering

```text
GET /audiobooks?categoryId=cat_001&premiumFlag=true
```

## 6. Endpoint MVP

### 6.1 Auth

```text
POST /auth/register
POST /auth/login
GET /auth/me
POST /auth/refresh
POST /auth/logout
GET /admin/me
```

### 6.2 Content

```text
GET /audiobooks
GET /audiobooks/:id
GET /search
```

### 6.3 Playback

```text
POST /playback/progress
GET /playback/progress/:audiobookId
```

### 6.4 Bookmark và favorite

```text
POST /bookmarks
GET /bookmarks
DELETE /bookmarks/:id

POST /favorites/:audiobookId
DELETE /favorites/:audiobookId
GET /favorites

POST /notes
GET /notes
GET /notes/:id
PATCH /notes/:id
DELETE /notes/:id
```

### 6.5 Subscription

```text
GET /subscriptions/plans
GET /subscriptions/me
POST /subscriptions/verify
POST /subscriptions/checkout
POST /subscriptions/webhook
```

### 6.6 Asset access

```text
POST /assets/access
```

### 6.7 Admin

```text
POST /admin/audiobooks
PATCH /admin/audiobooks/:id
PATCH /admin/audiobooks/:id/publish
PATCH /admin/audiobooks/:id/unpublish
POST /admin/chapters
PATCH /admin/chapters/:id
PATCH /admin/chapters/:id/publish
PATCH /admin/chapters/:id/unpublish
```

`POST /admin/audiobooks` MAY accept nested initial chapters in the same request. When chapters are included, the backend should persist audiobook + chapters atomically so the create flow stays all-or-nothing.

### 6.8 Analytics

```text
POST /analytics/events
```

Payload có thể là một event đơn hoặc một batch event, ví dụ:

```json
{
  "events": [
    {
      "eventName": "app_opened",
      "sourcePlatform": "ios",
      "payload": {
        "screen": "home"
      }
    }
  ]
}
```

## 7. Request/response mẫu

### 7.1 Lưu progress

```json
POST /playback/progress
{
  "audiobookId": "ab_001",
  "chapterId": "ch_010",
  "positionMs": 53210,
  "completed": false
}
```

### 7.2 Tạo bookmark

```json
POST /bookmarks
{
  "audiobookId": "ab_001",
  "chapterId": "ch_010",
  "positionMs": 53210,
  "note": "Ý quan trọng về thói quen"
}
```

### 7.3 Tạo note

```json
POST /notes
{
  "audiobookId": "ab_001",
  "chapterId": "ch_010",
  "positionMs": 53210,
  "content": "Ý cần ghi nhớ"
}
```

### 7.4 Kiểm tra subscription

```text
GET /subscriptions/me
```

Response cần trả:
- plan hiện tại
- trạng thái `active` / `expired`
- quyền truy cập premium

Contract rule:
- `GET /subscriptions/plans` returns the selectable plan catalog for the paywall.
- `POST /subscriptions/checkout` only creates a payment attempt and returns the checkout/payment attempt payload.
- `POST /subscriptions/verify` accepts receipt/transaction payload and returns the receipt verification result plus the refreshed subscription detail for compatibility with the current mobile client.
- Verify payload should include at least `checkoutSessionId` or a receipt/transaction identifier when available.
- Verify is idempotent for the same receipt reference: replayed requests return the current entitlement state and do not re-grant an expired subscription.

## 8. Search DTO

### 8.1 Mục tiêu

Search API trong MVP phục vụ tìm audiobook theo title, author, narrator, tag và category, trả kết quả dạng audiobook-centric để đơn giản cho mobile app và dễ index trong Elasticsearch.

### 8.2 Request DTO

```ts
type SearchSortBy = 'RELEVANCE' | 'CREATED_AT' | 'POPULARITY';
type SearchSortOrder = 'ASC' | 'DESC';

interface SearchQueryDto {
  query: string;
  page?: number;
  pageSize?: number;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  narratorId?: string;
  premiumFlag?: boolean;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
}
```

### 8.3 Response DTO

```ts
interface SearchAudiobookHitDto {
  audiobookId: string;
  title: string;
  coverImageAssetKey?: string;
  authorName: string;
  narratorNames: string[];
  categoryNames: string[];
  tagNames: string[];
  premiumFlag: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  score?: number;
  highlight?: {
    title?: string;
    authorName?: string;
    narratorNames?: string[];
    tagNames?: string[];
  };
}

interface SearchResponseDto {
  data: SearchAudiobookHitDto[];
  meta: {
    query: string;
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    sortBy: SearchSortBy;
    sortOrder: SearchSortOrder;
  };
}
```

### 8.4 Query contract

- Search mặc định là full-text query trên `query`.
- Filter là optional, dùng để thu hẹp kết quả.
- Search trả kết quả audiobook-centric trong MVP.
- `highlight` chỉ là dữ liệu trình bày, không phải source of truth.
- `score` phục vụ ranking, không được dùng như logic nghiệp vụ.

### 8.5 Endpoint gợi ý

```text
GET /search?query=habit&page=1&pageSize=20&categoryId=cat_001&premiumFlag=true&sortBy=RELEVANCE&sortOrder=DESC
```

## 9. Subscription DTO

### 9.1 Kiểu dùng chung

```ts
type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'FAILED';

type BillingStatus = 'INITIATED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

type BillingProvider = 'IAP' | 'GOOGLE_PLAY' | 'WEB_GATEWAY';

type SubscriptionFlowState =
  | 'PAYWALL'
  | 'SELECT_PLAN'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'VERIFYING_ENTITLEMENT'
  | 'PENDING_VERIFICATION'
  | 'UNLOCKED';

type SubscriptionVerificationStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

type SubscriptionEntitlementStatus = 'LOCKED' | 'PENDING' | 'TRIAL' | 'ACTIVE' | 'EXPIRED';
```

### 9.2 DTO gói đăng ký

```ts
interface SubscriptionPlanDto {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

interface SubscriptionBillingDto {
  provider: BillingProvider;
  status: BillingStatus;
  reference?: string;
  checkoutSessionId?: string;
  lastBillingAt?: string;
  nextBillingAt?: string;
}

interface SubscriptionEntitlementDto {
  status: SubscriptionEntitlementStatus;
  canAccessPremium: boolean;
  isTrial?: boolean;
  expiresAt?: string;
  checkedAt?: string;
  source?: 'subscription' | 'receipt' | 'webhook';
}

interface SubscriptionDetailDto {
  id: string;
  status: SubscriptionStatus;
  flowState?: SubscriptionFlowState;
  plan: SubscriptionPlanDto;
  billing: SubscriptionBillingDto;
  entitlement: SubscriptionEntitlementDto;
  startAt: string;
  endAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionPaymentAttemptDto {
  paymentAttemptId: string;
  checkoutSessionId: string;
  plan: SubscriptionPlanDto;
  provider: BillingProvider;
  status: 'INITIATED' | 'PENDING' | 'REQUIRES_ACTION';
  flowState: 'PAYMENT_PROCESSING';
  redirectUrl?: string;
  expiresAt?: string;
  returnUrl?: string;
  trialRequested?: boolean;
}

interface SubscriptionReceiptVerificationDto {
  status: SubscriptionVerificationStatus;
  checkedAt?: string;
  entitlement?: SubscriptionEntitlementDto;
  subscription?: SubscriptionDetailDto | null;
  message?: string;
  nextPollAfterMs?: number;
}
```

### 9.3 Request cho checkout

```ts
interface SubscriptionCheckoutRequestDto {
  planId: string;
  provider: BillingProvider;
  returnUrl?: string;
  trialRequested?: boolean;
}
```

### 9.4 Response cho checkout

```ts
interface SubscriptionCheckoutResponseDto {
  paymentAttemptId: string;
  checkoutSessionId: string;
  plan: SubscriptionPlanDto;
  provider: BillingProvider;
  redirectUrl?: string;
  status: 'INITIATED' | 'PENDING' | 'REQUIRES_ACTION';
  flowState: 'PAYMENT_PROCESSING';
  expiresAt?: string;
  returnUrl?: string;
  trialRequested?: boolean;
}

interface SubscriptionPlanCatalogDto {
  data: SubscriptionPlanDto[];
}

interface SubscriptionVerifyRequestDto {
  provider?: BillingProvider;
  checkoutSessionId?: string;
  receiptToken?: string;
  transactionId?: string;
  orderId?: string;
  platform?: 'ios' | 'android' | 'web';
}

interface SubscriptionVerifyResponseDto extends SubscriptionReceiptVerificationDto {
  subscription?: SubscriptionDetailDto | null;
}
```

### 9.5 Webhook event

```ts
interface SubscriptionWebhookEventDto {
  provider: BillingProvider;
  eventType: 'SUBSCRIPTION_CREATED' | 'SUBSCRIPTION_RENEWED' | 'SUBSCRIPTION_CANCELLED' | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED';
  billingReference: string;
  subscriptionId?: string;
  checkoutSessionId?: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}
```

### 9.6 Quy tắc DTO

- `Subscription.entitlement.status` phản ánh trạng thái truy cập premium của user.
- `billing.status` phản ánh trạng thái thanh toán/provider.
- `billingReference` và `checkoutSessionId` là định danh đối soát, không phải khóa truy cập nội dung.
- Webhook phải xử lý idempotent.
- Client đọc `SubscriptionDetailDto` trong `GET /subscriptions/me` hoặc `subscription` nested trong verify response, không tự suy luận entitlement từ billing state.

## 10. Audiobook detail response

Audiobook detail nên trả về danh sách narrator voice thay vì một `narratorId` đơn.

```json
{
  "data": {
    "id": "ab_001",
    "title": "Clean Architecture",
    "description": "....",
    "coverImageAssetKey": "cover_ab_001",
    "author": {
      "id": "au_001",
      "name": "Robert C. Martin"
    },
    "narrators": [
      {
        "id": "nr_001",
        "name": "Giọng chính",
        "roleIndex": 1,
        "isPrimary": true
      },
      {
        "id": "nr_002",
        "name": "Giọng phụ",
        "roleIndex": 2,
        "isPrimary": false
      },
      {
        "id": "nr_003",
        "name": "Giọng học tập",
        "roleIndex": 3,
        "isPrimary": false
      }
    ]
  }
}
```

## 11. Asset access DTO

### 11.1 Mục tiêu

Chuẩn hóa contract để backend có thể resolve truy cập media động theo `CDN`, `S3` hoặc `localfile` mà client không cần biết backend lưu trữ thực tế là gì.

### 11.2 Enum và kiểu dùng chung

```ts
type AssetKind = 'AUDIO' | 'COVER_IMAGE' | 'AVATAR' | 'TRANSCRIPT';

type AssetProvider = 'CDN' | 'S3' | 'LOCALFILE';

type AssetPurpose = 'STREAM' | 'DOWNLOAD' | 'THUMBNAIL' | 'PREVIEW';
```

### 11.3 Input DTO

```ts
interface GetAssetAccessDto {
  assetKey: string;
  kind: AssetKind;
  purpose: AssetPurpose;
  offlineCapable?: boolean;
}
```

### 11.4 Output DTO

```ts
interface AssetAccessDto {
  kind: AssetKind;
  provider: AssetProvider;
  url: string;
  expiresAt: string;
  streamable: boolean;
  offlineCapable: boolean;
  headers?: Record<string, string>;
  cacheControl?: string;
}
```

### 11.5 Endpoint gợi ý

```text
POST /assets/access
```

Request:

```json
{
  "assetKey": "chapter_audio_ab_001_ch_010",
  "kind": "AUDIO",
  "purpose": "STREAM",
  "offlineCapable": true
}
```

Response:

```json
{
  "data": {
    "kind": "AUDIO",
    "provider": "CDN",
    "url": "https://cdn.example.com/....",
    "expiresAt": "2026-05-11T12:30:00Z",
    "streamable": true,
    "offlineCapable": true,
    "headers": {
      "Range": "bytes=0-"
    },
    "cacheControl": "private, max-age=300"
  }
}
```

### 11.6 Quy tắc contract

- Client chỉ nhận URL đã resolve từ backend.
- `assetKey` là định danh duy nhất ở tầng dữ liệu, không phải URL.
- `provider` là thông tin mô tả để debug / telemetry, không phải để client tự suy luận logic.
- `expiresAt` là bắt buộc với URL tạm thời.
- `headers` chỉ xuất hiện khi backend cần hướng dẫn client cách fetch asset.

## 13. Quy tắc cho admin API

- Mọi endpoint `/admin/*` yêu cầu role admin.
- Tạo và sửa nội dung phải validate đầy đủ metadata.
- Publish / unpublish phải tạo audit log.
- MVP hiện tại ưu tiên `assetKey` / asset picker cho metadata; nếu sau này có upload service riêng thì tách flow đó thành contract khác, không trộn vào admin metadata CRUD.

## 14. Quy tắc cho analytics API

- Event tracking phải nhẹ và không block luồng nghe.
- Có thể batch events khi app offline hoặc mạng yếu.
- Event tối thiểu nên có:
  - `eventName`
  - `userId`
  - `timestamp`
  - `payload`
- Không ghi dữ liệu nhạy cảm không cần thiết vào payload.

## 15. Versioning

- Dùng prefix version khi cần: `/v1/...`
- Không phá backward compatibility nếu chưa có kế hoạch migration rõ ràng.

## 16. Verification checklist

- [ ] Mỗi endpoint có input và output schema rõ ràng
- [ ] Error response dùng một format thống nhất
- [ ] Validation xảy ra ở biên hệ thống
- [ ] List endpoint có pagination
- [ ] Field mới được thêm theo hướng additive và optional
- [ ] Naming nhất quán giữa các endpoint
- [ ] Tài liệu API hoặc type contract được commit cùng implementation

## 17. Câu hỏi mở

1. API sẽ dùng cookie session hay bearer token cho mobile?
2. Có cần webhook billing ngay từ MVP không?
3. Có cần synonym, typo tolerance và boosting theo popularity cho search phase 1 không?
4. Admin API có cần bulk import content không?
