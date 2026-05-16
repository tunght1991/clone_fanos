# Spec: Nền Tảng Audiobook / Audio Learning

## 1. Business Objective

Xây dựng một nền tảng audiobook và audio learning dành cho người đi làm, tập trung vào trải nghiệm nghe mượt, nội dung chọn lọc và thói quen học tập bền vững.

Định vị sản phẩm:

> Spotify cho Knowledge Workers

### Mục tiêu kinh doanh

- Tăng thời lượng nghe và tần suất quay lại hàng ngày.
- Chuyển đổi người dùng miễn phí sang thuê bao trả phí.
- Quản lý và mở rộng thư viện nội dung hiệu quả.
- Hỗ trợ trải nghiệm học tập có chiều sâu, không chỉ nghe giải trí.

### Chỉ số thành công chính

- DAU / MAU tăng ổn định
- Day 1, Day 7, Day 30 retention đạt mục tiêu
- Average listening time tăng theo cohort
- Free-to-paid conversion tăng
- Churn giảm
- Completion rate theo audiobook tăng

## 2. User Persona

### Persona 1: Nhân viên văn phòng

- Muốn nghe khi đi làm, tập gym hoặc trước khi ngủ.
- Cần nội dung cô đọng, dễ tiếp cận.
- Quan tâm đến phát triển bản thân, quản trị công việc và tài chính cá nhân.

### Persona 2: Nhân sự IT / kỹ thuật

- Ưa thích nội dung về system design, clean architecture, tư duy sản phẩm và kỹ năng nghề nghiệp.
- Muốn học khi di chuyển hoặc trong thời gian nghỉ ngắn.

### Persona 3: Người học tiếng Nhật / ngoại ngữ

- Cần transcript, tốc độ phát phù hợp và khả năng lặp lại đoạn nghe.
- Ưu tiên nội dung song ngữ hoặc có hỗ trợ học tập.

### Persona 4: Người dùng self-development

- Cần hình thành thói quen học mỗi ngày.
- Quan tâm đến bookmark, note, tóm tắt và tiến độ nghe.

## 3. Problem Statement

Người dùng muốn học qua audio nhưng thường gặp các vấn đề sau:

- Tìm nội dung tốt mất thời gian.
- Ứng dụng nghe hiện tại thiếu cá nhân hóa cho mục tiêu học tập.
- Trải nghiệm nghe bị gián đoạn, khó resume, khó quản lý bookmark.
- Offline, tốc độ phát và thanh toán chưa đủ mượt.
- Admin khó quản lý nội dung lớn theo cách chuẩn hóa.

Sản phẩm cần giải quyết hai bài toán chính:

- Giúp người dùng nghe dễ hơn, nghe lại nhanh hơn và quay lại thường xuyên hơn.
- Giúp đội vận hành nội dung xuất bản nhanh, đúng chuẩn và dễ mở rộng.

## 4. Scope

### 4.1 MVP User App

- Đăng ký / đăng nhập
- Duyệt audiobook theo danh mục
- Tìm kiếm nội dung
- Xem chi tiết audiobook
- Audio player
- Điều chỉnh tốc độ phát
- Resume từ vị trí nghe gần nhất
- Tạo favorite
- Đánh dấu bookmark theo timestamp
- Kiểm tra trạng thái subscription
- Streaming audio qua signed asset access URL

### 4.2 MVP Admin CMS

- Tạo và cập nhật audiobook
- Tạo và quản lý chapter
- Quản lý author, narrator, category, tag
- Publish / unpublish nội dung
- Quản lý audio asset và metadata

### 4.3 MVP Backend

- Auth API
- Audiobook API
- Playback progress API
- Asset access API
- Bookmark API
- Subscription API
- Admin API

### 4.4 Analytics MVP

- `app_opened`
- `audiobook_viewed`
- `chapter_started`
- `chapter_completed`
- `playback_paused`
- `playback_resumed`
- `bookmark_created`
- `favorite_created`
- `subscription_started`
- `subscription_cancelled`

### 4.5 Out of Scope cho MVP

- AI summary / chatbot nội dung
- Recommendation ML phức tạp
- Community / social features
- Creator marketplace
- Podcast platform đa định dạng

