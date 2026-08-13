# 07. Module do Người 2 phụ trách

Tài liệu mô tả nghiệp vụ nội dung trong `category`, `post`, `interaction`, `dashboard` và
`upload`: luồng trạng thái, validation, transaction, cache và audit.

## 1. Danh mục đa ngôn ngữ

`categories` giữ định danh/source language; `category_translation` giữ tên theo language.

```text
sourceLanguageId + translations[]
 -> không lặp languageId, bắt buộc có source translation
 -> mọi language active và chưa xóa
 -> trim + kiểm tra tên unique theo language, không phân biệt hoa thường
 -> transaction lưu category/translations + audit
 -> commit rồi invalidate categories: và posts:public:list:
```

- Source ID >= 1; name bắt buộc tối đa 255.
- Search có `language` chỉ tìm translation đó, không trộn ngôn ngữ.
- Limit tối đa 100; sort newest/oldest/name-asc/name-desc.
- Xóa là soft delete. Bài viết vẫn giữ `category_id`, không bị xóa/di chuyển.
- Restore chỉ áp dụng record đã xóa; mọi mutation xóa cache liên quan.

## 2. Vòng đời bài viết Blog Owner

```text
DRAFT -> PENDING -> PUBLISHED
                 -> REJECTED
PUBLISHED --owner sửa--> DRAFT -> PENDING
PUBLISHED --admin hủy duyệt--> PENDING
```

### Tạo bài

- Chỉ role `BLOG_OWNER`.
- Thumbnail URL bắt buộc, tối đa 2048.
- Category/source language phải hợp lệ và active.
- Ít nhất một translation, không lặp language; source translation phải tồn tại.
- Title bắt buộc tối đa 500; content không rỗng.
- Bài mới luôn `DRAFT`; owner không tự đặt `PUBLISHED`.
- Post + translations + audit chạy trong transaction.

### Sửa bài và chống ghi đè

Update bắt buộc `expectedVersion`. Backend so với `post.version`:

```text
khớp -> cho sửa, version + 1
không khớp -> 409 POST_VERSION_CONFLICT, frontend reload
```

Admin duyệt cũng dùng version, nên owner sửa đồng thời admin duyệt không âm thầm ghi đè.
Owner được sửa bài `PUBLISHED`; sau sửa bài về `DRAFT`, xóa thông tin review/publish, tăng
version, xóa public cache và phải gửi duyệt lại.

### Gửi duyệt và xóa

- Submit chỉ nhận `DRAFT` hoặc `REJECTED`.
- Source translation phải còn title/content hợp lệ.
- Submit chuyển `PENDING`, tăng version, xóa rejection reason và ghi audit.
- Owner chỉ thao tác bài có `author_id` của mình.
- Delete là soft delete, tăng version và invalidate public cache.

## 3. Admin kiểm duyệt

List hỗ trợ page/limit/status/author/category/search/sort, trả stats theo status và count
like/comment. Limit tối đa 100.

```text
approve/reject
 -> transaction + pessimistic write lock
 -> post phải PENDING, chưa xóa
 -> expectedVersion phải trùng
 -> approve: PUBLISHED + reviewer/reviewedAt/publishedAt
 -> reject: REJECTED + reason tối đa 5000
 -> version + 1 + audit
 -> publish thì invalidate public cache
```

`unapprove` chỉ nhận bài `PUBLISHED`; chuyển về `PENDING`, xóa thông tin review/publish,
tăng version và loại khỏi public list.

## 4. Public posts, nổi bật và gợi ý

Public API chỉ trả `PUBLISHED` chưa xóa. Query có page, limit, language, categoryId, authorId,
search và sort newest/oldest/popular.

- List thường cache 300 giây; search/popular không cache.
- Count like/comment truy vấn tách khỏi nội dung cache để tương tác không bị cũ.
- Bài nổi bật: tối đa 3 bài theo like + comment; thiếu thì bù bài mới nhất.
- Chủ đề gợi ý: tối đa 7 category nhiều bài published nhất; thiếu thì bù category mới.
- Bài liên quan: ưu tiên 3 bài mới nhất cùng category, loại bài hiện tại; thiếu thì bù bài mới.
- Detail chọn translation theo language yêu cầu và không lộ draft/pending/rejected.

