# Admin Screen Specs

Bộ tài liệu này mô tả detail design ở mức màn hình cho admin CMS MVP.
Mục tiêu là giúp admin UI dev nắm nhanh:
- màn nào cần làm
- thao tác nào là bắt buộc
- trạng thái UI nào phải xử lý
- API nào được dùng
- edge case nào cần cover

## Phạm vi

Ưu tiên các luồng thao tác nội dung cốt lõi:
- `Admin auth`
- `Content dashboard`
- `Audiobook editor`
- `Chapter upload / editor`
- `Publish / unpublish`

Các phần sau hiện là tham chiếu cho phase sau, không phải API contract MVP hiện tại:
- `Taxonomy management`
- `Audit trail`

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

- [01-admin-auth.md](./01-admin-auth.md)
- [02-content-dashboard.md](./02-content-dashboard.md)
- [03-audiobook-editor.md](./03-audiobook-editor.md)
- [04-chapter-upload.md](./04-chapter-upload.md)
- [05-taxonomy-management.md](./05-taxonomy-management.md)
- [06-publish-audit.md](./06-publish-audit.md)

## Lưu ý

- Tài liệu này bám theo contract hiện tại trong `docs/api-design.md`, `docs/spec.md`, `docs/architecture.md`.
- Nếu flow content thay đổi, update API contract trước rồi sync lại các file trong thư mục này.
- Các file phase sau cần được đọc như hướng dẫn thiết kế, không phải contract đã triển khai.
