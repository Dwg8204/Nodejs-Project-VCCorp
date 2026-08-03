# 04. Frontend Angular

## 1. Kiến trúc frontend

Ứng dụng dùng Angular standalone và lazy loading. Không có NgModule page truyền thống.

```text
Component/Page
  -> feature API service (ContentApiService, AdminContentApiService, ...)
  -> ApiClientService
  -> HttpClient + interceptors
  -> NestJS
```

Auth có thêm repository abstraction:

```text
AuthService -> AuthRepository token -> AuthApiRepository -> ApiClientService
```

## 2. Route và layout

### Public layout

- `/`: homepage.
- `/article/:id`: chi tiết bài.
- `/profile`: hồ sơ của tôi, cần auth.
- `/profile/:id`: hồ sơ công khai.
- `/login`, `/register`, `/forgot-password`: chỉ dành cho guest.

### Blog Owner

- `/owner/posts`: quản lý bài của tôi.
- `/owner/posts/new`: tạo bài.
- `/owner/posts/:id/edit`: chỉnh sửa bài.
- Guard: auth + `BLOG_OWNER`.

### Admin layout

- `/admin/dashboard`
- `/admin/posts`
- `/admin/users`
- `/admin/categories`
- `/admin/languages`
- `/admin/logs`
- Guard: auth + `SUPER_ADMIN`.

Route `**` mở trang 404.

## 3. Khởi tạo phiên đăng nhập

`APP_INITIALIZER` gọi `AuthService.initializeSession()` trước khi app hoạt động:

1. Xóa token/user cũ từng lưu localStorage.
2. Gọi `GET /auth/me` bằng HttpOnly cookie.
3. Nếu thành công, lưu user vào `AuthSessionStore` signal.
4. Nếu 401, session là null.
5. Guard dùng signal này để quyết định route.

Access token **không đọc được bằng JavaScript** vì nằm trong HttpOnly cookie. Đây là chủ ý chống đánh cắp token qua XSS.

## 4. Core services

| Service | Vai trò |
|---|---|
| `ApiClientService` | ghép base URL, query params, `withCredentials` |
| `AuthService` / `AuthSessionStore` | phiên user, role, login/logout/reset |
| `ContentApiService` | public posts, comments, likes, preview |
| `OwnerPostsApiService` | CRUD/submit bài owner |
| `AdminContentApiService` | admin posts/categories/languages |
| `AdminUsersApiService` | user management |
| `AdminAuditLogsApiService` | audit log |
| `DashboardApiService` | dashboard snapshot |
| `ProfileApiService` | profile/password/profile image |
| `ImageUploadService` | upload Cloudinary qua backend |
| `LanguageService` | danh sách language + JSON UI pack |
| `NotificationService` | thông báo giao diện chuẩn |
| `LoadingService` | trạng thái loading toàn app |
| `UiSelectService` | hành vi dropdown dùng lại |

## 5. Interceptors và lỗi

- `loadingInterceptor`: tăng/giảm loading counter quanh request.
- `apiErrorInterceptor`: chuẩn hóa lỗi API để component/service hiển thị bằng notification thay vì `console.log`.
- Auth errors được map sang key như `auth.error.AUTH_INVALID_CREDENTIALS` trong JSON i18n.

Khi thêm API mới, không gọi `HttpClient` trực tiếp trong component. Hãy thêm method vào feature service rồi component subscribe/cập nhật signal.

## 6. State và change detection

- Component chủ yếu dùng `signal`, `computed`, `effect`.
- API là RxJS Observable; response được đẩy vào signal.
- Page dùng `ChangeDetectionStrategy.OnPush`.
- State phiên dùng `AuthSessionStore`, không dùng localStorage.
- Preference nhẹ như `blog-lang` vẫn lưu trình duyệt qua `StorageService`.

## 7. i18n: hai loại bản dịch khác nhau

### UI translation

File:

```text
frontend-angular/public/i18n/vi.json
frontend-angular/public/i18n/en.json
frontend-angular/public/i18n/zh.json
```

`LanguageService.translate(key)` lấy key từ pack hiện tại; nếu thiếu, code hiện tại thử English rồi trả chính key. `choose(vi, en)` vẫn tồn tại cho runtime string cũ và cố tìm key hash sinh bởi script.

Lệnh hỗ trợ:

```powershell
cd frontend-angular
npm run i18n:generate
npm run i18n:audit
```

### Content translation

Tên category và title/content bài đến từ `category_translation` và `post_translations`. Component chọn translation có `languageId === LanguageService.languageId()`.

Vì vậy:

- Có JSON UI nhưng thiếu translation DB: menu dịch được, nội dung có thể thiếu.
- Có translation DB nhưng thiếu JSON UI: bài dịch được, nút/menu fallback English/key.

## 8. Form bài viết

`PostFormComponent` quản lý:

- source language;
- category theo ngôn ngữ đang chọn;
- thumbnail upload;
- title/content editor;
- translations và preview nổi;
- create/update qua owner API.

Nút xuất bản của Blog Owner thực tế phải gửi bài sang `PENDING`; chỉ admin chuyển thành `PUBLISHED`.

Ảnh editor/thumbnail phải upload qua `/uploads/images`, sau đó nhúng URL Cloudinary. CSS preview/article ép media `max-width:100%` để không tràn ngang.

## 9. Comments

`ArticleComponent`:

- tải comment public;
- gom root/replies thành hai tầng;
- mặc định chỉ hiện hai reply cuối, có nút xem/ẩn thêm;
- in đậm mention người được trả lời;
- không tự mention chính mình;
- chỉ hiện Xóa cho comment thuộc current user;
- dùng modal xác nhận cùng style logout;
- xóa root cập nhật count bằng `deletedCount` backend trả về.

## 10. Dashboard realtime

`AdminDashboardComponent` mở:

```ts
new EventSource(`${APP_CONFIG.apiBaseUrl}/admin/dashboard/events`, {
  withCredentials: true,
});
```

Khi nhận like/comment event, component gọi lại `GET /admin/dashboard`. Chart.js được destroy/re-render khi data đổi. Event không lưu lịch sử; reload trang luôn lấy snapshot hiện tại từ API.

## 11. Pagination và responsive

- Utility chung: `shared/utils/pagination.ts`.
- Kiểu mong muốn: Previous, first/current/last, ellipsis, Next, nhập trang, nhập số mục/trang.
- Desktop management dùng table.
- Mobile management chuyển mỗi row thành card/object, không ép table tràn ngang.
- Khi thêm trang quản lý, tái sử dụng cùng utility và class style thay vì tạo pagination riêng.

## 12. Thêm một màn hình mới đúng cách

1. Tạo model contract trong `core/models` nếu cần.
2. Thêm method trong feature API service.
3. Tạo standalone component TS/HTML/SCSS.
4. Dùng signal/computed cho state, notification cho lỗi.
5. Thêm route lazy và guard phù hợp.
6. Thêm toàn bộ key vi/en/zh rồi chạy `npm run i18n:audit`.
7. Kiểm tra desktop/mobile, light/dark và role liên quan.
8. `npm run build` trước khi commit.