## 5. Bình luận

- GET public; create/delete yêu cầu đăng nhập.
- Content trim, bắt buộc, tối đa 5.000 ký tự; chỉ comment bài `PUBLISHED`.
- Chỉ hai tầng: reply của reply vẫn trỏ về comment gốc.
- Reply người khác thêm `@username`; reply chính mình loại mention bản thân.
- Hiển thị `userName` và avatar URL thật.
- Chỉ chủ comment được xóa. Xóa reply soft-delete reply; xóa gốc soft-delete cả các reply.
- Tối đa 50/page, sắp xếp createdAt rồi ID tăng dần.

Create/delete phát event qua `InteractionRealtimeService`; MySQL vẫn là nguồn dữ liệu chuẩn.

## 6. Like/unlike

Unique `(post_id, user_id)` đảm bảo một user chỉ có một hàng cho mỗi bài:

```text
chưa có -> insert is_liked=true
đã có -> đảo true/false trên cùng hàng
```

Chỉ like bài published. Batch `/posts/likes/me` tránh N+1 request. Count chỉ tính
`is_liked=true`; toggle trả trạng thái + tổng mới và phát realtime event.

## 7. Dashboard Admin

`GET /api/admin/dashboard` tổng hợp dữ liệu thật cho Super Admin:

- Tổng user/post/category/language active, like active, comment chưa xóa.
- Phân bố trạng thái bài và like/comment theo ngày.
- Top 5 post theo `COUNT(DISTINCT like) + COUNT(DISTINCT comment)`.
- Content/category, translation coverage, auto-translated và recent audit activity.

Biểu đồ lấy snapshot lúc mở/reload dashboard, không polling. SQL aggregate/group theo ngày;
ngày không dữ liệu được điền 0.

## 8. Upload Cloudinary

`POST /api/uploads/images` yêu cầu JWT. Multer giữ buffer tạm rồi upload Cloudinary;
database chỉ lưu URL. Một file/request, tối đa 5 MB, chỉ JPEG/PNG/WebP. Thiếu cấu hình trả
`UPLOAD_CLOUDINARY_NOT_CONFIGURED`. Backend không lưu base64.

## 9. Transaction, audit và cache

Post + translations, category + translations, review + audit dùng TypeORM transaction; một
bước lỗi thì toàn bộ rollback. Audit action chính: `POST_CREATED`, `POST_UPDATED`,
`POST_SUBMITTED`, `POST_APPROVED`, `POST_REJECTED`, `POST_APPROVAL_REVOKED`,
`POST_DELETED`, `CATEGORY_CREATED`, `CATEGORY_UPDATED`, `CATEGORY_DELETED`.

Cache chỉ áp dụng dữ liệu đọc nhiều/ít đổi. Like/comment không bị đóng băng trong cache nội
dung. Redis lỗi thì memory fallback giữ hệ thống hoạt động; cache không phải nguồn dữ liệu.

## 10. Mã lỗi tiêu biểu

| Code | Ý nghĩa |
|---|---|
| `POST_VERSION_CONFLICT` | Bài đổi sau lúc màn hình tải |
| `POST_NOT_PENDING` | Chỉ pending mới approve/reject |
| `POST_NOT_PUBLISHED` | Không tương tác/hủy duyệt sai trạng thái |
| `POST_SOURCE_TRANSLATION_REQUIRED` | Thiếu bản source hợp lệ |
| `CATEGORY_NAME_ALREADY_EXISTS` | Trùng tên cùng language |
| `CATEGORY_LANGUAGE_DUPLICATED` | Lặp language trong payload |
| `COMMENT_DELETE_FORBIDDEN` | Xóa comment không thuộc mình |
| `PARENT_COMMENT_NOT_FOUND` | Reply sai bài/đã xóa |
| `UPLOAD_IMAGE_TYPE_NOT_ALLOWED` | Sai loại ảnh |
