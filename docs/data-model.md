# Mô Hình Dữ Liệu: Nền Tảng Audiobook / Audio Learning

## 1. Mục tiêu

Tài liệu này mô tả các entity cốt lõi và quan hệ dữ liệu để hỗ trợ:
- Duyệt và phát audiobook
- Lưu tiến độ nghe
- Bookmark, favorite và note
- Subscription và entitlement
- Analytics cơ bản

## 2. Entity chính

### 2.1 Audiobook

```text
Audiobook
- id
- title
- description
- coverImageAssetKey
- authorId
- durationSec
- status
- premiumFlag
- publishedAt
- createdAt
- updatedAt
```

### 2.2 Chapter

```text
Chapter
- id
- audiobookId
- title
- orderIndex
- durationSec
- audioAssetKey
- transcript
- status
- createdAt
- updatedAt
```

### 2.3 Author

```text
Author
- id
- name
- bio
- avatarAssetKey
- createdAt
- updatedAt
```

### 2.4 Narrator

```text
Narrator
- id
- name
- bio
- avatarAssetKey
- voiceLabel
- languageCode
- voiceType
- createdAt
- updatedAt
```

### 2.5 AudiobookNarrator

```text
AudiobookNarrator
- id
- audiobookId
- narratorId
- roleIndex
- isPrimary
- createdAt
- updatedAt
```

### 2.6 Category

```text
Category
- id
- name
- slug
- description
- createdAt
- updatedAt
```

### 2.7 Tag

```text
Tag
- id
- name
- slug
- createdAt
- updatedAt
```

### 2.8 UserProgress

```text
UserProgress
- id
- userId
- audiobookId
- chapterId
- positionMs
- completed
- lastPlayedAt
- updatedAt
```

### 2.9 Bookmark

```text
Bookmark
- id
- userId
- audiobookId
- chapterId
- positionMs
- note
- createdAt
```

### 2.10 Favorite

```text
Favorite
- id
- userId
- audiobookId
- createdAt
```

### 2.11 Note

```text
Note
- id
- userId
- audiobookId
- chapterId
- positionMs
- content
- createdAt
- updatedAt
```

### 2.12 SubscriptionPlan

```text
SubscriptionPlan
- id
- name
- price
- durationDays
- status
- createdAt
- updatedAt
```

### 2.13 Subscription

```text
Subscription
- id
- userId
- planId
- status
- startAt
- endAt
- provider
- providerSubscriptionId
- billingProvider
- billingStatus
- billingReference
- checkoutSessionId
- lastBillingAt
- nextBillingAt
- createdAt
- updatedAt
```

### 2.14 AnalyticsEvent

```text
AnalyticsEvent
- id
- userId
- eventName
- payloadJson
- sourcePlatform
- createdAt
```

## 3. Quan hệ dữ liệu

- Một `Audiobook` có nhiều `Chapter`.
- Một `Audiobook` thuộc nhiều `Category` và nhiều `Tag`.
- Một `Audiobook` có một `Author` chính.
- Một `Audiobook` có tối đa 3 `Narrator` thông qua `AudiobookNarrator`.
- `roleIndex` của `AudiobookNarrator` nằm trong khoảng 1..3.
- `isPrimary = true` chỉ dành cho một narrator chính của audiobook.
- Một `User` có nhiều `UserProgress`.
- Một `User` có nhiều `Bookmark`.
- Một `User` có nhiều `Favorite`.
- Một `User` có nhiều `Note`.
- Một `User` có thể có nhiều `Subscription` theo lịch sử, nhưng chỉ một subscription active tại một thời điểm trong MVP.
- Một `Subscription` thuộc một `SubscriptionPlan`.
- Một `Subscription` chứa cả entitlement và billing/provider data.

## 4. Trạng thái

### 4.1 Audiobook.status

- `draft`
- `published`
- `unpublished`
- `archived`

### 4.2 Chapter.status

- `draft`
- `ready`
- `published`
- `archived`

### 4.3 Subscription.status

- `pending`
- `active`
- `expired`
- `cancelled`
- `failed`

### 4.4 Billing.status

- `initiated`
- `pending`
- `paid`
- `failed`
- `refunded`
- `cancelled`

## 5. Quy tắc dữ liệu

- `orderIndex` của `Chapter` phải duy nhất trong phạm vi một `Audiobook`.
- `positionMs` không được âm.
- `premiumFlag = true` nghĩa là content cần entitlement hợp lệ.
- `Bookmark` phải gắn với `chapterId` hoặc một timestamp hợp lệ trong chapter.
- `UserProgress` là dữ liệu theo user và chapter, cập nhật theo hành vi nghe thực tế.
- `audioAssetKey` là khóa tham chiếu private asset, không lưu public raw URL.
- `coverImageAssetKey` và `avatarAssetKey` là khóa tham chiếu asset, URL chỉ nên được resolve ở lớp presentation hoặc access service.
- `AudiobookNarrator.roleIndex` phải duy nhất trong phạm vi một audiobook.
- Một audiobook không được gắn quá 3 narrator.
- `billingProvider` phải xác định nguồn thanh toán như `IAP`, `GOOGLE_PLAY`, `WEB_GATEWAY`.
- `billingStatus` phản ánh trạng thái thanh toán thực tế và có thể khác `Subscription.status`.
- `transcript` có thể lưu trực tiếp trong DB nếu ngắn, hoặc tách sang storage nếu payload lớn.

## 6. Index gợi ý

- `Audiobook.title`
- `Audiobook.status`
- `Audiobook.premiumFlag`
- `Chapter.audiobookId`
- `Chapter.orderIndex`
- `UserProgress.userId`
- `UserProgress.audiobookId`
- `Bookmark.userId`
- `Favorite.userId`
- `Note.userId`
- `Subscription.userId`
- `AnalyticsEvent.eventName`
- `AudiobookNarrator.audiobookId`
- `AudiobookNarrator.narratorId`

## 7. Migrations và seed

- Migrations phải versioned và có thể rollback.
- Seed tối thiểu nên có:
  - category mẫu
  - author và narrator mẫu
  - 3 đến 5 audiobook mẫu
  - chapter mẫu cho flow nghe
  - subscription plan mẫu

## 8. Data quality rules

- Không lưu dữ liệu thiếu `userId` hoặc `audiobookId` ở các bảng hành vi.
- Không cho phép `orderIndex` trùng nhau trong cùng audiobook.
- `Subscription.endAt` phải lớn hơn hoặc bằng `startAt`.
- `Bookmark.positionMs` và `UserProgress.positionMs` phải nằm trong phạm vi duration chapter.
- Dữ liệu publish chỉ được đồng bộ sang search engine khi trạng thái hợp lệ.

## 9. Câu hỏi mở

1. Một audiobook có thể có nhiều narrator ngay trong MVP không?
2. Transcript lưu trực tiếp trong DB hay tách sang storage?
3. Favorite có cần metadata bổ sung không?
4. Có cần soft delete cho content không?
