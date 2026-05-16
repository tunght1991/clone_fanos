# Bookmark / Favorite

## 1. Mục tiêu

Cho user lưu lại đoạn nghe quan trọng và đánh dấu audiobook để quay lại sau.

## 2. Entry / Exit

### Entry
- Từ player
- Từ audiobook detail
- Từ profile

### Exit
- Quay lại player
- Quay về audiobook detail
- Xem danh sách bookmark/favorite

## 3. UI Components

- Bookmark action button
- Bookmark list item
- Favorite toggle
- Favorite list
- Timestamp label
- Note preview nếu sau này mở rộng note

## 4. UI States

- `idle`
- `creating`
- `success`
- `empty`
- `error`

## 5. API Mapping

- `POST /bookmarks`
- `GET /bookmarks`
- `DELETE /bookmarks/:id`
- `POST /favorites/:audiobookId`
- `DELETE /favorites/:audiobookId`
- `GET /favorites`

## 6. Interaction Rules

- Bookmark từ player phải lưu kèm `audiobookId`, `chapterId`, `positionMs`.
- Favorite add/remove nên cập nhật optimistic nếu backend cho phép.
- Danh sách bookmark cần cho phép nhảy lại đúng timestamp.
- Nếu user chưa login thì phải chặn và điều hướng sang auth.

## 7. Edge Cases

- Bookmark trùng vị trí
- Favorite đã tồn tại
- Xóa bookmark thất bại
- Mất mạng khi tạo bookmark
- Chapter bị đổi nhưng bookmark cũ vẫn phải đọc được tương đối

## 8. Analytics

- `bookmark_created`
- `bookmark_deleted`
- `favorite_created`
- `favorite_deleted`
