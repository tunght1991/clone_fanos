# Mobile App

Ứng dụng Flutter dành cho người dùng cuối.

## Trạng thái hiện tại

- T17 - Mobile auth + onboarding: đã triển khai
- App shell đã có:
  - bootstrap
  - onboarding flow
  - login / register flow
  - authenticated home shell tạm
- Các màn browse, search, player, bookmark, subscription UI sẽ đi tiếp ở các sprint sau

## Start

### 1. Chuẩn bị

- Mở terminal tại thư mục mobile:

```powershell
Set-Location D:\01_Work\clone_fanos\apps\mobile
```

### 2. Cài dependencies

Nếu dùng Flutter global:

```powershell
flutter pub get
```

Nếu dùng Flutter SDK bundled trong workspace:

```powershell
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat pub get
```

### 3. Chạy app

```powershell
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat run
```

Nếu muốn chạy trên Chrome khi chưa có desktop toolchain:

```powershell
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat run -d chrome
```

## Trách nhiệm

- Đăng ký / đăng nhập
- Onboarding lần đầu
- Điều hướng vào home sau khi xác thực thành công
- Consume backend auth contract qua `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`

## Cấu trúc chính

- `lib/app/` - app bootstrap và DI nhẹ
- `lib/core/storage/` - session/onboarding store tạm
- `lib/features/auth/` - domain, data, state, UI cho auth
- `lib/features/onboarding/` - onboarding screens
- `lib/features/home/` - home shell placeholder cho sprint sau

## Chạy test

Chạy toàn bộ test:

```powershell
flutter test
```

Hoặc nếu dùng Flutter SDK bundled:

```powershell
D:\01_Work\clone_fanos\tools\flutter\bin\flutter.bat test
```

Chạy một file test cụ thể:

```powershell
flutter test test\player_screen_test.dart
```

### Khi gặp lỗi thường gặp

- Nếu báo `flutter` không được nhận diện, hãy dùng đường dẫn đầy đủ tới SDK trong workspace hoặc thêm Flutter vào `PATH`
- Nếu test fail vì thiếu package, chạy lại `flutter pub get`
- Nếu fail do cache cũ, thử xóa `.dart_tool` và chạy lại `flutter pub get`

## Ghi chú

- Session/onboarding store hiện là in-memory placeholder; sẽ thay bằng secure storage ở sprint sau
- Để giữ test ổn định, ưu tiên viết test theo hành vi và tránh phụ thuộc vào state toàn cục
