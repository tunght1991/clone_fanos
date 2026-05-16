# Publish / Audit Trail

## 1. Mục tiêu

Cho admin publish/unpublish nội dung và xem lịch sử thay đổi để dễ vận hành và debug.

## 2. Entry / Exit

### Entry
- Từ audiobook editor
- Từ chapter editor
- Từ dashboard

### Exit
- Quay lại content detail
- Quay lại dashboard

## 3. UI Components

- Publish / unpublish buttons
- Confirmation dialog
- Status timeline
- Audit trail table
- Actor / time / action columns
- Reindex status indicator nếu có

## 4. UI States

- `idle`
- `confirming`
- `publishing`
- `unpublishing`
- `success`
- `error`

## 5. API Mapping

- `PATCH /admin/audiobooks/:id/publish`
- `PATCH /admin/audiobooks/:id/unpublish`
- `PATCH /admin/chapters/:id/publish`
- `PATCH /admin/chapters/:id/unpublish`

Audit trail panel là tham chiếu thiết kế cho phase sau nếu backend expose endpoint riêng.

## 6. Interaction Rules

- Publish/unpublish phải có confirm dialog.
- Sau publish thành công, UI nên refresh status và audit trail.
- Nếu reindex hoặc sync backend chưa xong, phải hiển thị trạng thái rõ.
- Audit trail cần đọc nhanh theo entity hiện tại khi endpoint được expose.

## 7. Edge Cases

- Publish thất bại
- Unpublish thất bại
- Entity không tồn tại
- Audit trail rỗng
- Mất quyền giữa chừng

## 8. Analytics

- `admin_publish_clicked`
- `admin_publish_success`
- `admin_unpublish_clicked`
- `admin_unpublish_success`
- `admin_audit_trail_viewed`
