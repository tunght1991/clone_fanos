# Content Dashboard

## 1. Mục tiêu

Cho admin xem nhanh trạng thái thư viện nội dung và truy cập vào editor đúng màn hình cần thao tác.

## 2. Entry / Exit

### Entry
- Sau đăng nhập admin
- Sau khi lưu content thành công

### Exit
- Audiobook editor
- Chapter editor

## 3. UI Components

- Search bar
- Filter by status
- Content table / list
- Status badge
- Premium badge
- Quick action buttons
- Empty state

## 4. UI States

- `loading`
- `success`
- `empty`
- `error`

## 5. API Mapping

- Chưa có admin list endpoint riêng trong contract MVP hiện tại.
- Dashboard có thể hiển thị trạng thái tóm tắt và dẫn thẳng sang editor của từng content item khi backend expose dữ liệu phù hợp ở phase sau.

## 6. Interaction Rules

- Click item => mở audiobook editor.
- Filter/status/search phải phản hồi nhanh và giữ state filter.
- Danh sách phải ưu tiên nội dung draft/published rõ ràng.

## 7. Edge Cases

- Không có nội dung
- Dữ liệu lớn, pagination dài
- Search không ra kết quả
- Mất quyền giữa chừng

## 8. Analytics

- `admin_dashboard_viewed`
- `admin_content_searched`
- `admin_content_item_clicked`
