Bạn đóng vai trò là **Senior Software Engineer, Software Architect và Security Reviewer**. Hãy rà soát toàn bộ mã nguồn trong repository hiện tại một cách có hệ thống để đánh giá chất lượng dự án và xác định các vấn đề cần xử lý.

## Mục tiêu review

Kiểm tra toàn bộ mã nguồn theo các nhóm sau:

1. **Tính đúng đắn của logic**

   * Phát hiện logic sai, thiếu nhánh xử lý, điều kiện biên chưa được xử lý.
   * Kiểm tra null, undefined, dữ liệu rỗng, dữ liệu không hợp lệ.
   * Kiểm tra lỗi liên quan đến timezone, số tiền, làm tròn số, trạng thái dữ liệu.
   * Kiểm tra race condition, double-submit, transaction không đầy đủ và dữ liệu bị cập nhật một phần.
   * Xác định các trường hợp lỗi có thể xảy ra trong thực tế.

2. **Kiến trúc và cấu trúc code**

   * Kiểm tra cách phân chia module, layer, class và function.
   * Xác định module có quá nhiều trách nhiệm, phụ thuộc vòng tròn hoặc coupling quá cao.
   * Phát hiện hard-code, magic number, magic string và business rule nằm sai vị trí.
   * Tìm code chết, file không còn sử dụng, comment lỗi thời và abstraction không cần thiết.

3. **Khả năng bảo trì**

   * Kiểm tra tên biến, tên hàm, tên class và cấu trúc thư mục.
   * Đánh giá mức độ dễ đọc, dễ sửa và dễ mở rộng.
   * Phát hiện function quá dài, quá nhiều nhánh hoặc có side effect khó kiểm soát.
   * Kiểm tra type definition, interface, schema validation và tài liệu cần thiết.

4. **Hiệu năng**

   * Phát hiện N+1 query, query trong vòng lặp, query lấy dư dữ liệu và thiếu phân trang.
   * Kiểm tra xử lý blocking, thao tác lặp lại không cần thiết và memory leak.
   * Kiểm tra timeout, retry, cache, connection pool và external API call.
   * Chỉ ra các điểm có nguy cơ gây chậm khi dữ liệu hoặc lượng người dùng tăng lên.

5. **Bảo mật**

   * Kiểm tra SQL injection, command injection, XSS, CSRF, SSRF, path traversal và insecure deserialization.
   * Kiểm tra authentication, authorization, IDOR, phân quyền và mass assignment.
   * Kiểm tra file upload, CORS, cookie, session, JWT, rate limit và input validation.
   * Tìm secret, token, API key, password hoặc dữ liệu nhạy cảm bị hard-code hoặc ghi log.
   * Kiểm tra dependency cũ hoặc có nguy cơ bảo mật.
   * Với mỗi vấn đề bảo mật, mô tả điều kiện xảy ra, mức ảnh hưởng và cách phòng ngừa. Không cung cấp hướng dẫn khai thác gây hại không cần thiết.

6. **Xử lý lỗi và độ ổn định**

   * Kiểm tra try-catch, error propagation, HTTP status code và error message.
   * Phát hiện lỗi bị bỏ qua, catch quá rộng hoặc log không đủ thông tin.
   * Kiểm tra cleanup resource, rollback transaction, timeout và retry.
   * Kiểm tra logging, request ID, correlation ID và graceful shutdown nếu phù hợp.

7. **Coding convention**

   * Kiểm tra format, naming convention, import, linter, formatter và static analysis.
   * Phát hiện TODO không có kế hoạch xử lý, code bị comment-out và quy ước không nhất quán.
   * Không ưu tiên lỗi style nhỏ hơn lỗi logic, bảo mật hoặc lỗi production.

8. **Code trùng lặp**

   * Tìm các đoạn code hoặc business rule bị sao chép ở nhiều vị trí.
   * Kiểm tra validation, mapping dữ liệu, error handling và utility gần giống nhau.
   * Đề xuất abstraction phù hợp nhưng tránh refactor quá mức.

9. **Test**

   * Kiểm tra unit test, integration test và end-to-end test hiện có.
   * Xác định các luồng quan trọng chưa có test.
   * Kiểm tra happy path, error path, boundary case và authorization case.
   * Đề xuất test case cụ thể cho từng lỗi được phát hiện.

## Quy trình thực hiện

### Bước 1: Lập bản đồ dự án

Đầu tiên, hãy đọc cấu trúc repository và lập bảng:

| Khu vực | File hoặc thư mục chính | Vai trò | Mức độ quan trọng | Trạng thái review |
| ------- | ----------------------- | ------- | ----------------- | ----------------- |

Xác định:

* Điểm khởi động của ứng dụng.
* Luồng nghiệp vụ chính.
* Các module quan trọng.
* Database, cache, queue và external service.
* Authentication và authorization.
* Vị trí test.
* File cấu hình.
* Công cụ build, lint, type-check và CI/CD.

### Bước 2: Chạy kiểm tra tự động nếu môi trường cho phép

Tìm và chạy các lệnh phù hợp với dự án:

* Build.
* Lint.
* Type-check.
* Unit test.
* Integration test.
* Test coverage.
* Dependency audit.
* Static security scan.

Không tự ý sửa code ở bước này.

Ghi kết quả theo bảng:

