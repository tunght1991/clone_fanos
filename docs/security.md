# Bảo Mật: Nền Tảng Audiobook / Audio Learning

## 1. Mục tiêu

Đảm bảo audio asset, subscription, tài khoản admin và dữ liệu người dùng được bảo vệ đúng mức cho một nền tảng nội dung trả phí.

## 2. Nguyên tắc

- Không expose raw storage URL công khai.
- Signed URL cho audio và media nhạy cảm.
- RBAC riêng cho admin.
- Validate input ở mọi boundary.
- Rate limit các endpoint nhạy cảm.
- Refresh token phải được bảo vệ theo chuẩn nền tảng.
- Audit log cho các thao tác admin quan trọng.

## 3. Authentication

### 3.1 User auth

- Hỗ trợ đăng ký, đăng nhập, refresh và logout an toàn.
- Thiết kế token hoặc session nhất quán theo client.
- Access token ngắn hạn, refresh token được bảo vệ chặt.

### 3.2 Admin auth

- Admin phải có role riêng.
- Không dùng chung privilege với user app.
- Có thể bổ sung MFA ở phase sau nếu cần.

## 4. Authorization

- User chỉ truy cập content theo entitlement hợp lệ.
- Admin chỉ truy cập đúng scope quản trị được phân quyền.
- Subscription premium phải được kiểm tra ở backend, không tin client.

## 5. Bảo vệ audio asset

- File audio lưu trong object storage private.
- CDN chỉ phân phối qua signed URL hoặc cơ chế tương đương.
- URL có thời hạn ngắn.
- Không trả về public bucket URL trong API.
- Có thể bổ sung watermark hoặc DRM nhẹ ở phase sau nếu product yêu cầu.

## 5.1 Chiến lược truy cập động

Backend cần một lớp access abstraction để chọn backend theo môi trường hoặc theo loại asset:

- `CDN`: ưu tiên cho production streaming.
- `S3`: dùng khi cần pre-signed direct access hoặc khi CDN chưa sẵn sàng.
- `localfile`: dùng cho local dev, test, hoặc môi trường self-hosted.

Quy tắc:

- Client chỉ nhận `AssetAccess` đã được resolve từ backend, không tự suy luận nguồn lưu trữ.
- `AssetAccess` phải có TTL rõ ràng nếu là URL tạm thời.
- Không lưu raw source URL trong DB nếu có thể lưu `assetKey` hoặc `storageRef`.
- Với `localfile`, chỉ cho phép nội bộ hoặc môi trường dev; không dùng như contract production ổn định.

## 6. Payment security

- Verification thanh toán phải dựa trên provider response hoặc webhook.
- Không coi client confirmation là nguồn tin cậy cuối cùng.
- Idempotency cho payment event và subscription renew.
- Log giao dịch đủ để đối soát nhưng không lưu dữ liệu nhạy cảm thừa.

## 7. Input validation và abuse protection

- Validate tất cả payload ở API layer.
- Kiểm tra kích thước file upload.
- Kiểm tra content type khi upload media.
- Rate limit:
  - login
  - refresh
  - search
  - analytics ingest
  - admin publish actions

## 8. Token và session handling

### 8.1 Nếu dùng token-based

- Access token ngắn hạn.
- Refresh token lưu an toàn.
- Có cơ chế revoke khi logout hoặc khi nghi ngờ rủi ro.

### 8.2 Nếu dùng session-based

- Cookie `httpOnly`, `secure`, `sameSite` phù hợp.
- Chống CSRF nếu có web client.

## 9. Logging và audit

- Log các hành động admin:
  - publish / unpublish
  - sửa metadata quan trọng
  - upload / delete content
- Không log secrets, raw token hoặc PII nhạy cảm.
- Có trace id để debug request xuyên suốt.

## 10. Privacy

- Chỉ thu thập dữ liệu cần cho product analytics.
- Phân tách operational data và analytics data nếu có thể.
- Có retention policy cho event logs và audit logs.

## 11. Security testing

- Test xác thực và phân quyền.
- Test signed URL expiry.
- Test rate limiting.
- Test upload validation.
- Test subscription entitlement bypass.
- Test admin privilege boundary.

## 12. Câu hỏi mở

1. Mobile auth sẽ ưu tiên session cookie hay bearer token?
2. Có yêu cầu DRM chính thức cho audio hay signed URL là đủ cho MVP?
3. Có cần MFA cho admin ngay từ đầu không?
4. Chính sách retention cho analytics và audit log là bao lâu?
