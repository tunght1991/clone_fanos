# Admin Auth

## 1. Mục tiêu

Cho admin đăng nhập an toàn và vào CMS nhanh nhất có thể.

## 2. Entry / Exit

### Entry
- Mở app admin
- Token hết hạn
- Admin logout

### Exit
- Vào dashboard CMS
- Bị chặn nếu không đủ role

## 3. UI Components

- Login form
- Role badge / permission note
- Error banner
- Loading state

## 4. UI States

- `loading`
- `unauthenticated`
- `authenticated`
- `submitting`
- `error`
- `forbidden`

## 5. API Mapping

- `POST /auth/login`
- `GET /auth/me`
- `GET /admin/me`
- `POST /auth/refresh`
- `POST /auth/logout`

## 6. Interaction Rules

- Admin không có role hợp lệ phải bị chặn ngay.
- Nếu login thành công nhưng không phải admin, điều hướng sang `forbidden`.
- Refresh session phải tự động nếu token còn hạn và app mở lại.

## 7. Edge Cases

- User đăng nhập bằng account thường
- Refresh token hết hạn
- Admin bị deactivate
- Mất mạng khi login

## 8. Analytics

- `admin_login_viewed`
- `admin_login_submitted`
- `admin_login_success`
- `admin_login_failed`
- `admin_forbidden_viewed`

