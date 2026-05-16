# Mobile Screen Specs

Bộ tài liệu này mô tả detail design ở mức màn hình cho mobile MVP. Mục tiêu là giúp UI dev nắm nhanh:
- màn nào cần làm
- trạng thái UI nào phải xử lý
- API nào được dùng
- edge case nào cần cover
- event analytics nào cần bắn

## Phạm vi

Ưu tiên các luồng có tác động trực tiếp đến retention và listening habit:
- `Auth / onboarding`
- `Home / browse`
- `Search`
- `Audiobook detail`
- `Player`
- `Subscription gating`
- `Bookmark / favorite`

## Cách đọc

Mỗi file màn hình sẽ có cùng format:
1. Mục tiêu
2. Entry / exit
3. Thành phần UI
4. UI states
5. API mapping
6. Interaction rules
7. Edge cases
8. Analytics

## Danh sách file

- [01-auth-onboarding.md](./01-auth-onboarding.md)
- [02-home-browse.md](./02-home-browse.md)
- [03-search.md](./03-search.md)
- [04-audiobook-detail.md](./04-audiobook-detail.md)
- [05-player.md](./05-player.md)
- [06-subscription-gating.md](./06-subscription-gating.md)
- [07-bookmark-favorite.md](./07-bookmark-favorite.md)

## Lưu ý

- Tài liệu này bám theo backend contract hiện tại trong `docs/api-design.md` và `docs/spec.md`.
- Nếu API đổi, update trước ở `docs/api-design.md` rồi sync lại các file trong thư mục này.
