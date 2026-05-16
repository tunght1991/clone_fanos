# Business Flow Diagram

Tài liệu này mô tả luồng kinh doanh tổng thể của nền tảng audiobook / audio learning, tập trung vào:

- Tạo thói quen nghe
- Tăng retention
- Tăng chuyển đổi subscription
- Giảm friction khi tìm và nghe nội dung
- Hỗ trợ vận hành content qua CMS

## 1. Business Flow Tổng Quan

```mermaid
flowchart LR
  A[Acquisition\nAds / SEO / Referral / Organic] --> B[Open App]
  B --> C{Onboarding done?}
  C -- No --> D[Onboarding]
  D --> E[Register / Login]
  C -- Yes --> E
  E --> F[Browse Home]
  F --> G[Search / Category / Recommendation]
  G --> H[Audiobook Detail]
  H --> I[Listen / Resume Playback]
  I --> J{Premium content?}
  J -- No --> K[Continue listening]
  J -- Yes --> L{Has entitlement?}
  L -- Yes --> K
  L -- No --> M[Paywall]
  M --> N[Select plan]
  N --> O[Payment]
  O --> P{Payment result}
  P -- Success --> Q[Verify receipt / entitlement]
  P -- Failed --> R[Show payment error / retry]
  Q --> S{Verification success?}
  S -- Yes --> T[Unlock content]
  S -- No --> U[Pending / retry verification]
  T --> K
  K --> V[Bookmark / Favorite / Note]
  K --> W[Offline download / background playback]
  K --> X[Playback progress saved]
  X --> Y[Analytics events]
  V --> Y
  W --> Y
  Y --> Z[Recommendation / Search ranking / Retention loop]

  subgraph Admin CMS
    A1[Upload audiobook] --> A2[Upload chapters]
    A2 --> A3[Manage author / category / tag]
    A3 --> A4[Publish / Unpublish]
    A4 --> A5[Audit log]
    A4 --> A6[Reindex search]
  end

  A5 --> Y
  A6 --> G
  A4 --> F

  subgraph Backend Platform
    Z1[Auth API]
    Z2[Audiobook API]
    Z3[Playback API]
    Z4[Subscription API]
    Z5[Search API]
    Z6[Asset access / Signed URL]
    Z7[Analytics ingest]
  end

  E --> Z1
  F --> Z2
  G --> Z5
  H --> Z2
  I --> Z3
  L --> Z4
  Q --> Z4
  R --> Z4
  U --> Z4
  K --> Z3
  W --> Z6
  Y --> Z7
```

## 2. Luồng Kinh Doanh Chi Tiết

### 2.1 Acquisition -> Activation

```mermaid
flowchart TD
  A[User sees app / landing page] --> B[Installs app]
  B --> C[Opens first time]
  C --> D[Onboarding]
  D --> E[Login / Register]
  E --> F{Session valid?}
  F -- Yes --> G[Home]
  F -- No --> H[Show error / retry]
```

Mục tiêu của giai đoạn này:

- Giảm số bước trước khi người dùng vào được nội dung
- Đưa người dùng tới màn Home nhanh nhất có thể
- Tăng activation rate sau cài đặt

### 2.2 Discovery -> Playback

```mermaid
flowchart TD
  A[Home] --> B[Search / Category]
  B --> C[Audiobook detail]
  C --> D[Preview / Start listening]
  D --> E[Playback progress update]
  E --> F[Resume later]
  E --> G[Bookmark / Favorite / Note]
```

Mục tiêu của giai đoạn này:

- Tăng average listening time
- Tăng completion rate
- Giảm ma sát khi resume
- Kích thích hành vi lưu lại nội dung học tập

### 2.3 Monetization

```mermaid
flowchart TD
  A[User reaches premium content] --> B{Has entitlement?}
  B -- Yes --> C[Unlock content]
  B -- No --> D[Paywall]
  D --> E[Select plan]
  E --> F[Start payment]
  F --> G{Payment result}
  G -- Success --> H[Verify receipt / entitlement]
  G -- Failed --> I[Show payment error / retry]
  H --> J{Verification success?}
  J -- Yes --> C
  J -- No --> K[Show pending / retry verification]
  C --> L[Listen normally]
```

Mục tiêu của giai đoạn này:

- Tăng free-to-paid conversion
- Giảm drop-off tại paywall
- Bảo vệ premium content
- Tách rõ payment success với entitlement unlock
- Cho phép verify lại receipt trước khi mở nội dung premium

### 2.4 Content Operations

```mermaid
flowchart TD
  A[Admin uploads content] --> B[Create audiobook]
  B --> C[Upload chapters / audio assets]
  C --> D[Set metadata]
  D --> E[Publish]
  E --> F[Audit log recorded]
  E --> G[Search reindex]
  E --> H[Content visible in app]
```

Mục tiêu của giai đoạn này:

- Giảm công vận hành content
- Đảm bảo nội dung publish nhanh và nhất quán
- Giữ chất lượng metadata để discovery tốt hơn

### 2.5 Analytics Feedback Loop

```mermaid
flowchart LR
  A[User actions] --> B[Analytics events]
  B --> C[Dashboards]
  C --> D[Insights]
  D --> E[Product decisions]
  E --> F[Improved UX / content ops / recommendation]
  F --> A
```

Event cần track:

- `app_opened`
- `audiobook_viewed`
- `chapter_started`
- `chapter_completed`
- `playback_paused`
- `playback_resumed`
- `bookmark_created`
- `subscription_started`
- `subscription_cancelled`

## 3. Điểm Chạm Theo Vai Trò

| Vai trò | Hành động chính | Kết quả kinh doanh |
|---|---|---|
| User | Browse, search, nghe, bookmark, upgrade | Retention, engagement, subscription |
| Admin | Upload, publish, quản lý taxonomy | Content quality, vận hành hiệu quả |
| Backend | Auth, playback, subscription, search, analytics | Ổn định hệ thống, giảm friction |
| Analytics | Ghi nhận hành vi, tạo insight | Tối ưu retention và conversion |

## 4. KPI Liên Quan

Sơ đồ này hỗ trợ các KPI sau:

- DAU / MAU
- Average listening time
- Day 1 / Day 7 / Day 30 retention
- Free-to-paid conversion rate
- Churn rate
- Completion rate per audiobook

## 5. Ghi chú Thiết Kế

- Luồng ưu tiên là `browse -> detail -> listen -> resume`
- Paywall chỉ nên xuất hiện khi thực sự chạm premium content hoặc entitlement check
- Publish content phải trigger reindex để search phản ánh đúng dữ liệu mới
- Analytics không được block trải nghiệm nghe
- Signed URL và CDN URL phải được cấp qua backend, không expose raw storage URL
