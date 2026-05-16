# PRD/BA: Nền Tảng Audiobook / Audio Learning Kiểu Fonos

## 1. Business Objective

Xây dựng một nền tảng audiobook và audio learning cho nhóm người đi làm, tối ưu cho thói quen nghe hằng ngày, cá nhân hóa nội dung theo nhu cầu học tập, và hỗ trợ mô hình subscription bền vững.

### Mục tiêu kinh doanh
- Tăng thời lượng nghe trung bình và tần suất quay lại
- Tăng chuyển đổi từ user free sang premium
- Giảm churn bằng trải nghiệm nghe mượt và nội dung chất lượng
- Tạo nền tảng quản trị nội dung dễ mở rộng

### Định vị sản phẩm
> Spotify cho Knowledge Workers

### Chỉ số thành công
- DAU/MAU tăng theo cohort
- Day 1, Day 7, Day 30 retention đạt mục tiêu
- Average listening time tăng
- Free-to-paid conversion tăng
- Completion rate theo audiobook tăng

---

## 2. User Persona

### Persona 1: Nhân viên văn phòng
- Nghe khi đi làm, tập gym, trước khi ngủ
- Muốn nội dung cô đọng, dễ tiếp cận
- Quan tâm phát triển bản thân, năng suất, tài chính cá nhân

### Persona 2: Người dùng IT / kỹ thuật
- Quan tâm system design, clean architecture, tư duy sản phẩm
- Muốn học trong thời gian rảnh ngắn

### Persona 3: Người học ngoại ngữ, đặc biệt tiếng Nhật
- Muốn có transcript, tốc độ phát phù hợp, khả năng lặp đoạn
- Cần nội dung học tập có cấu trúc

### Persona 4: Người dùng self-development
- Muốn hình thành thói quen nghe mỗi ngày
- Quan tâm bookmark, note, resume, summary

---

## 3. Problem Statement

Người dùng muốn học qua audio nhưng thường gặp các vấn đề:
- Tìm nội dung tốt mất thời gian
- Khó quay lại đúng vị trí đã nghe
- Trải nghiệm phát audio chưa đủ mượt trên mạng yếu
- Bookmark và note chưa đủ tiện
- Admin khó quản lý thư viện nội dung lớn

Sản phẩm cần giải quyết:
- Giúp người dùng tìm nội dung nhanh hơn
- Giúp nghe liền mạch hơn
- Giúp quản lý nội dung và subscription hiệu quả

---

## 4. Scope

### 4.1 MVP User App
- Đăng ký / đăng nhập
- Duyệt audiobook theo danh mục
- Tìm kiếm audiobook
- Xem chi tiết audiobook
- Audio player
- Playback speed
- Resume listening
- Favorite
- Bookmark timestamp
- Kiểm tra subscription
- Nghe audio qua signed asset access URL

### 4.2 MVP Admin CMS
- Create audiobook metadata and bind asset keys
- Create chapter metadata and bind asset keys
- Quản lý author
- Quản lý category
- Publish / unpublish content

### 4.3 MVP Backend
- Auth API
- Audiobook API
- Playback progress API
- Asset access API
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
- `subscription_started`
- `subscription_cancelled`

### 4.5 Out of Scope cho MVP
- AI summary
- AI chatbot theo nội dung
- Recommendation ML nâng cao
- Community / social
- Podcast platform
- Multi-tenant B2B

---

## 5. Functional Requirements

### 5.1 Auth
- Người dùng có thể đăng ký và đăng nhập bằng email và mật khẩu
- Hệ thống lưu phiên đăng nhập an toàn
- Hỗ trợ phân quyền tối thiểu: `user`, `admin`

### 5.2 Discovery
- Hiển thị danh sách audiobook theo category
- Hiển thị audiobook mới, nổi bật, đang nghe tiếp
- Audiobook detail phải có:
  - title
  - description
  - cover image
  - author
  - narrator
  - duration
  - categories
  - tags
  - status
  - premium flag

### 5.3 Search
- Tìm theo title, author, narrator, tag
- Có phân trang
- Có filter cơ bản theo category và premium status
- Contract query cần rõ ràng với `page`, `pageSize`, `categoryId`, `premiumFlag`, `sortBy`, `sortOrder`

### 5.4 Player
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

### 5.5 Progress
- Lưu vị trí nghe theo user, audiobook, chapter
- Đồng bộ progress khi mở lại app
- Ghi nhận chapter completed

### 5.6 Bookmark & Favorite
- Tạo bookmark tại timestamp cụ thể
- Đánh dấu favorite cho audiobook
- Xem lại danh sách bookmark/favorite trong profile

### 5.7 Subscription
- Phân biệt user free và premium
- Kiểm tra quyền truy cập theo gói
- Hỗ trợ App Store IAP, Google Play Billing, web payment nếu cần

### 5.8 Admin CMS
- Tạo audiobook mới
- Bind chapter audio asset key
- Sắp xếp chapter theo thứ tự
- Gán author, narrator, category, tag
- Publish / unpublish nội dung

---

## 6. Non-functional Requirements

### 6.1 Performance
- Start playback dưới 2 giây khi mạng tốt
- Resume nhanh khi dữ liệu đã cache
- Search phản hồi nhanh khi đã index

