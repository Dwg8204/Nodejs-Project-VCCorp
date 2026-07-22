# Cẩm nang nền tảng Frontend và Angular cho VCCorp Project

> Tài liệu dành cho người mới, được viết dựa trên mã nguồn hiện tại trong thư mục `docs/` và kế hoạch chuyển giao diện sang Angular.

## Mục lục

1. Bức tranh tổng thể của một ứng dụng web
2. HTML: xây dựng cấu trúc giao diện
3. CSS: trình bày và responsive
4. JavaScript: dữ liệu và hành vi
5. TypeScript: JavaScript có kiểu dữ liệu
6. Angular: kiến thức cần dùng trong dự án
7. Ánh xạ code hiện tại sang Angular
8. Lộ trình thực hành đề xuất
9. Checklist trước khi bắt đầu chuyển đổi

---

# 1. Bức tranh tổng thể của một ứng dụng web

Một trang web trong dự án hiện tại gồm ba lớp chính:

```text
HTML        → cấu trúc: trên trang có những gì?
CSS         → trình bày: các phần đó trông như thế nào?
JavaScript  → hành vi: người dùng thao tác thì điều gì xảy ra?
```

Ví dụ thẻ bài viết ở trang chủ:

```html
<article class="article-card">
  <img class="article-thumb" src="thumbnail.jpg" alt="Ảnh bài viết">

  <div class="article-main">
    <h2 class="article-title">Tiêu đề bài viết</h2>
    <p class="article-desc">Mô tả ngắn...</p>
    <button type="button" class="like-btn">Thích</button>
  </div>
</article>
```

CSS quyết định bố cục:

```css
.article-card {
  display: flex;
  gap: 24px;
  padding: 24px 0;
}
```

JavaScript xử lý lượt thích:

```js
const likeButton = document.querySelector('.like-btn');

likeButton.addEventListener('click', () => {
  likeButton.classList.toggle('liked');
});
```

Khi chuyển sang Angular, ba lớp này vẫn còn, nhưng Angular tổ chức chúng thành **component** và tự đồng bộ dữ liệu với giao diện.

---

# 2. HTML: xây dựng cấu trúc giao diện

## 2.1 HTML là gì?

HTML mô tả ý nghĩa và cấu trúc của nội dung. HTML không chịu trách nhiệm xử lý dữ liệu hoặc thiết kế giao diện phức tạp.

Một tài liệu cơ bản:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VCCorp Blog</title>
  </head>

  <body>
    <header>Thanh điều hướng</header>
    <main>Nội dung chính</main>
    <footer>Chân trang</footer>
  </body>
</html>
```

Các phần quan trọng:

- `<!doctype html>`: khai báo HTML5.
- `lang="vi"`: ngôn ngữ chính của trang.
- `charset="UTF-8"`: hiển thị đúng tiếng Việt.
- `viewport`: giúp responsive trên mobile.
- `head`: metadata, CSS, title.
- `body`: nội dung người dùng nhìn thấy.

## 2.2 Semantic HTML

Nên chọn thẻ theo ý nghĩa:

| Thẻ | Mục đích |
|---|---|
| `header` | Phần đầu trang hoặc đầu một khu vực |
| `nav` | Khu vực điều hướng |
| `main` | Nội dung chính, thường chỉ có một thẻ |
| `aside` | Sidebar hoặc nội dung phụ |
| `article` | Một nội dung độc lập như bài viết |
| `section` | Một nhóm nội dung có cùng chủ đề |
| `footer` | Chân trang hoặc chân khu vực |

Ví dụ bố cục của dự án:

```html
<header class="topbar">...</header>

<div class="layout">
  <aside class="sidebar">...</aside>

  <main class="feed-wrapper">
    <section class="feed-list">
      <article class="article-card">...</article>
    </section>
  </main>

  <aside class="right-rail">...</aside>
