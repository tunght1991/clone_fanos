# Kiến Trúc Hệ Thống: Nền Tảng Audiobook / Audio Learning

## 1. Mục tiêu kiến trúc

Thiết kế hệ thống để:
- Hỗ trợ trải nghiệm nghe audio mượt trên mobile-first.
- Tách rõ user app, admin CMS và backend API.
- Dễ mở rộng theo module mà không tạo phụ thuộc chéo khó kiểm soát.
- Bảo vệ audio asset, subscription entitlement và dữ liệu người dùng.
- Đủ đơn giản để triển khai MVP, nhưng không khóa đường mở rộng về sau.

## 2. Nguyên tắc kiến trúc

Hệ thống nên tuân theo các nguyên tắc sau:
- Modular monolith first, chỉ tách service khi có tín hiệu rõ ràng về scale hoặc tổ chức.
- Clean Architecture với ranh giới rõ giữa domain, application và infrastructure.
- Domain-driven boundaries cho các miền nghiệp vụ độc lập.
- Repository pattern cho truy cập dữ liệu.
- Service layer chứa business logic, controller chỉ xử lý request/response.
- Contract-first cho API và interface giữa module.
- Chỉ cho phép thay đổi theo hướng bổ sung, tránh phá vỡ backward compatibility.
- Không trộn logic admin với logic user-facing.
- Không expose raw storage URL cho audio và media nhạy cảm.

## 3. Kiến trúc tổng thể

### 3.1 Các thành phần chính

| Thành phần | Công nghệ khuyến nghị | Vai trò |
|---|---|---|
| Mobile app | Flutter | Browse, nghe audio, bookmark, favorite, subscription flow |
| Admin CMS | Web app | Tạo và quản lý audiobook, chapter, author, category, publish/unpublish |
| Backend API | NestJS + TypeScript | Auth, content, playback, subscription, search, analytics |
| PostgreSQL | PostgreSQL | Lưu metadata, user progress, bookmark, subscription, audit cơ bản |
| Redis | Redis | Cache, rate limiting, session/token support, transient state |
| Object storage | S3-compatible storage | Lưu audio files, cover images, transcript assets |
| CDN | CloudFront hoặc tương đương | Phân phối streaming và media tĩnh qua signed URL |
| Search engine | Elasticsearch | Tìm kiếm audiobook, author, category, tag |
| Payment provider | App Store / Google Play / web gateway | Xác thực thanh toán và renewal cho subscription |

### 3.2 Luồng dữ liệu cơ bản

1. Admin tạo nội dung và gán assetKey/metadata lên backend.
2. Backend lưu metadata vào PostgreSQL, file media vào object storage.
3. Backend phát hành signed URL hoặc token truy cập ngắn hạn cho CDN.
4. Mobile app lấy metadata từ API và stream audio từ CDN.
5. Playback progress, bookmark, favorite và note được ghi về backend.
6. Search index được đồng bộ từ dữ liệu nội dung đã publish.
7. Analytics events được ghi nhận riêng, không chặn luồng nghe chính.

### 3.3 Mô hình phụ thuộc

- Mobile app và admin CMS chỉ giao tiếp với backend qua API công khai.
- Backend không phụ thuộc trực tiếp vào UI.
- Các module nghiệp vụ chỉ gọi qua interface của module khác, không gọi thẳng vào lớp persistence.
- External systems như payment provider, CDN, search engine phải được bọc qua adapter để dễ thay thế.

### 3.4 Chiến lược truy cập asset

Hệ thống cần một lớp trừu tượng để phát hành URL truy cập media theo môi trường và backend lưu trữ:

- `CDN`: trả về signed URL hoặc signed manifest URL cho streaming production.
- `S3`: trả về pre-signed URL khi cần truy cập trực tiếp, hoặc URL qua CDN nếu đã bật phân phối.
- `localfile`: dùng cho local development, test fixture hoặc môi trường self-hosted; URL có thể là local dev endpoint hoặc file proxy nội bộ, không nên phụ thuộc trong app production.

Quy ước:

