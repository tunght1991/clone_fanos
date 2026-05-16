# Subscription Gating

## 1. Mục tiêu

Chặn premium content đúng chỗ, đồng thời không làm UX bị gãy.

## 2. Entry / Exit

### Entry
- Từ audiobook detail
- Từ player khi user mở premium chapter
- Từ profile / settings

### Exit
- Quay lại content
- Chuyển sang checkout
- Back về app nếu user hủy

## 3. UI Components

- Premium badge
- Locked overlay
- Upgrade CTA
- Plan card
- Subscription status chip
- Success / failure state

## 4. UI States

- `active`
- `expired`
- `trial`
- `locked`
- `paywall`
- `select_plan`
- `payment_processing`
- `payment_success`
- `payment_failed`
- `verifying_entitlement`
- `pending_verification`
- `checkout_loading`
- `checkout_error`

## 5. API Mapping

- `GET /subscriptions/plans`
- `GET /subscriptions/me`
- `POST /subscriptions/verify`
- `POST /subscriptions/checkout`

## 6. Interaction Rules

- Nếu user chưa có quyền premium:
  - show lock state rõ ràng
  - show lý do ngắn gọn
  - CTA upgrade phải nổi bật
- Nếu user đã active thì không làm phiền thêm.
- Screen phải phản ánh trạng thái subscription hiện tại ngay khi mở.
- Paywall phải dẫn sang select plan trước khi checkout.
- Payment success không unlock content trực tiếp; phải chờ verify receipt / entitlement.

## 7. Edge Cases

- Subscription vừa hết hạn
- Verify trả về stale state
- Checkout thất bại
- User đổi account
- Billing provider trả error

## 8. Analytics

- `subscription_viewed`
- `subscription_upgrade_clicked`
- `subscription_checkout_started`
- `subscription_checkout_success`
- `subscription_checkout_failed`