</div>
```

Semantic HTML giúp:

- Trình đọc màn hình hiểu trang.
- SEO tốt hơn.
- Code dễ đọc.
- Angular component dễ phân tách hơn.

## 2.3 Thuộc tính `id` và `class`

```html
<input id="searchPosts" class="form-control search-input">
```

- `id` nên duy nhất trong một trang.
- `class` có thể dùng lại cho nhiều phần tử.
- CSS thường chọn bằng class.
- JavaScript hiện tại thường tìm bằng `id`.

```js
const searchInput = document.getElementById('searchPosts');
```

Trong Angular, ta thường không cần tìm DOM bằng `id`; dữ liệu được nối qua binding.

## 2.4 Link và button

Dùng link khi điều hướng:

```html
<a href="article.html?id=12">Đọc bài viết</a>
```

Dùng button khi thực hiện hành động:

```html
<button type="button" onclick="approvePost(12)">Duyệt</button>
```

Không nên dùng `div` thay cho button vì mất khả năng thao tác bàn phím và accessibility.

Trong Angular:

```html
<a [routerLink]="['/articles', post.id]">Đọc bài viết</a>
<button type="button" (click)="approvePost(post.id)">Duyệt</button>
```

## 2.5 Form

Form tạo bài viết hiện có các trường:

```html
<form>
  <label for="postTitle">Tiêu đề</label>
  <input id="postTitle" type="text">

  <label for="categoryId">Danh mục</label>
  <select id="categoryId">
    <option value="1">Công nghệ</option>
  </select>

  <label for="postThumbnail">Ảnh đại diện</label>
  <input id="postThumbnail" type="file" accept="image/*">

  <button type="submit">Lưu</button>
</form>
```

Quy tắc quan trọng:

- `label[for]` phải trỏ tới `input[id]`.
- Nút gửi form dùng `type="submit"`.
- Nút phụ dùng `type="button"` để tránh submit nhầm.
- Validation frontend giúp UX, nhưng backend vẫn phải kiểm tra lại.

## 2.6 Accessibility cơ bản

Ví dụ dropdown:

```html
<button
  type="button"
  aria-haspopup="listbox"
  aria-expanded="false"
>
  Tất cả trạng thái
</button>
```

Ví dụ trang hiện tại trong phân trang:

```html
<button aria-current="page">2</button>
```

Cần chú ý:

- Có trạng thái focus rõ ràng.
- Có thể thao tác bằng Tab, Enter, Space, Escape.
- Ảnh phải có `alt` phù hợp.
- Icon không có chữ cần `aria-label`.
- Modal cần giữ focus bên trong khi đang mở.

---

# 3. CSS: trình bày và responsive

## 3.1 Cú pháp CSS

```css
.article-title {
  color: #222;
  font-size: 24px;
  font-weight: 700;
}
```

- `.article-title`: selector.
- `color`: property.
- `#222`: value.

## 3.2 Box model

Mỗi element là một hộp:

```text
margin
  border
    padding
      content
```

```css
.card {
  width: 300px;
  padding: 20px;
  border: 1px solid #ddd;
  margin-bottom: 16px;
  box-sizing: border-box;
}
```

`box-sizing: border-box` giúp `width` bao gồm cả padding và border, hạn chế tràn layout.

## 3.3 CSS variables

Dự án đang dùng biến để hỗ trợ theme:

```css
:root {
  --card-bg: #fff;
  --text: #222;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --accent: #2f8f46;
}

[data-theme="dark"] {
  --card-bg: #1c1c1c;
  --text: #f5f5f5;
  --border: #333;
}
```

Component sử dụng:

```css
.card {
  color: var(--text);
  background: var(--card-bg);
  border: 1px solid var(--border);
}
```

Khi chuyển Angular, nên giữ các biến này trong `src/styles.css`.

## 3.4 Flexbox

Flex phù hợp bố trí theo một chiều:

```css
.article-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}
```

Các thuộc tính cần biết:

- `flex-direction`: hàng hay cột.
- `justify-content`: căn theo trục chính.
- `align-items`: căn theo trục phụ.
- `gap`: khoảng cách.
- `flex-grow`, `flex-shrink`, `flex-basis`.
- `flex-wrap`: tự xuống dòng.

## 3.5 CSS Grid

Grid phù hợp bố trí theo cả hàng và cột.

Ví dụ audit filter hiện tại:

```css
.audit-filter-row {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 12px;
  padding: 14px;
}
```

Giải thích:

- `auto-fit`: trình duyệt tự tính số cột.
- `minmax(220px, 1fr)`: cột tối thiểu 220px, được phép giãn.
- Không đủ chỗ thì tự xuống hàng.
- `min(100%, 220px)` tránh tràn trên màn hình nhỏ hơn 220px.