### 6.2 Reliability
- Hỗ trợ retry khi CDN hoặc storage lỗi tạm thời
- Không mất progress khi app bị đóng đột ngột
- Xử lý tốt mạng yếu và trạng thái offline

### 6.3 Security
- Dùng signed URL cho audio
- URL audio có thời hạn
- Phân quyền admin riêng biệt
- Validate input ở mọi API
- Bảo vệ refresh token

### 6.4 Scalability
- Kiến trúc đủ để mở rộng thư viện, user, module sau này
- Tách rõ user-facing và admin-facing

### 6.5 UX
- Mobile-first
- Ít tap cho resume, bookmark, đổi speed
- Giao diện calm, minimal, premium, learning-focused

---

## 7. Basic Design

Thiết kế kỹ thuật chi tiết được tách sang tài liệu riêng:
- [docs/architecture.md](architecture.md)

Tài liệu kiến trúc bao gồm:
- Kiến trúc hệ thống tổng thể
- Ranh giới module
- Mô hình dữ liệu cơ bản
- Luồng nghiệp vụ chính
- Quy ước API
- Bảo mật và triển khai

---

## 8. User Stories

- As a user, I want to browse audiobook by category, so that I can quickly find relevant content.
- As a user, I want to search by title or author, so that I can find content without manual browsing.
- As a user, I want to resume listening from my last position, so that I do not lose progress.
- As a user, I want to change playback speed, so that I can listen at my preferred pace.
- As a user, I want to create bookmarks at specific timestamps, so that I can revisit important parts later.
- As an admin, I want to create audiobooks and chapters and bind asset keys, so that I can manage the content library.
- As an admin, I want to publish or unpublish content, so that I can control what is visible to users.
- As a user, I want to know whether a book is premium, so that I can decide whether to subscribe.

---

## 9. Acceptance Criteria

### 9.1 User App
- User đăng ký và đăng nhập thành công
- User có thể duyệt và tìm kiếm audiobook
- User có thể mở audiobook và phát chapter
- User có thể pause, seek, đổi tốc độ phát
- User có thể rời app và resume đúng vị trí
- User có thể tạo bookmark tại timestamp cụ thể
- User free không truy cập được nội dung premium khi chưa đủ quyền

### 9.2 Admin CMS
- Admin tạo được audiobook mới với metadata đầy đủ
- Admin gán chapter audio asset key và sắp xếp đúng thứ tự
- Admin publish / unpublish nội dung
- Nội dung publish xuất hiện trong app user sau khi sync/index

### 9.3 Backend
- API có validation rõ ràng
- Playback progress lưu và đọc lại chính xác
- Subscription status kiểm tra được từ app user
- Asset access trả về signed URL hoặc URL có hạn dùng
- Audio URL không expose public raw storage URL

### 9.4 Analytics
- Event chính được bắn đúng khi user thao tác
- Có thể đo listening time, completion rate, retention cơ bản

---

## 10. Data Tracking

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

### Thuộc tính theo dõi
- user_id
- audiobook_id
- chapter_id
- plan_type
- playback_position
- playback_speed
- source_screen
- device_platform

### KPI cần theo dõi
- DAU / MAU
- Average listening time
- Day 1 / Day 7 / Day 30 retention
- Free-to-paid conversion
- Churn rate
- Completion rate per audiobook

---

## 11. Risks

### Risk 1: Content licensing chi phí cao
- Ảnh hưởng: chậm mở rộng thư viện
- Giảm thiểu: chọn niche trước, đàm phán theo gói

### Risk 2: Retention thấp nếu content không tốt
- Ảnh hưởng: user rời nhanh
- Giảm thiểu: tối ưu onboarding, continue listening, chất lượng nội dung

### Risk 3: Audio playback kém trên mạng yếu
- Ảnh hưởng: trải nghiệm xấu, tăng churn
- Giảm thiểu: adaptive streaming, cache, retry, resume robust

### Risk 4: Admin vận hành nội dung rối
- Ảnh hưởng: xuất bản chậm, lỗi metadata
- Giảm thiểu: chuẩn hóa schema và workflow publish

---

## 12. Open Questions

1. MVP có cần web app user-facing hay chỉ mobile trước?
2. Subscription ưu tiên App Store / Google Play hay có web payment song song?
3. Offline playback có nên xếp sang phase sau thay vì MVP không?
4. Niche nội dung ban đầu là business, IT, Japanese hay self-development?
5. Có cần transcript cho mọi chapter trong MVP không?
6. Có cần social login ngay từ đầu không?
7. Admin CMS là web app riêng hay dashboard trong backend?
8. Có cần B2B multi-tenant ngay từ phase đầu không?

---

## 13. Release Recommendation

### Phase 1: MVP
- Auth
- Browse
- Search
- Player
- Resume
- Favorite
- Bookmark
- Subscription check
- Asset access
- Admin content management

### Phase 2: Retention
- Recommendation rule-based
- Reminder
- Streak
- Weekly report
- Notes
- Offline playback / download

### Phase 3: AI Layer
- Summary
- Flashcard
- Q&A
- Semantic search