- Domain không lưu raw URL cố định như nguồn sự thật.
- Chỉ lưu `assetKey` / `storageRef` và metadata cần thiết.
- Backend expose một contract truy cập thống nhất, ví dụ `AssetAccess`:
  - `kind`
  - `url`
  - `expiresAt`
  - `headers?`
  - `streamable`
  - `offlineCapable`

Adapter chịu trách nhiệm quyết định cách sinh URL theo provider hiện tại, để sau này chuyển giữa CDN, S3 hoặc localfile không phải đổi contract phía client.

## 4. Bounded context / module

### 4.1 Danh sách module

- Auth
- User
- Audiobook
- Chapter
- Playback
- Subscription
- Bookmark
- Note
- Favorite
- Search
- Notification
- Admin CMS
- Analytics

### 4.2 Trách nhiệm từng module

| Module | Trách nhiệm |
|---|---|
| Auth | Đăng ký, đăng nhập, refresh token, logout, phân quyền cơ bản |
| User | Hồ sơ người dùng, preferences, trạng thái tài khoản |
| Audiobook | Metadata audiobook, trạng thái publish, category, tag, author, 3 narrator voices |
| Chapter | Quản lý chapter, thứ tự, duration, transcript, asset reference |
| Playback | Progress, resume listening, state nghe hiện tại, xử lý đồng bộ tiến độ |
| Subscription | Plan, entitlement, trạng thái subscription, provider billing, webhook, đối soát giao dịch, idempotency, kiểm tra quyền truy cập premium |
| Bookmark | Bookmark theo timestamp, danh sách bookmark, ghi chú ngắn |
| Note | Ghi chú học tập, liên kết với chapter hoặc timestamp |
| Favorite | Danh sách audiobook yêu thích |
| Search | Elasticsearch indexing, query, ranking cơ bản, filtering |
| Notification | Push / in-app notification cho nội dung và hành vi |
| Admin CMS | Quản trị nội dung, publication workflow, audit action |
| Analytics | Thu thập event, batch ingest, reporting cơ bản |

### 4.3 Quy tắc ranh giới

- `Audiobook` sở hữu metadata cấp cao của nội dung và danh sách narrator voice.
- `Chapter` sở hữu file audio, thứ tự phát và transcript.
- `Playback` chỉ lưu trạng thái nghe, không chứa logic entitlement.
- `Subscription` quyết định user có quyền nghe premium hay không.
- `Admin CMS` không dùng chung flow với user-facing logic, dù có thể dùng chung backend.

### 4.4 Quy ước narrator 3 giọng

- Một audiobook có tối đa 3 narrator voice.
- Mỗi narrator voice có thể được dùng cho một vai trò đọc khác nhau, ví dụ narrator chính, narrator phụ, hoặc giọng học tập.
- Thứ tự hiển thị và lựa chọn phải dựa trên `roleIndex` từ 1 đến 3.
- Nếu audiobook chỉ cần một giọng đọc, vẫn giữ cấu trúc danh sách để không phải đổi contract sau này.

### 4.5 Search index schema

Elasticsearch index nên được thiết kế theo hướng audiobook-centric cho MVP, với document gom đủ dữ liệu để query và highlight:

```text
SearchDocument
- audiobookId
- title
- description
- authorId
- authorName
- narratorIds[]
- narratorNames[]
- categoryIds[]
- categoryNames[]
- tagIds[]
- tagNames[]
- coverImageAssetKey
- premiumFlag
- status
- publishedAt
- popularityScore
- languageCode
- searchableText
- createdAt
- updatedAt
```

Quy tắc:
- Chỉ index audiobook đã publish.
- `searchableText` là field tổng hợp để full-text query.
- `popularityScore` phục vụ ranking, có thể cập nhật theo analytics hoặc play count.
- `highlight` và ranking là lớp search presentation, không phải source of truth.

### 4.6 Elasticsearch index mapping và migration

#### Index naming

- Physical index: `audiobooks_v1`
- Read alias: `audiobooks_read`
- Write alias: `audiobooks_write`

Nguyên tắc:
- Application đọc qua read alias.
- Application ghi qua write alias.
- Khi thay đổi mapping, tạo index version mới rồi swap alias.

#### Mapping đề xuất