## 3.6 Position

```css
.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 900;
}
```

```css
.sidebar {
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
}
```

Phân biệt:

- `static`: mặc định.
- `relative`: làm mốc cho phần tử con absolute.
- `absolute`: thoát khỏi dòng bình thường, bám mốc gần nhất.
- `fixed`: bám viewport.
- `sticky`: bám khi cuộn trong phạm vi container.

`z-index` chỉ có ý nghĩa khi hiểu stacking context. Modal phải có `z-index` cao hơn topbar.

## 3.7 Responsive

Ví dụ:

```css
@media (max-width: 760px) {
  .article-card {
    flex-direction: column;
  }

  .article-thumb {
    width: 100%;
  }
}
```

Nên kiểm tra tối thiểu:

- 360px.
- 390px.
- 768px.
- 1024px.
- 1440px.

## 3.8 Hàm CSS hiện đại

Dự án có ví dụ:

```css
.feed-wrapper {
  padding: 36px clamp(24px, 4vw, 52px) 72px;
}

.article-title {
  font-size: clamp(21px, 2vw, 26px);
}
```

`clamp(min, preferred, max)` tạo kích thước co giãn nhưng không vượt giới hạn.

## 3.9 Ảnh responsive

Lỗi ảnh trong nội dung bị tràn được xử lý bằng:

```css
.body-text img,
.preview-text-content img {
  display: block;
  width: auto;
  max-width: 100% !important;
  height: auto !important;
  margin: 22px auto;
  object-fit: contain;
}
```

Nguyên tắc:

- `max-width: 100%`: ảnh không rộng hơn container.
- `height: auto`: giữ tỷ lệ.
- `object-fit`: cách ảnh nằm trong khung.

## 3.10 Animation và reduce motion

Dự án có hỗ trợ người muốn giảm chuyển động:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
```

Khi chuyển Angular, CSS này vẫn sử dụng bình thường.

---

# 4. JavaScript: dữ liệu và hành vi

## 4.1 Biến

```js
const pageSize = 5; // không gán lại
let currentPage = 1; // có thể gán lại
```

Ưu tiên `const`; chỉ dùng `let` khi cần thay đổi tham chiếu.

Không nên dùng `var` trong code mới.

## 4.2 Kiểu dữ liệu

```js
const title = 'Angular cơ bản';       // string
const likes = 20;                    // number
const published = true;              // boolean
const thumbnail = null;              // null
const post = { id: 1, title };        // object
const posts = [post];                 // array
```

JavaScript là ngôn ngữ kiểu động. TypeScript sẽ bổ sung kiểm tra kiểu.

## 4.3 Function

```js
function getPostById(posts, id) {
  return posts.find(post => post.id === id);
}
```

Arrow function:

```js
const publishedPosts = posts.filter(
  post => post.status === 'PUBLISHED'
);
```

## 4.4 Array methods

Đây là nhóm cần sử dụng thành thạo.

### `find`

```js
const post = posts.find(post => post.id === 12);
```

Trả về một phần tử hoặc `undefined`.

### `filter`

```js
const pendingPosts = posts.filter(
  post => post.status === 'PENDING'
);
```

Trả về mảng mới.

### `map`

```js
const titles = posts.map(post => post.title);
```

Biến mỗi phần tử thành giá trị khác.

### `sort`

Trang chủ đang sắp mới nhất trước:

```js
posts.sort(
  (a, b) => new Date(b.created_at) - new Date(a.created_at)
);
```

Lưu ý `sort()` thay đổi mảng gốc. Muốn giữ mảng cũ:

```js
const sortedPosts = [...posts].sort(...);
```

### `some`

```js
const hasEnglish = translations.some(
  item => item.language_id === 1
);
```

### `reduce`

```js
const totalLikes = posts.reduce(
  (total, post) => total + post.likes,
  0
);
```

## 4.5 Destructuring và spread

```js
const { title, content } = post;

