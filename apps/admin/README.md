# Admin App

CMS web cho quản trị nội dung audiobook.

## Trách nhiệm

- Tạo và cập nhật audiobook
- Quản lý chapter
- Quản lý author, narrator, category, tag
- Publish / unpublish nội dung
- Upload asset qua backend contract
- Audit các thao tác quan trọng

## Trạng thái

- Admin shell, auth guard và session bootstrap đã có
- Content dashboard đã có route riêng `#/content`
- Audiobook editor metadata đã có route `#/content/new` và `#/content/:id`
- UI hiện dùng demo fallback nếu backend admin API chưa sẵn
- Sẽ dùng chung backend API với user app khi các màn editor tiếp tục được triển khai

## Start

Chạy admin app ở chế độ dev:

```bash
pnpm dev
```

Nếu PowerShell chặn `pnpm`, dùng:

```bash
pnpm.cmd dev
```
