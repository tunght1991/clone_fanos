# Chapter Upload / Editor

## 1. Mục tiêu

Cho admin tạo chapter theo thứ tự, gắn audio asset, và kiểm soát trạng thái chapter.

## 2. Entry / Exit

### Entry
- Từ audiobook editor
- Từ dashboard vào audiobook có sẵn

### Exit
- Quay lại audiobook editor
- Publish workflow

## 3. UI Components

- Chapter list
- Chapter create button
- Chapter title input
- Order input / drag reorder
- Audio asset key / picker
- Transcript field nếu có
- Duration display
- Save / publish actions

## 4. UI States

- `loading`
- `editing`
- `asset_resolving`
- `saving`
- `saved`
- `error`
- `reordering`

## 5. API Mapping

- `POST /admin/chapters`
- `PATCH /admin/chapters/:id`
- `PATCH /admin/chapters/:id/publish`
- `PATCH /admin/chapters/:id/unpublish`

## 6. Interaction Rules

- Order chapter phải là rõ ràng và không được trùng.
- Audio asset key phải được kiểm tra hợp lệ trước khi save.
- Nếu chapter đã publish, sửa audio phải cảnh báo reindex / asset refresh.
- Drag reorder chỉ được khi chapter chưa xung đột thứ tự.

## 7. Edge Cases

- Audio asset key không hợp lệ
- Asset resolve đứt mạng
- Duration chưa xác định
- Trùng order
- Chapter publish nhưng audio thiếu

## 8. Analytics

- `admin_chapter_create_started`
- `admin_chapter_asset_attach_started`
- `admin_chapter_asset_attach_success`
- `admin_chapter_publish_success`