const updatedPost = {
  ...post,
  status: 'PENDING',
  updated_at: new Date().toISOString()
};
```

Spread rất hữu ích để cập nhật dữ liệu bất biến trong Angular.

## 4.6 Optional chaining và nullish coalescing

Code dự án có dạng:

```js
const actorId = currentActor?.id ?? null;
```

- `?.`: chỉ truy cập khi giá trị không null/undefined.
- `??`: dùng giá trị bên phải khi bên trái null/undefined.

Khác với `||`:

```js
const valueA = 0 || 5;  // 5
const valueB = 0 ?? 5;  // 0
```

## 4.7 DOM API

Code hiện tại render bài viết bằng:

```js
const container = document.getElementById('feed-articles');

container.innerHTML = posts.map(post => `
  <div class="article-card">
    <h2>${post.title}</h2>
  </div>
`).join('');
```

Vấn đề của cách này:

- Khó kiểm soát state.
- Dễ phát sinh XSS nếu dữ liệu không được lọc.
- Event handler thường phải gắn lại.
- Khó tái sử dụng và kiểm thử.

Angular sẽ thay bằng:

```html
@for (post of posts(); track post.id) {
  <app-post-card [post]="post" />
}
```

## 4.8 Event

JavaScript hiện tại:

```js
button.addEventListener('click', () => {
  toggleLike(postId);
});
```

Hoặc inline:

```html
<button onclick="toggleLike(12, this)">Thích</button>
```

Angular:

```html
<button (click)="toggleLike(post.id)">Thích</button>
```

## 4.9 LocalStorage

Dự án demo đang dùng:

```js
localStorage.setItem('blog-lang', 'vi');

const language = localStorage.getItem('blog-lang') || 'vi';
```

Object phải chuyển sang JSON:

```js
localStorage.setItem('posts', JSON.stringify(posts));

const posts = JSON.parse(
  localStorage.getItem('posts') || '[]'
);
```

LocalStorage phù hợp cho:

- Theme.
- Ngôn ngữ.
- Page size cá nhân.
- Mock data khi phát triển.

Không phù hợp làm database thật hoặc lưu bí mật.

## 4.10 Phân trang

Hàm hiện tại trong `docs/shared.js`:

```js
function paginateItems(items, requestedPage, pageSize) {
  const totalPages = Math.max(
    1,
    Math.ceil(items.length / pageSize)
  );

  const currentPage = Math.min(
    Math.max(1, requestedPage),
    totalPages
  );

  const startIndex = (currentPage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    currentPage,
    totalPages,
    totalItems: items.length,
    pageSize,
    startIndex
  };
}
```

Ý tưởng:

```text
startIndex = (page - 1) × pageSize
endIndex   = startIndex + pageSize
```

Với dữ liệu thật, phép phân trang sẽ chuyển sang NestJS/MySQL.

## 4.11 Async/await

Luồng lưu bài viết hiện phải chờ dịch:

```js
async function savePost() {
  try {
    const translated = await translateDraft(
      title,
      content,
      'vi',
      'en'
    );

    saveTranslation(translated);
  } catch (error) {
    showToast('Không thể hoàn tất bản dịch', 'error');
  }
}
```

`await` chỉ sử dụng bên trong hàm `async`.

Luôn xử lý lỗi bằng `try/catch` hoặc `.catch()`.

## 4.12 Module

```js
// post-utils.js
export function sortNewest(posts) {
  return [...posts].sort(...);
}

// home.js
import { sortNewest } from './post-utils.js';
```

Angular và TypeScript sử dụng module rất nhiều.

## 4.13 Bảo mật frontend cơ bản

Audit log hiện có hàm loại bỏ dữ liệu nhạy cảm:

```js
const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'otp_code'
]);
```

Không được:

- Đưa mật khẩu database vào frontend.
- Tin tưởng role do frontend gửi lên.
- Render HTML người dùng nhập mà không sanitize.
- Dùng Angular guard thay thế kiểm tra quyền NestJS.

---

# 5. TypeScript: JavaScript có kiểu dữ liệu

## 5.1 Vì sao cần TypeScript?

JavaScript cho phép:

```js
function add(a, b) {
  return a + b;
}

add(1, '2'); // kết quả "12"
```

TypeScript phát hiện sai kiểu sớm:

```ts
function add(a: number, b: number): number {
  return a + b;
}

add(1, '2'); // lỗi khi biên dịch
```

## 5.2 Kiểu cơ bản

```ts
const title: string = 'Bài viết';
const likes: number = 10;
const published: boolean = true;
const tags: string[] = ['Angular', 'TypeScript'];
```

Hạn chế sử dụng `any` vì nó tắt kiểm tra kiểu.

## 5.3 Interface cho dữ liệu dự án

```ts
export type PostStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PUBLISHED'
  | 'REJECTED';

