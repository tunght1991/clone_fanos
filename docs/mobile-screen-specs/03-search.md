# Search

## 1. Mục tiêu

Giúp user tìm audiobook nhanh theo title, author, narrator, tag hoặc category.

## 2. Entry / Exit

### Entry
- Từ tab search
- Từ home
- Từ empty state của browse

### Exit
- Audiobook detail
- Quay lại home

## 3. UI Components

- Search input
- Recent search chips nếu có
- Filter chips
- Result list
- Empty state
- No result state

## 4. UI States

- `idle`
- `typing`
- `loading`
- `success`
- `empty`
- `error`

## 5. API Mapping

- `GET /search`

Query thường dùng:
- `query`
- `page`
- `pageSize`
- `categoryId`
- `premiumFlag`
- `sortBy`
- `sortOrder`

## 6. Interaction Rules

- Search theo debounce, không bắn request cho từng ký tự nếu chưa cần.
- Enter hoặc bấm search là trigger query chính.
- Clear input phải reset kết quả.
- Filter thay đổi thì query phải chạy lại.
- Kết quả ưu tiên hiển thị title, author, narrator, premium badge, cover.

## 7. Edge Cases

- Query rỗng
- Không có kết quả
- Kết quả quá nhiều trang
- Search API chậm hoặc lỗi
- Typo nhỏ nhưng vẫn phải ra kết quả gần đúng

## 8. Analytics

- `search_viewed`
- `search_submitted`
- `search_filter_changed`
- `search_result_clicked`
