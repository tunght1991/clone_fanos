# Audiobook Editor

## 1. Mục tiêu

Cho admin tạo audiobook, metadata và chapter ban đầu trong cùng một submit trước khi publish.

## 2. Entry / Exit

### Entry
- Từ dashboard
- Từ nút create audiobook mới

### Exit
- Quay lại dashboard
- Đi sang publish workflow

## 3. UI Components

- Title input
- Description editor
- Cover image asset key / picker
- Author selector
- Premium flag toggle
- Language code selector
- Status badge
- Chapter list editor
- Save draft button
- Publish later button

## 4. UI States

- `loading`
- `editing`
- `saving`
- `saved`
- `validation_error`
- `publish_locked`

## 5. API Mapping

- `GET /admin/audiobooks/:id`
- `POST /admin/audiobooks` with nested initial chapters
- `PATCH /admin/audiobooks/:id`
- `PATCH /admin/audiobooks/:id/publish`
- `PATCH /admin/audiobooks/:id/unpublish`

## 6. Interaction Rules

- Save draft không được làm mất context form.
- Cover asset key nên preview ngay nếu hệ thống asset picker hỗ trợ.
- Author phải có search selector nếu dữ liệu lớn.
- Nếu audiobook đã publish, sửa nội dung phải hiển thị cảnh báo ảnh hưởng search/reindex.

## 7. Edge Cases

- Thiếu title
- Cover asset key không hợp lệ
- Publish khi chapter chưa đủ
- Draft chưa lưu nhưng user rời trang

## 8. Analytics

- `admin_audiobook_create_started`
- `admin_audiobook_saved`
- `admin_audiobook_publish_clicked`
- `admin_audiobook_publish_success`