export interface Post {
  id: number;
  authorId: number;
  categoryId: number;
  thumbnail: string;
  status: PostStatus;
  sourceLanguageId: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface PostTranslation {
  id: number;
  postId: number;
  languageId: number;
  title: string;
  content: string;
  isAutoTranslated: boolean;
}
```

Nên dùng camelCase trong Angular và ánh xạ dữ liệu snake_case từ API nếu cần.

## 5.4 Optional property

```ts
export interface AuditLog {
  id: number;
  actorId: number | null;
  entityId: number | null;
  metadata?: Record<string, unknown>;
}
```

- `?`: property có thể không tồn tại.
- `| null`: property tồn tại nhưng có thể null.

## 5.5 Generic

```ts
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
```

Sử dụng:

```ts
const posts: PaginatedResponse<Post> = ...;
const logs: PaginatedResponse<AuditLog> = ...;
```

## 5.6 Utility types

```ts
type CreatePostPayload = Omit<Post, 'id' | 'createdAt'>;
type UpdatePostPayload = Partial<CreatePostPayload>;
type PostSummary = Pick<Post, 'id' | 'thumbnail' | 'status'>;
```

Cần biết:

- `Partial<T>`.
- `Required<T>`.
- `Pick<T, K>`.
- `Omit<T, K>`.
- `Record<K, V>`.

## 5.7 Class

```ts
export class PaginationService {
  private readonly maxPageSize = 100;

  validatePageSize(value: number): boolean {
    return Number.isInteger(value)
      && value >= 1
      && value <= this.maxPageSize;
  }
}
```

Access modifier:

- `public`: truy cập từ mọi nơi.
- `private`: chỉ trong class.
- `protected`: class và class kế thừa.
- `readonly`: không gán lại sau khởi tạo.

## 5.8 Promise và Observable type

```ts
async function translate(): Promise<PostTranslation> {
  // ...
}
```

Với Angular HttpClient:

```ts
getPosts(): Observable<PaginatedResponse<Post>> {
  return this.http.get<PaginatedResponse<Post>>('/api/posts');
}
```

## 5.9 Type narrowing

```ts
function statusLabel(status: PostStatus): string {
  switch (status) {
    case 'DRAFT': return 'Bản nháp';
    case 'PENDING': return 'Chờ duyệt';
    case 'PUBLISHED': return 'Đã xuất bản';
    case 'REJECTED': return 'Bị từ chối';
  }
}
```

Vì union đã liệt kê đủ trạng thái, TypeScript giúp tránh gõ sai như `PUBLISH`.

---

# 6. Angular: kiến thức cần dùng trong dự án

## 6.1 Angular giải quyết vấn đề gì?

Trong code hiện tại, giao diện được tạo bằng chuỗi HTML:

```js
container.innerHTML = posts.map(post => `
  <div class="article-card">
    <h2>${post.title}</h2>
  </div>
`).join('');
```

Angular chuyển thành component khai báo:

```html
@for (post of posts(); track post.id) {
  <app-post-card [post]="post" />
}
```

Khi `posts` thay đổi, Angular tự cập nhật DOM.

## 6.2 Standalone Component

```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-post-card',
  standalone: true,
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css'
})
export class PostCardComponent {
  post = input.required<Post>();
  liked = output<number>();

  likePost(): void {
    this.liked.emit(this.post().id);
  }
}
```

Template:

```html
<article class="article-card">
  <img
    class="article-thumb"
    [src]="post().thumbnail"
    [alt]="post().title"
  >

  <h2>{{ post().title }}</h2>

  <button type="button" (click)="likePost()">
    Thích
  </button>
</article>
```

Kiến thức cần hiểu:

- `@Component`.
- `selector`.
- `imports`.
- Input và output.
- Component cha/con.
- CSS riêng của component.

## 6.3 Template binding

Interpolation:

```html
<h1>{{ post.title }}</h1>
```

Property binding:

```html
<img [src]="post.thumbnail">
<button [disabled]="saving()">Lưu</button>
```

Event binding:

```html
<button (click)="savePost()">Lưu</button>
```

Class binding:

```html
<span
  class="badge"
  [class.badge-green]="post.status === 'PUBLISHED'"
