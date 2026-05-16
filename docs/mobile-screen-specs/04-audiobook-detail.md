# Audiobook Detail

## 1. Mục tiêu

Cho user thấy đầy đủ thông tin để quyết định nghe ngay, lưu bookmark hoặc upgrade nếu là premium.

## 2. Entry / Exit

### Entry
- Từ home/browse
- Từ search result
- Từ continue listening

### Exit
- Player
- Back về browse/search
- Subscription upgrade

## 3. UI Components

- Cover image
- Title
- Author
- Narrator list
- Description
- Category / tag chips
- Chapter list
- Resume button
- Play from start button
- Favorite button
- Premium badge

## 4. UI States

- `loading`
- `success`
- `empty`
- `error`
- `premium_locked`

## 5. API Mapping

- `GET /audiobooks/:id`
- `GET /playback/progress/:audiobookId`
- `POST /favorites/:audiobookId`
- `DELETE /favorites/:audiobookId`
- `POST /subscriptions/verify`

## 6. Interaction Rules

- Nếu user đã có progress thì ưu tiên nút `Continue listening`.
- Nếu chưa có progress thì show `Start listening`.
- Nếu content premium và user chưa đủ quyền:
  - show CTA upgrade
  - không cho mở chapter premium
- Favorite add/remove phải phản hồi nhanh, tối đa một tap.
- Chapter list cần rõ order và duration.

## 7. Edge Cases

- Audiobook không có chapter
- Audiobook chưa publish
- Thiếu narrator
- Description quá dài
- User hết subscription giữa chừng

## 8. Analytics

- `audiobook_viewed`
- `chapter_started`
- `favorite_created`
- `premium_cta_clicked`
