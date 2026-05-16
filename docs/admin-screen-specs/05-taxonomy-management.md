# Taxonomy Management

> Phase sau / tham chiếu thiết kế.
> Hiện tại backend MVP chưa có admin CRUD riêng cho author, category, tag, narrator.

## 1. Mục tiêu

Cho admin quản lý author, category, tag, narrator để nội dung được chuẩn hóa và search hoạt động tốt.

## 2. Entry / Exit

### Entry
- Từ dashboard
- Từ audiobook editor

### Exit
- Quay lại editor hoặc dashboard

## 3. UI Components

- Tab author / category / tag / narrator
- Table list
- Create / edit form
- Delete action
- Search/filter field

## 4. UI States

- `loading`
- `empty`
- `editing`
- `saving`
- `error`

## 5. API Mapping

- Chưa có admin CRUD endpoint riêng trong contract MVP hiện tại.
- Màn này chỉ nên dùng như tham chiếu thiết kế cho phase sau.

## 6. Interaction Rules

- Không cho tạo taxonomy trùng tên nếu backend enforce unique.
- Nếu taxonomy đang được gắn vào audiobook thì xóa phải có confirm.
- Search selector trong audiobook editor phải dùng cùng source dữ liệu với màn taxonomy khi phase sau được triển khai.

## 7. Edge Cases

- Tên trùng
- Xóa taxonomy đang được sử dụng
- Dữ liệu taxonomy quá nhiều
- Lỗi permission

## 8. Analytics

- `admin_taxonomy_viewed`
- `admin_taxonomy_created`
- `admin_taxonomy_updated`
- `admin_taxonomy_deleted`