>
  {{ post.status }}
</span>
```

## 6.4 Control flow

```html
@if (loading()) {
  <app-loading-state />
} @else if (posts().length === 0) {
  <app-empty-state message="Không có bài viết" />
} @else {
  @for (post of posts(); track post.id) {
    <app-post-card [post]="post" />
  }
}
```

`track post.id` giúp Angular tái sử dụng DOM chính xác.

## 6.5 Signals

Signals phù hợp state giao diện:

```ts
posts = signal<Post[]>([]);
keyword = signal('');
currentPage = signal(1);
loading = signal(false);

filteredPosts = computed(() => {
  const keyword = this.keyword().trim().toLowerCase();

  return this.posts().filter(post =>
    post.title.toLowerCase().includes(keyword)
  );
});
```

Cập nhật:

```ts
this.loading.set(true);

this.posts.update(posts => [newPost, ...posts]);
```

Dùng signals cho:

- Modal mở/đóng.
- User hiện tại.
- Theme/ngôn ngữ.
- Filter.
- Page/page size.
- Loading state.

## 6.6 Service và Dependency Injection

```ts
@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);

  getPosts(query: PostQuery) {
    return this.http.get<PaginatedResponse<Post>>(
      `${environment.apiUrl}/posts`,
      { params: { ...query } }
    );
  }
}
```

Trong component:

```ts
private readonly postService = inject(PostService);
```

Service chứa logic dùng chung; component tập trung hiển thị và tương tác.

## 6.7 Router

```ts
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home-page.component')
        .then(m => m.HomePageComponent)
  },
  {
    path: 'articles/:id',
    loadComponent: () =>
      import('./features/articles/article-detail.component')
        .then(m => m.ArticleDetailComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes')
  }
];
```

Thay link cũ:

```html
<a href="article.html?id=12">Đọc</a>
```

Bằng:

```html
<a [routerLink]="['/articles', post.id]">Đọc</a>
```

Đọc param:

```ts
private readonly route = inject(ActivatedRoute);

postId = Number(this.route.snapshot.paramMap.get('id'));
```

## 6.8 Route Guard

```ts
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.currentUser()?.role === 'SUPER_ADMIN'
    ? true
    : router.createUrlTree(['/auth/login']);
};
```

Guard chỉ bảo vệ điều hướng frontend. NestJS vẫn phải kiểm tra quyền thật.

## 6.9 Reactive Forms

Form bài viết dự kiến:

```ts
postForm = this.formBuilder.nonNullable.group({
  sourceLanguage: ['vi', Validators.required],
  categoryId: [0, Validators.min(1)],
  title: ['', [
    Validators.required,
    Validators.maxLength(255)
  ]],
  thumbnail: ['', Validators.required],
  content: ['', Validators.required]
});
```

Template:

```html
<form [formGroup]="postForm" (ngSubmit)="savePost()">
  <input formControlName="title">

  @if (
    postForm.controls.title.touched &&
    postForm.controls.title.invalid
  ) {
    <p class="field-error">Tiêu đề là bắt buộc</p>
  }

  <button type="submit" [disabled]="saving()">
    Lưu
  </button>
</form>
```

Các phần cần học:

- `FormControl`.
- `FormGroup`.
- `FormArray` cho bản dịch.
- Validator.
- `patchValue()` khi sửa bài.
- `valueChanges` cho preview trực tiếp.
- `markAllAsTouched()`.

## 6.10 Custom Form Control

Dropdown và Quill nên hỗ trợ `formControlName`:

```html
<app-custom-select
  formControlName="categoryId"
  [options]="categoryOptions()"
/>

<app-rich-text-editor
  formControlName="content"