```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "search_text_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        },
        "autocomplete_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding", "autocomplete_filter"]
        }
      },
      "filter": {
        "autocomplete_filter": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 20
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "audiobookId": { "type": "keyword" },
      "title": {
        "type": "text",
        "analyzer": "autocomplete_analyzer",
        "search_analyzer": "search_text_analyzer",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "search_text_analyzer"
      },
      "authorId": { "type": "keyword" },
      "authorName": {
        "type": "text",
        "analyzer": "autocomplete_analyzer",
        "search_analyzer": "search_text_analyzer",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "narratorIds": { "type": "keyword" },
      "narratorNames": {
        "type": "text",
        "analyzer": "autocomplete_analyzer",
        "search_analyzer": "search_text_analyzer",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "categoryIds": { "type": "keyword" },
      "categoryNames": {
        "type": "text",
        "analyzer": "search_text_analyzer",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "tagIds": { "type": "keyword" },
      "tagNames": {
        "type": "text",
        "analyzer": "search_text_analyzer",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "coverImageAssetKey": { "type": "keyword" },
      "premiumFlag": { "type": "boolean" },
      "status": { "type": "keyword" },
      "publishedAt": { "type": "date" },
      "popularityScore": { "type": "float" },
      "languageCode": { "type": "keyword" },
      "searchableText": {
        "type": "text",
        "analyzer": "search_text_analyzer"
      },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  }
}
```

#### Reindex / migration strategy

1. Tạo index version mới, ví dụ `audiobooks_v2`.
2. Nạp mapping/settings trước khi đẩy data.
3. Bulk reindex từ nguồn dữ liệu chuẩn trong PostgreSQL.
4. Chạy verification: số lượng document, sample query, highlight, filter, sort.
5. Swap alias `audiobooks_read` và `audiobooks_write` sang index mới.
6. Giữ index cũ một thời gian để rollback nếu cần.

#### Quy tắc đồng bộ

- Chỉ đồng bộ audiobook `published`.
- Update index phải idempotent theo `audiobookId`.
- Khi thay đổi metadata của audiobook/chapter/author/narrator/category/tag, enqueue reindex document tương ứng.
- `searchableText` nên được build từ các field có ích cho query: title, authorName, narratorNames, categoryNames, tagNames, description.
- `popularityScore` cập nhật async, không block luồng ghi nội dung.

## 5. Interface contracts

### 5.1 Quy ước API

- REST là mặc định cho MVP.
- URL dùng danh từ số nhiều, không dùng động từ.
- Request/response phải có DTO rõ ràng.
- Danh sách phải có pagination.
- Validation thực hiện ở biên hệ thống.
- Error response dùng một format thống nhất.

### 5.2 Chuẩn response

```json
{
  "data": {},
  "meta": {}
}
```