## 5. Functional Requirements

### 5.1 Authentication

- Người dùng có thể đăng ký và đăng nhập bằng email và mật khẩu.
- Hệ thống duy trì phiên đăng nhập an toàn.
- Người dùng có thể đăng xuất.
- Hỗ trợ phân quyền tối thiểu: user, admin.

### 5.2 Browse and Discovery

- Danh sách audiobook theo category.
- Danh sách audiobook mới, nổi bật, đang nghe tiếp.
- Trang chi tiết audiobook hiển thị:
  - title
  - description
  - cover image
  - author
  - narrator
  - duration
  - categories
  - tags
  - premium flag
  - status

### 5.3 Search

- Tìm kiếm theo title, author, narrator, tag.
- Kết quả trả về nhanh và có phân trang.
- Hỗ trợ lọc cơ bản theo category và premium status.
- Contract query nên rõ ràng với `page`, `pageSize`, `categoryId`, `premiumFlag`, `sortBy`, `sortOrder`.

### 5.4 Audio Player

- Play / pause
- Seek forward / backward
- Playback speed
- Sleep timer
- Background playback
- Lock screen control
- Resume from last position
- Streaming từ CDN
- Resolve asset access qua backend trước khi play
- Offline playback để phase sau, không tính vào MVP

### 5.5 Playback Progress

- Lưu vị trí nghe theo user, audiobook, chapter.
- Đồng bộ tiến độ khi mở lại app.
- Ghi nhận hoàn thành chapter.

### 5.6 Bookmark and Favorite

- Người dùng có thể tạo bookmark theo thời điểm trong chapter.
- Người dùng có thể đánh dấu favorite cho audiobook.
- Xem lại danh sách bookmark / favorite trong profile.

### 5.7 Subscription

- Hệ thống phân biệt user free và premium.
- Kiểm tra quyền truy cập theo gói đăng ký.
- Hỗ trợ tích hợp App Store IAP, Google Play Billing, và web billing nếu cần.

### 5.8 Admin CMS

- Bind cover/chapter asset keys via asset picker.
- Tạo audiobook mới.
- Tạo chapter theo thứ tự.
- Gán author, narrator, category, tag.
- Publish / unpublish audiobook.
- Theo dõi trạng thái nội dung.

## 6. Non-functional Requirements

### 6.1 Performance

- Mở player và bắt đầu phát trong dưới 2 giây trong điều kiện mạng tốt.
- Resume playback nhanh, ưu tiên dưới 1 giây khi dữ liệu đã có sẵn.
- Tìm kiếm trả kết quả nhanh với dữ liệu đã index.

### 6.2 Reliability

- Phát audio ổn định khi mạng yếu.
- Có cơ chế retry và xử lý lỗi khi CDN hoặc storage tạm thời không phản hồi.
- Không làm mất tiến độ nghe khi app bị đóng đột ngột.

### 6.3 Security

- Dùng signed URL cho file audio.
- Link tải audio có thời gian hết hạn.
- Phân quyền admin riêng biệt.
- Input validation ở mọi API.
- Refresh token phải được bảo vệ an toàn.

### 6.4 Scalability

- Kiến trúc đủ để mở rộng thư viện nội dung, số lượng user và các module sau này.
- Tách rõ domain user-facing và admin-facing.

### 6.5 UX

- Tối ưu cho mobile first.
- Ít thao tác để resume nghe, đổi tốc độ và bookmark.
- Giao diện calm, minimal, premium, learning-focused.

## 7. User Stories

- As a user, I want to browse audiobook by category, so that I can quickly find something relevant.
- As a user, I want to search audiobook by title or author, so that I can find content without manual browsing.
- As a user, I want to resume listening from my last position, so that I do not lose progress.
- As a user, I want to change playback speed, so that I can listen at my preferred pace.
- As a user, I want to create bookmarks at specific timestamps, so that I can return to important parts later.
- As a user, I want to see whether content is premium, so that I know what I can access.
- As an admin, I want to create audiobooks and chapters and bind asset keys, so that I can manage the content library.
- As an admin, I want to publish or unpublish content, so that I can control what is visible to users.