/>
```

Cần học `ControlValueAccessor` sau khi đã chắc component và Reactive Forms.

## 6.11 HttpClient và NestJS

```ts
getAuditLogs(query: AuditLogQuery) {
  return this.http.get<PaginatedResponse<AuditLog>>(
    `${environment.apiUrl}/admin/audit-logs`,
    { params: { ...query } }
  );
}
```

Angular không kết nối trực tiếp MySQL:

```text
Angular → HTTP → NestJS → MySQL
```

Cần hiểu:

- `GET`, `POST`, `PATCH`, `DELETE`.
- Request body.
- Query params.
- HTTP status `200`, `201`, `400`, `401`, `403`, `404`, `500`.
- CORS.
- Loading và error state.

## 6.12 Interceptor

```ts
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  if (!token) return next(request);

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};
```

Interceptor phù hợp cho:

- Gắn token.
- Xử lý lỗi chung.
- Loading toàn cục.
- Refresh token.
- Timeout/retry có kiểm soát.

## 6.13 RxJS cần học đến đâu?

Trước mắt chỉ cần:

- `Observable`.
- `subscribe`.
- `pipe`.
- `map`.
- `tap`.
- `catchError`.
- `finalize`.
- `debounceTime`.
- `distinctUntilChanged`.
- `switchMap`.
- `forkJoin`.

Ví dụ tìm kiếm audit log:

```ts
this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(keyword =>
    this.auditLogService.search({ keyword })
  )
).subscribe(response => {
  this.logs.set(response.items);
});
```

`switchMap` hủy request tìm kiếm cũ khi người dùng nhập tiếp.

## 6.14 Upload ảnh

```ts
uploadThumbnail(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.post<UploadResult>(
    `${environment.apiUrl}/uploads`,
    formData
  );
}
```

Luồng đúng:

```text
File → preview tạm → upload NestJS/storage → nhận URL → lưu URL vào posts.thumbnail
```

Không lưu ảnh Base64 lâu dài trong MySQL/localStorage.

## 6.15 Runtime i18n

Cần tách hai loại bản dịch:

```text
UI: Save/Lưu, Next/Sau             → file JSON/service i18n
Nội dung: title/content/category   → bảng translation trong MySQL
```

Ví dụ file UI:

```json
{
  "pagination.next": "Sau",
  "pagination.previous": "Trước",
  "admin.posts.title": "Quản lý bài viết"
}
```

Không tiếp tục thay `textContent` toàn DOM như bản JavaScript hiện tại.

## 6.16 Repository Pattern

```ts
export abstract class PostRepository {
  abstract getPosts(
    query: PostQuery
  ): Observable<PaginatedResponse<Post>>;
}
```

Adapter mock:

```ts
export class LocalStoragePostRepository extends PostRepository {
  // đọc dữ liệu demo
}
```

Adapter API:

```ts
export class HttpPostRepository extends PostRepository {
  // gọi NestJS
}
```

Component không cần biết nguồn dữ liệu, giúp chuyển đổi từng đợt an toàn.

## 6.17 Testing

Cần kiểm thử:

- Service.
- Validator.
- Guard.
- Component interaction.
- Router.
- Luồng E2E.

Các luồng E2E quan trọng:

```text
Đăng nhập Blog Owner
→ tạo bài
→ thêm thumbnail
→ dịch tiếng Anh
→ gửi duyệt
→ Admin duyệt
→ bài xuất hiện trên homepage
→ mở chi tiết đúng ngôn ngữ
```

## 6.18 Build GitHub Pages

```bash
ng build \
  --configuration production \
  --base-href /Nodejs-Project-VCCorp/
```

Nếu tiếp tục dùng GitHub Pages, nên bắt đầu với hash routing:

```ts
provideRouter(routes, withHashLocation())
```

URL:

```text
https://dwg8204.github.io/Nodejs-Project-VCCorp/#/admin/posts
```

GitHub Pages chỉ host Angular tĩnh. NestJS/MySQL phải deploy riêng.

---

# 7. Ánh xạ code hiện tại sang Angular

| Code hiện tại | Angular thay thế |
|---|---|
| `document.getElementById()` | Template binding, signal, form control |
| `innerHTML = posts.map(...)` | `@for` + component |
| `onclick="savePost()"` | `(click)="savePost()"` |
| `oninput="applyFilters()"` | Reactive Form `valueChanges` |
| `window.location.href` | Angular Router |
| Global variable | Signal hoặc service state |
| Hàm `showToast()` | `ToastService` |
| Hàm `showConfirm()` | `DialogService` |
| `localStorage` mock DB | Repository, sau đó HttpClient |
| `data-vi`, `data-en` | Translation key/runtime i18n |
| `renderPagination()` | `PaginationComponent` |
| `injectRoleSidebarLinks()` | Layout dựa trên user/role signal |
| JavaScript kiểm tra quyền | Angular guard + NestJS guard |

Ví dụ chuyển filter:

### Trước

```js
function applyFilters() {
  const keyword = document
    .getElementById('searchPosts')
    .value
    .toLowerCase();

  const filtered = posts.filter(post =>
    post.title.toLowerCase().includes(keyword)
  );

  renderTable(filtered);
}
```

### Sau

```ts
keyword = signal('');
posts = signal<Post[]>([]);