### 5.3 Chuẩn lỗi

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": {}
  }
}
```

### 5.4 Nhóm API chính

- `/auth`
- `/users`
- `/audiobooks`
- `/chapters`
- `/playback`
- `/bookmarks`
- `/favorites`
- `/subscriptions`
- `/search`
- `/admin/*`
- `/analytics`

### 5.5 Quy tắc contract

- Input và output phải tách biệt.
- Thay đổi mới nên là additive, ưu tiên field optional.
- Enum và trạng thái phải được định nghĩa tập trung.
- Các API list phải hỗ trợ `page`/`limit` hoặc cursor nhất quán.
- Endpoint liên quan đến progress, analytics hoặc sync nên idempotent nếu có thể.

## 6. Tổ chức dữ liệu

### 6.1 Nhóm dữ liệu lõi

- Nội dung: audiobook, chapter, author, narrator, category, tag, publisher.
- Hành vi người dùng: user progress, bookmark, note, favorite.
- Kinh doanh: subscription plan, subscription, payment record.
- Vận hành: analytics event, audit log, notification log.

### 6.2 Quy ước lưu trữ

- Metadata nghiệp vụ lưu trong PostgreSQL.
- File media lưu trong object storage private.
- Index tìm kiếm đồng bộ sang search engine.
- Cache ngắn hạn và rate limit lưu trong Redis.
- Signed URL phải có thời hạn ngắn, không lưu public bucket URL trong API.

### 6.3 Nguyên tắc dữ liệu

- `positionMs` không được âm.
- `orderIndex` của chapter phải duy nhất trong phạm vi một audiobook.
- `premiumFlag` chỉ là cờ nội dung, không thay thế entitlement từ subscription.
- Bookmark và progress phải gắn với user và chapter rõ ràng.
- Tất cả dữ liệu từ bên ngoài hệ thống phải được coi là không tin cậy cho đến khi validate.

## 7. Bảo mật và quyền truy cập

### 7.1 Bảo vệ nội dung

- Audio file lưu trong bucket private.
- CDN chỉ phát hành qua signed URL hoặc cơ chế tương đương.
- Không expose raw storage URL công khai.
- Có thể thêm watermark hoặc DRM nhẹ ở phase sau nếu cần.

### 7.2 Xác thực và phân quyền

- User auth và admin auth phải tách scope.
- Admin phải có RBAC riêng.
- Entitlement premium luôn được kiểm tra ở backend.
- Không tin vào xác nhận thanh toán từ client.

### 7.3 Chống lạm dụng

- Rate limit các endpoint nhạy cảm như login, refresh, search, analytics, admin publish.
- Validate kích thước và content type khi upload media.
- Thêm audit log cho hành động admin quan trọng.

## 8. Hiệu năng và độ tin cậy

### 8.1 Mục tiêu phi chức năng

- Start playback dưới 2 giây khi mạng tốt.
- Resume nhanh khi đã có progress local hoặc server.
- Search phản hồi đủ nhanh để không làm gián đoạn discovery.
- Không mất progress nếu app bị đóng đột ngột.
- Hỗ trợ offline playback để phase sau, không nằm trong MVP hiện tại.
- Analytics thất bại không được block luồng nghe.

### 8.2 Cơ chế tin cậy

- Playback progress nên có retry và debounce hợp lý.
- Webhook payment phải idempotent.
- Sync các event không quan trọng theo batch nếu mạng yếu.
- Các thao tác đọc nội dung phải ưu tiên cache và CDN.

## 9. Observability

- Log request và error theo trace id.
- Theo dõi latency API, playback start time, payment failure, subscription failure.
- Audit log cho hành động admin: publish, unpublish, sửa metadata, upload, delete.
- Phân tách operational log và product analytics nếu có thể.

## 10. Triển khai

### 10.1 Môi trường

- Local
- Staging
- Production

### 10.2 Gợi ý hạ tầng

- Backend container hóa bằng Docker.
- PostgreSQL và Redis tách service.
- Storage và CDN dùng managed service.
- Elasticsearch chạy riêng.
- Mobile app và admin cùng dùng một backend API, nhưng tách client.

### 10.3 Cách mở rộng

- Giữ modular monolith cho MVP.
- Tách service chỉ khi module có tải cao hoặc vòng đời riêng rõ ràng, ví dụ analytics ingest, search indexing.
- Duy trì shared contracts để tránh drift giữa các client.

## 11. Cấu trúc dự án gợi ý

```text
apps/
  mobile/
  admin/
  api/

packages/
  shared/
  config/
  ui/

infra/
  docker/
  migrations/

docs/
  prd.md
  spec.md
  architecture.md
  data-model.md
  api-design.md
  security.md
```

## 12. Phụ thuộc tài liệu

- [docs/data-model.md](data-model.md)
- [docs/api-design.md](api-design.md)
- [docs/security.md](security.md)

Các tài liệu này nên được cập nhật đồng bộ khi thay đổi kiến trúc để tránh lệch contract giữa dữ liệu, API và bảo mật.

## 13. Câu hỏi mở

1. Offline download sẽ được ưu tiên ở phase sau hay chưa cần chốt ngay trong MVP?
2. Search engine phase đầu dùng Elasticsearch như đã chốt.
3. Subscription verification nên đồng bộ bằng webhook hay kết hợp polling?
4. Transcript nên lưu trong database hay object storage?
5. Có cần job worker ngay từ MVP cho analytics, search indexing và sync không?
