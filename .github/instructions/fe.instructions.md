---
description: Frontend coding rules — apply when working with UI components, pages, hooks, stores, and client-side logic.
applyTo: "**/{components,pages,views,hooks,stores,composables,layouts,features}/**,**/*.{jsx,tsx,vue}"
---

# Frontend Coding Guidelines

## 1. Giới hạn kích thước file
- **Tối đa 500 dòng mỗi file** — nếu vượt quá, phải tách component/hook.
- Mỗi file chỉ export **một component chính** hoặc **một hook/composable**.
- Không được gộp nhiều UI concerns vào cùng một file.

## 2. Cấu trúc thư mục
```
src/
  features/          # Tổ chức theo feature/domain (ưu tiên)
    <feature>/
      components/    # Components thuộc riêng feature này
      hooks/         # Custom hooks của feature
      api.ts         # Gọi API của feature
      store.ts       # State của feature (Zustand / Pinia slice)
      types.ts       # Types / interfaces
      index.ts       # Re-export public API của feature
  components/        # Shared/reusable components (Button, Modal, Input...)
  hooks/             # Shared custom hooks
  layouts/
  pages/ (hoặc app/ với Next.js / views/ với Vue)
  utils/
  constants/
  types/
```
- Không để file component trực tiếp trong `src/` — phải thuộc feature hoặc shared.

## 3. Component
- **Một component = một trách nhiệm**: hiển thị, tương tác, hoặc kết nối data — không gộp cả ba.
- Tách **Container** (logic, data fetching) và **Presentational** (chỉ nhận props, render UI).
- Không fetch data trực tiếp bên trong presentational component.
- Props quá nhiều (> 5-6 props) → xem xét tách component hoặc dùng object prop.

```tsx
// ĐÚNG — Presentational component
function UserCard({ name, avatar, role }: UserCardProps) {
  return <div>...</div>;
}

// SAI — logic và UI lẫn lộn
function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  useEffect(() => { fetch(`/api/users/${userId}`).then(...) }, []);
  return <div>...</div>;
}
```

## 4. Custom Hooks / Composables
- Tách logic ra hook riêng khi logic dùng lại được hoặc dài hơn **20 dòng**.
- Tên hook bắt đầu bằng `use` (React) hoặc `use` (Vue composable).
- Hook chỉ chứa logic — không trả về JSX.
- Một hook chỉ làm một việc: `useUserProfile`, `useInfiniteScroll`, `useCart`.

## 5. Đặt tên
| Loại | Quy ước | Ví dụ |
|------|---------|-------|
| Component file | PascalCase | `UserProfileCard.tsx` |
| Hook / Composable file | camelCase | `useUserProfile.ts` |
| Store / API file | camelCase | `userStore.ts`, `userApi.ts` |
| Biến / function | camelCase | `handleSubmit`, `isLoading` |
| Hằng số | UPPER_SNAKE | `MAX_PAGE_SIZE` |
| CSS class | kebab-case | `user-profile-card` |
| Boolean state/prop | prefix `is/has/can/should` | `isLoading`, `hasError` |

- Tên component rõ nghĩa, đủ context: `UserProfileCard`, không phải `Card` hay `Component1`.
- Event handler prefix `handle`: `handleSubmit`, `handleDelete`.

## 6. State Management
- **Ưu tiên local state** trước — chỉ đưa lên global store khi thực sự cần chia sẻ.
- Không lưu dữ liệu có thể tính toán được vào state (derived state).
- Server state dùng thư viện chuyên biệt (React Query / SWR / Vue Query) — không tự quản lý loading/error bằng `useState`.
- Store toàn cục chỉ chứa: auth, theme, cart, global UI state.

## 7. Gọi API
- Tập trung gọi API trong file `api.ts` của mỗi feature — không fetch trực tiếp trong component.
- Dùng React Query / SWR để caching, refetching, loading/error state tự động.
- Không hardcode base URL — dùng biến môi trường (`VITE_API_URL`, `NEXT_PUBLIC_API_URL`).

```typescript
// features/user/api.ts
export const userApi = {
  getProfile: (id: string) => apiClient.get<UserProfile>(`/users/${id}`),
  updateProfile: (id: string, data: UpdateProfileDto) =>
    apiClient.put<UserProfile>(`/users/${id}`, data),
};
```

## 8. TypeScript
- **Không dùng `any`** — dùng `unknown` nếu thực sự không biết type, sau đó narrow.
- Định nghĩa interface/type trong file `types.ts` của feature — không inline type phức tạp.
- Props của component phải có type rõ ràng, không dùng `React.FC` trừ khi cần `children`.
- Không dùng type assertion (`as`) nếu có cách khác.

## 9. Styling
- Chọn **một** phương pháp styling và nhất quán: Tailwind CSS, CSS Modules, hoặc styled-components.
- Không mix inline styles với class-based styles trong cùng component.
- Không magic number trong style — dùng design token / Tailwind classes.
- Class name dài → tách thành biến `const cardClass = cn(...)`.

## 10. Performance
- Không tối ưu sớm — chỉ dùng `useMemo`/`useCallback`/`memo` khi đo được vấn đề thực sự.
- Lazy load route-level components (`React.lazy` / `defineAsyncComponent`).
- Hình ảnh phải có `width`, `height`, và lazy loading.
- Không re-render không cần thiết: tránh tạo object/array mới mỗi render.

## 11. Bảo mật
- Không render HTML từ user input trực tiếp (`dangerouslySetInnerHTML` / `v-html`) — nếu cần phải sanitize.
- Không lưu token nhạy cảm vào `localStorage` khi có thể dùng `httpOnly cookie`.
- Không expose API key, secret trong client-side code.
- Validate và sanitize input form ở client (UX) **và** server (bảo mật).

## 12. Comments
- Không comment những gì code đã tự nói được.
- Comment khi giải thích **tại sao** (why), không phải **cái gì** (what).
- Không để code commented-out — dùng git history thay thế.

## 13. Tách file khi nào?
- File vượt **450 dòng** → tách ngay.
- Component có nhiều hơn **2 sub-sections** UI phức tạp → tách thành sub-components.
- Logic trong component dài hơn **20 dòng** → tách thành custom hook.
- Dùng lại logic/UI ở 2+ nơi → tách thành shared.

## 14. Code Review Checklist
- [ ] File không quá 500 dòng
- [ ] Không có `any` type
- [ ] Không có `console.log` bỏ quên
- [ ] Không hardcode string/number quan trọng
- [ ] Component có tên rõ nghĩa
- [ ] Không fetch API trực tiếp trong presentational component
- [ ] State tối thiểu cần thiết, không dư thừa