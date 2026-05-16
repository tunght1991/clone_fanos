# Auth / Onboarding

## 1. Mục tiêu

Cho phép user đăng ký, đăng nhập và đi vào app nhanh nhất có thể.

## 2. Entry / Exit

### Entry
- Mở app lần đầu
- User logout
- Token hết hạn và cần đăng nhập lại

### Exit
- Vào home/browse sau khi login thành công
- Điều hướng sang upgrade nếu user cố vào premium content mà chưa đủ quyền

## 3. UI Components

- Splash / loading bootstrap
- Welcome screen
- Login form
- Register form
- Forgot password entry point nếu có sau MVP
- Error banner / toast

## 4. UI States

- `loading`: đang bootstrap session
- `unauthenticated`: hiển thị welcome / login / register
- `authenticated`: chuyển vào app chính
- `submitting`: disable button khi đang gửi form
- `error`: hiển thị lỗi validation hoặc server

## 5. API Mapping

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/refresh`
- `POST /auth/logout`

## 6. Interaction Rules

- Auto-check session khi app mở.
- Nếu có access token hợp lệ thì đi thẳng vào app.
- Nếu login/register thành công:
  - lưu `accessToken`
  - lưu `refreshToken`
  - cache profile user
- Nút submit phải disable trong lúc request đang chạy.
- Nếu lỗi auth do credential sai, hiển thị message rõ ràng, không chỉ generic.

## 7. Edge Cases

- Mất mạng khi login
- Email invalid
- Password rỗng hoặc quá ngắn
- User bị deactivate
- Refresh token hết hạn
- App bị kill giữa chừng và mở lại

## 8. Analytics

- `app_opened`
- `auth_viewed`
- `auth_login_submitted`
- `auth_login_success`
- `auth_login_failed`
- `auth_register_submitted`
- `auth_register_success`
- `auth_register_failed`

