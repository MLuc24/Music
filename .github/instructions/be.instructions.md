---
description: Backend coding rules — apply when working with server-side code (API, services, controllers, database, etc.)
applyTo: "**/{controllers,services,repositories,middlewares,routes,models,utils,helpers,jobs,validators}/**,**/api/**"
---

# Backend Coding Guidelines

## 1. Giới hạn kích thước file
- **Tối đa 500 dòng mỗi file** — nếu vượt quá, phải tách module.
- Mỗi file chỉ chịu trách nhiệm **một việc duy nhất** (Single Responsibility Principle).
- Không được gộp nhiều domain logic vào cùng một file.

## 2. Cấu trúc thư mục (Clean Architecture)
```
src/
  modules/
    <tên-module>/
      <module>.controller.ts   # Nhận request, trả response — không chứa business logic
      <module>.service.ts      # Business logic thuần túy
      <module>.repository.ts   # Truy vấn database
      <module>.dto.ts          # Request/Response types, validation schemas
      <module>.routes.ts       # Khai báo routes của module
      <module>.test.ts         # Unit tests
  middlewares/
  utils/
  config/
  app.ts
  server.ts
```
- Mỗi thư mục `module` là một domain độc lập, không phụ thuộc chéo trực tiếp.
- Dùng dependency injection hoặc service imports rõ ràng, không import vòng (circular).

## 3. Controller
- Chỉ được làm: validate input → gọi service → trả response/error.
- **Không** chứa SQL, business logic, hoặc gọi database trực tiếp.
- Tối đa **5-7 handler** mỗi controller file.

```typescript
// ĐÚNG
async getUser(req: Request, res: Response) {
  const user = await this.userService.findById(req.params.id);
  res.json(user);
}

// SAI — business logic trong controller
async getUser(req: Request, res: Response) {
  const user = await db.query(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
  if (!user.active) { /* ... */ }
  res.json(user);
}
```

## 4. Service
- Chỉ chứa business logic — không import `req`/`res`, không trả HTTP status.
- Throw custom Error khi có lỗi; controller bắt và convert sang HTTP response.
- Functions ngắn: **tối đa 40 dòng** mỗi function; tách thành helper private nếu dài hơn.

## 5. Repository / Data Layer
- Tất cả truy vấn database tập trung tại đây.
- Trả về entity/plain object — không trả raw SQL result.
- Không được chứa business logic.

## 6. Đặt tên
| Loại | Quy ước | Ví dụ |
|------|---------|-------|
| File | kebab-case | `user-profile.service.ts` |
| Class | PascalCase | `UserProfileService` |
| Biến / function | camelCase | `getUserById` |
| Hằng số | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Enum | PascalCase | `UserStatus.ACTIVE` |
| Interface/Type | PascalCase, prefix `I` tùy dự án | `IUserPayload` hoặc `UserPayload` |

- Tên hàm bắt đầu bằng **động từ**: `getUser`, `createOrder`, `validateToken`.
- Không dùng tên mơ hồ: `handle`, `process`, `doStuff`, `temp`, `data2`.

## 7. Error Handling
- Dùng custom error class có `statusCode` và `message` rõ ràng.
- Có **global error handler middleware** — không try/catch lặp lại ở mọi controller.
- Log error đầy đủ (stack trace) với thư viện logging (winston / pino).
- Không bao giờ expose stack trace ra response production.

```typescript
// Custom error
class AppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
  }
}
throw new AppError('User not found', 404);
```

## 8. Validation
- Validate input tại **lớp Controller/Route** bằng schema (Zod / Joi / class-validator).
- Không validate thủ công bằng `if (!req.body.email)` rải rác.
- DTO file riêng biệt — không inline schema trong controller.

## 9. Async / Await
- Luôn dùng `async/await`, không dùng callback lồng nhau.
- Mọi async function phải được `await` — không bỏ sót (floating promise).
- Dùng `Promise.all` khi có nhiều async không phụ thuộc nhau.

## 10. Database
- Không viết raw SQL ngoài repository layer.
- Dùng transaction khi thao tác trên nhiều bảng.
- Không SELECT *, chỉ lấy các field cần thiết.
- Index các cột thường dùng trong WHERE / JOIN.

## 11. Bảo mật (OWASP)
- Sanitize tất cả input trước khi đưa vào query (chống SQL Injection / NoSQL Injection).
- Không log thông tin nhạy cảm (password, token, PII).
- Dùng biến môi trường (`.env`) cho secrets — không hardcode.
- Rate limiting cho các endpoint public.
- Luôn verify JWT / session trước khi xử lý request bảo vệ.

## 12. Comments & Docs
- Không comment những gì code đã tự nói được.
- Comment khi giải thích **tại sao** (why), không phải **cái gì** (what).
- Mỗi public function trong service phải có JSDoc tóm tắt mục đích.

## 13. Tách file khi nào?
- File vượt **450 dòng** → tách ngay.
- Một file có hơn **2 concerns** (2 trách nhiệm) → tách ngay.
- Hàm dài hơn **40 dòng** → tách thành hàm nhỏ hơn.

## 14. Testing
- Mỗi service phải có unit test tương ứng.
- Mock database/external calls — test không được kết nối DB thật.
- Tên test: `describe('UserService')` → `it('should return user by id')`.