| Lệnh đã chạy | Kết quả | Lỗi hoặc cảnh báo đáng chú ý |
| ------------ | ------- | ---------------------------- |

Nếu không chạy được lệnh nào, ghi rõ nguyên nhân.

### Bước 3: Review thủ công theo thứ tự ưu tiên

Ưu tiên review:

1. Authentication, authorization và phân quyền.
2. Business logic quan trọng.
3. API public và input từ bên ngoài.
4. Database, transaction và migration.
5. File upload, secret, token và dữ liệu nhạy cảm.
6. Error handling và logging.
7. Hiệu năng.
8. Khả năng bảo trì.
9. Code trùng lặp.
10. Test và tài liệu.

## Quy tắc bắt buộc

* Không nhận xét chung chung.
* Không khẳng định đã review file chưa đọc.
* Không bịa file, function hoặc số dòng.
* Mỗi vấn đề phải gắn với bằng chứng cụ thể từ code.
* Nếu chưa đủ dữ liệu để kết luận, ghi rõ: `Cần xác minh thêm`.
* Ưu tiên đề xuất bản sửa nhỏ, an toàn và dễ kiểm chứng trước khi đề xuất refactor lớn.
* Nếu repository quá lớn, chia thành từng nhóm module và ghi rõ phạm vi đã review.
* Không bỏ qua file âm thầm.
* Phân biệt rõ lỗi bắt buộc sửa, rủi ro nên xử lý và cải tiến có thể thực hiện sau.

## Phân loại mức độ ưu tiên

* **P0 — Critical:** Có thể gây mất dữ liệu, rò rỉ dữ liệu nghiêm trọng, chiếm quyền hệ thống hoặc lỗi production diện rộng. Phải sửa ngay trước khi release.
* **P1 — High:** Có khả năng gây lỗi thực tế, downtime, dữ liệu không nhất quán hoặc lỗ hổng bảo mật đáng kể. Nên sửa trước release gần nhất.
* **P2 — Medium:** Làm tăng rủi ro bảo trì, giảm hiệu năng hoặc dễ phát sinh lỗi trong tương lai. Nên xử lý trong sprint gần nhất.
* **P3 — Low:** Cải tiến về readability, convention, tài liệu hoặc tối ưu nhỏ.

Không nâng mức độ nghiêm trọng chỉ để báo cáo trông quan trọng hơn.

## Định dạng báo cáo bắt buộc

### 1. Executive Summary

Tóm tắt:

* Đánh giá tổng quan chất lượng dự án.
* Các khu vực có rủi ro cao nhất.
* Số lượng vấn đề theo P0, P1, P2 và P3.
* Ba việc quan trọng nhất cần xử lý trước.
* Mức độ sẵn sàng release: `Chưa sẵn sàng / Có thể release sau khi sửa lỗi chính / Tương đối ổn định`.

### 2. Danh sách vấn đề

| ID | Priority | Nhóm vấn đề | File và vị trí | Mô tả | Tình huống gây lỗi | Cách khắc phục | Test cần bổ sung |
| -- | -------- | ----------- | -------------- | ----- | ------------------ | -------------- | ---------------- |

Sau bảng, giải thích chi tiết từng vấn đề quan trọng theo mẫu:

#### `[ID] — [Tên vấn đề]`

* **Mức độ:** `[P0 / P1 / P2 / P3]`
* **Nhóm:** `[Logic / Security / Performance / Maintainability / Error handling / Convention / Duplicate code / Test]`
* **Vị trí:** `[đường dẫn file, class, function, số dòng nếu xác định được]`
* **Bằng chứng:** `[đoạn code hoặc mô tả chính xác]`
* **Vì sao đây là vấn đề:** `[giải thích]`
* **Tình huống có thể xảy ra:** `[ví dụ thực tế]`
* **Cách sửa tối thiểu:** `[đề xuất cụ thể]`
* **Cách cải thiện lâu dài:** `[nếu cần]`
* **Test cần bổ sung:** `[test case cụ thể]`

Nếu phù hợp, cung cấp đoạn code sửa mẫu dưới dạng diff.

### 3. Test còn thiếu

| Priority | Module | Luồng chưa có test | Test case đề xuất | Loại test |
| -------- | ------ | ------------------ | ----------------- | --------- |

### 4. Code trùng lặp

| Nhóm logic trùng lặp | Các vị trí | Rủi ro | Đề xuất refactor | Priority |
| -------------------- | ---------- | ------ | ---------------- | -------- |

### 5. Kế hoạch xử lý

Chia thành:

* **Giai đoạn 1:** Sửa P0 và P1 trước release.
* **Giai đoạn 2:** Xử lý P2 trong sprint gần nhất.
* **Giai đoạn 3:** Xử lý P3, refactor và cải thiện dài hạn.

Dùng bảng:

| Thứ tự | Công việc | File hoặc module liên quan | Priority | Độ phức tạp ước tính | Cách xác minh sau khi sửa |
| ------ | --------- | -------------------------- | -------- | -------------------- | ------------------------- |

### 6. Phạm vi đã review

| Khu vực | File đã review | File chưa review | Lý do chưa review | Mức độ tin cậy |
| ------- | -------------- | ---------------- | ----------------- | -------------- |

Bắt đầu bằng việc lập **Project Map**, sau đó chạy các kiểm tra tự động phù hợp và review lần lượt từng module theo mức độ ưu tiên.