filteredPosts = computed(() => {
  const keyword = this.keyword().trim().toLowerCase();

  return this.posts().filter(post =>
    post.title.toLowerCase().includes(keyword)
  );
});
```

```html
<input
  type="search"
  [value]="keyword()"
  (input)="keyword.set($any($event.target).value)"
>

@for (post of filteredPosts(); track post.id) {
  <app-post-card [post]="post" />
}
```

---

# 8. Lộ trình thực hành đề xuất

## Tuần 1: HTML/CSS/JavaScript

- Tự dựng một `article-card` không copy.
- Làm card responsive bằng Flex/Grid.
- Render 10 bài từ mảng JavaScript.
- Thêm tìm kiếm, filter, sort.
- Tự viết phân trang.

## Tuần 2: TypeScript

- Khai báo `Post`, `User`, `AuditLog`.
- Viết `PaginatedResponse<T>`.
- Chuyển hàm filter/sort sang TypeScript.
- Bật strict mode và không dùng `any`.

## Tuần 3: Angular cơ bản

- Tạo Angular project.
- Tạo `PostCardComponent`.
- Dùng `@if`, `@for`, input/output.
- Dùng signals cho danh sách và filter.
- Tạo `ThemeService`.

## Tuần 4: Router và layout

- Public/Admin/Owner layout.
- Route trang chủ, bài viết, profile.
- Route params/query params.
- Auth/Admin/Owner guards.

## Tuần 5: Forms

- Login form.
- Category form.
- Post form.
- Validation.
- Thumbnail preview.
- Quill wrapper.

## Tuần 6: NestJS API

- HttpClient.
- Interceptor.
- JWT.
- Upload file.
- Server-side pagination.
- Audit log API.

## Tuần 7: Hoàn thiện

- i18n.
- Accessibility.
- Unit test.
- E2E.
- GitHub Pages build.

---

# 9. Checklist trước khi bắt đầu chuyển đổi

Bạn đã sẵn sàng bắt đầu đợt 1 khi có thể:

- [ ] Giải thích được HTML, CSS và JavaScript làm gì.
- [ ] Tự tạo một form HTML đúng label/button.
- [ ] Dùng được Flexbox và Grid.
- [ ] Viết được responsive media query.
- [ ] Dùng được `map`, `filter`, `find`, `sort`.
- [ ] Hiểu `async/await` và `try/catch`.
- [ ] Khai báo TypeScript interface và union type.
- [ ] Hiểu generic cơ bản.
- [ ] Tạo và chạy Angular project.
- [ ] Tạo standalone component.
- [ ] Dùng interpolation, property binding, event binding.
- [ ] Dùng `@if` và `@for`.
- [ ] Truyền dữ liệu bằng input/output.
- [ ] Tạo signal và computed signal.
- [ ] Tạo và inject service.
- [ ] Khai báo route và điều hướng bằng `routerLink`.
- [ ] Biết chạy `ng build`.

Không cần học ngay:

- NgRx.
- Angular Material.
- SSR.
- Micro frontend.
- WebSocket.
- PWA.
- Module Federation.

Với dự án hiện tại, Angular standalone components + signals + services + RxJS + Reactive Forms đã đủ để triển khai đúng kế hoạch.

---

# Tài liệu tham khảo

- [Angular Essentials](https://angular.dev/essentials)
- [Angular Components](https://angular.dev/guide/components)
- [Angular Signals](https://angular.dev/guide/signals)
- [Angular Router](https://angular.dev/guide/routing)
- [Angular Reactive Forms](https://angular.dev/guide/forms/reactive-forms)
- [Angular HttpClient](https://angular.dev/guide/http)
- [Angular Interceptors](https://angular.dev/guide/http/interceptors)
- [Angular Testing](https://angular.dev/guide/testing)