## 8. Acceptance Criteria

### 8.1 User App

- Người dùng mới có thể đăng ký và đăng nhập thành công.
- Người dùng có thể mở chi tiết audiobook và bắt đầu nghe.
- Người dùng có thể pause, seek, đổi tốc độ phát.
- Người dùng có thể rời app và quay lại để resume đúng vị trí đã nghe.
- Người dùng có thể tạo bookmark tại một timestamp cụ thể.
- Người dùng free không truy cập được nội dung premium nếu chưa đủ quyền.

### 8.2 Admin CMS

- Admin có thể tạo audiobook mới với metadata đầy đủ.
- Admin có thể gán chapter audio asset key và sắp xếp đúng thứ tự.
- Admin có thể publish / unpublish nội dung.
- Nội dung đã publish xuất hiện trong app user sau khi index / sync hoàn tất.

### 8.3 Backend

- API phản hồi có validation rõ ràng và lỗi nhất quán.
- Playback progress được lưu và đọc lại chính xác.
- Subscription status có thể được kiểm tra từ app user.
- Asset access trả về signed URL / URL có hạn dùng thay vì raw storage URL.
- Audio URL không bị expose dạng raw public storage URL.

### 8.4 Analytics

- Các event chính được bắn đúng khi user thao tác.
- Có thể đo được listening time, completion rate và retention cơ bản.

## 9. Data Tracking

### Event tối thiểu

- `app_opened`
- `audiobook_viewed`
- `chapter_started`
- `chapter_completed`
- `playback_paused`
- `playback_resumed`
- `bookmark_created`
- `favorite_created`
- `subscription_started`
- `subscription_cancelled`

### Thuộc tính nên ghi nhận

- `user_id`
- `audiobook_id`
- `chapter_id`
- `plan_type`
- `playback_position`
- `playback_speed`
- `source_screen`
- `device_platform`

### Chỉ số phân tích

- DAU / MAU
- Average listening time
- Day 1 / Day 7 / Day 30 retention
- Free-to-paid conversion
- Churn rate
- Completion rate per audiobook

## 10. Tech Stack

### Mobile App

- Flutter

### Backend

- Node.js
- NestJS
- TypeScript

### Database

- PostgreSQL

### Cache

- Redis

### Search

- Elasticsearch

### Storage

- S3-compatible object storage

### CDN

- CloudFront hoặc tương đương

### Subscription Billing

- App Store In-App Purchase
- Google Play Billing
- Web billing gateway nếu cần

## 11. Commands

### Mobile

- Dev: `flutter run`
- Test: `flutter test`
- Build Android: `flutter build apk`
- Build iOS: `flutter build ios`

### Backend

- Dev: `pnpm --dir apps/api dev`
- Test: `pnpm --dir apps/api test`
- Lint: `pnpm --dir apps/api lint`
- Build: `pnpm --dir apps/api build`

### Admin CMS

- Dev: `pnpm --dir apps/admin dev`
- Test: `pnpm --dir apps/admin test`
- Build: `pnpm --dir apps/admin build`

### Root workspace

- Install: `pnpm install`
- Test all: `pnpm test`
- Lint all: `pnpm lint`
- Build all: `pnpm build`

## 12. Project Structure

```text
docs/
  spec.md

apps/
  mobile/
  admin/
  api/

packages/
  shared/
  ui/
  config/

infra/
  docker/
  migrations/

tests/
  integration/
  e2e/
```

Nguyên tắc tổ chức:
- Domain tách theo module, không gom business logic vào controller.
- Tài nguyên admin và user-facing tách riêng.
- DTO, validation và shared types đặt ở package dùng chung.

## 13. Code Style

### Nguyên tắc

- Tên biến, hàm, module phải theo ngữ nghĩa domain.
- Controller chỉ xử lý request/response, không chứa business logic nặng.
- Business logic nằm trong service layer.
- Data access đi qua repository.
- DTO phải validate rõ ràng.

### Ví dụ style backend

