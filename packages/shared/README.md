# Shared Packages

Package dùng chung cho toàn repo.

## Mục đích

- Định nghĩa DTO contract chung
- Chứa type/schema dùng chung
- Giảm drift giữa backend, mobile và admin

## Nội dung hiện có

- `contracts/asset.ts`
- `contracts/subscription.ts`
- `contracts/search.ts`

## Nguyên tắc

- DTO là nguồn sự thật cho giao tiếp giữa các module
- Không để UI tự suy luận shape contract
- Thay đổi phải ưu tiên additive và backward-compatible

