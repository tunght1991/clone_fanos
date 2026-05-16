# Home / Browse

## 1. Mục tiêu

Cho user thấy nội dung phù hợp ngay khi vào app và giảm số tap để bắt đầu nghe.

## 2. Entry / Exit

### Entry
- Sau login thành công
- Sau khi quay lại từ player
- Từ tab home

### Exit
- Audiobook detail
- Search
- Player nếu bấm continue listening

## 3. UI Components

- Continue listening card
- Category carousel / list
- New / featured section
- Premium badge
- Audiobook card
- Empty state

## 4. UI States

- `loading`
- `success`
- `empty`
- `error`

## 5. API Mapping

- `GET /audiobooks`
- `GET /audiobooks?categoryId=...` cho filter category
- `GET /playback/progress/:audiobookId` cho continue listening

## 6. Interaction Rules

- Tap card => mở audiobook detail.
- Continue listening => resume đúng position gần nhất.
- Category filter phải giữ trạng thái chọn hiện tại dựa trên taxonomy đã có trong app.
- Nếu section rỗng thì ẩn hoặc thay bằng empty state ngắn.

## 7. Edge Cases

- Không có audiobook nào published
- Continue listening không có data
- Category list dài
- Network chậm khiến carousel load trễ

## 8. Analytics

- `home_viewed`
- `category_viewed`
- `audiobook_card_clicked`
- `continue_listening_clicked`