```ts
// apps/api/src/modules/playback/playback.service.ts
export class PlaybackService {
  constructor(private readonly playbackRepository: PlaybackRepository) {}

  async saveProgress(input: SavePlaybackProgressInput): Promise<void> {
    const progress = {
      userId: input.userId,
      audiobookId: input.audiobookId,
      chapterId: input.chapterId,
      positionMs: Math.max(0, input.positionMs),
      updatedAt: new Date(),
    };

    await this.playbackRepository.upsert(progress);
  }
}
```

### Quy ước đặt tên

- Service: `PlaybackService`, `SubscriptionService`
- DTO: `SavePlaybackProgressDto`
- Repository: `PlaybackRepository`
- Event: `chapterCompleted`

## 14. Testing Strategy

### Backend

- Unit test cho service, repository mock và validation logic
- Integration test cho API và persistence
- E2E test cho flow chính: auth, browse, player progress, subscription

### Mobile

- Widget test cho màn hình chính
- Integration test cho luồng nghe, resume, bookmark

### Admin CMS

- Component test cho form và bảng dữ liệu
- E2E test cho create / publish / unpublish content

### Mục tiêu coverage

- Core service layer: tối thiểu 80%
- Luồng nghiệp vụ quan trọng: bắt buộc có test
- Không cho phép merge nếu fail test chính

### Vị trí test

- Unit: gần code, theo module
- Integration: `tests/integration`
- E2E: `tests/e2e`

## 15. Boundaries

### Always

- Validate input ở API và form.
- Run test trước khi merge.
- Giữ logic nghiệp vụ trong service layer.
- Ghi nhận event analytics tối thiểu cho các hành động chính.
- Dùng signed URL cho audio.

### Ask first

- Thay đổi schema database.
- Thêm dependency mới.
- Thay đổi chiến lược billing.
- Thay đổi cấu trúc module lớn.
- Mở rộng scope sang AI hoặc recommendation nâng cao.

### Never

- Commit secrets hoặc raw private keys.
- Expose raw audio storage URL công khai.
- Xóa test failing để "cho qua".
- Nhét business logic vào controller hoặc UI layer.
- Trộn logic admin và user-facing vào cùng một module.

## 16. Risks

### Risk 1: Content licensing chi phí cao

- Ảnh hưởng: chậm mở rộng thư viện.
- Giảm thiểu: ưu tiên niche nội dung trước, đàm phán theo gói.

### Risk 2: Retention thấp nếu content không đủ tốt

- Ảnh hưởng: người dùng rời sớm.
- Giảm thiểu: chọn niche rõ, tối ưu onboarding và continue listening.

### Risk 3: Audio playback kém trên mạng yếu

- Ảnh hưởng: trải nghiệm xấu, tăng churn.
- Giảm thiểu: adaptive streaming, cache tốt, retry và resume robust.

### Risk 4: Admin vận hành nội dung rối

- Ảnh hưởng: xuất bản chậm, lỗi metadata.
- Giảm thiểu: chuẩn hóa schema nội dung và workflow publish.

## 17. Success Criteria

Spec này được xem là đạt khi:

- Có thể triển khai MVP user app với luồng nghe chính.
- Có thể quản lý audiobook và chapter từ admin CMS.
- Có thể lưu và khôi phục playback progress chính xác.
- Có thể phân biệt free và premium theo subscription.
- Có event tracking tối thiểu cho funnel và retention.
- Có bộ test cơ bản cho các luồng nghiệp vụ chính.
- Có kiến trúc đủ rõ để bắt đầu implementation mà không phải đoán lại yêu cầu.

## 18. Open Questions

1. Mô hình khởi đầu là pure mobile app hay cần thêm web app ngay từ đầu?
2. Subscription sẽ ưu tiên App Store / Google Play trước hay có web billing song song?
3. Offline playback sẽ được ưu tiên ở phase sau sau khi asset access ổn định không?
4. Nội dung ban đầu tập trung vào niche nào: business, IT, Japanese, hay self-development?
5. Có cần transcript cho mọi chapter trong MVP không?
6. Có cần social login ngay từ đầu không?
7. Admin CMS sẽ là web app riêng hay ghép chung với backend dashboard?
8. Có cần multi-tenant cho B2B ngay trong phase đầu không?
