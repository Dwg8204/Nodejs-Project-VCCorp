// ============ Sidebar toggle (desktop collapse + mobile drawer) ============
function ensureOverlay() {
  let overlay = document.getElementById('drawerOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'drawerOverlay';
    overlay.className = 'drawer-overlay';
    overlay.onclick = () => toggleSidebar(true);
    const layout = document.getElementById('layoutRoot');
    if (layout) {
      layout.insertBefore(overlay, layout.firstChild);
    } else {
      document.body.appendChild(overlay);
    }
  }
  return overlay;
}

function toggleSidebar(forceClose) {
  const layout = document.getElementById('layoutRoot');
  const sidebar = document.getElementById('mainSidebar');
  if (!layout) return;
  const overlay = ensureOverlay();
  const isMobile = window.innerWidth <= 768;

  if (forceClose === true) {
    layout.classList.remove('sidebar-collapsed');
    if (sidebar) sidebar.classList.remove('drawer-open');
    overlay.classList.remove('show');
    document.body.classList.remove('drawer-scroll-lock');
    document.querySelectorAll('.hamburger').forEach(el => el.setAttribute('aria-expanded', 'false'));
    return;
  }

  if (isMobile) {
    if (sidebar) {
      const isOpen = sidebar.classList.toggle('drawer-open');
      overlay.classList.toggle('show', isOpen);
      document.body.classList.toggle('drawer-scroll-lock', isOpen);
      document.querySelectorAll('.hamburger').forEach(el => el.setAttribute('aria-expanded', String(isOpen)));
    }
  } else {
    layout.classList.toggle('sidebar-collapsed');
  }
}

// ============ Theme (sáng / tối) ============
function applyTheme(theme, persist = true) {
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  document.querySelectorAll('.theme-toggle .knob iconify-icon').forEach(el => {
    el.setAttribute('icon', resolvedTheme === 'dark' ? 'solar:moon-bold' : 'solar:sun-bold');
  });
  document.querySelectorAll('.theme-toggle .knob').forEach(el => {
    if (!el.querySelector('iconify-icon')) {
      el.textContent = resolvedTheme === 'dark' ? '\u{1F319}' : '\u{2600}';
    }
  });
  if (persist) localStorage.setItem('blog-theme', resolvedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ============ CỜ NGÔN NGỮ — luôn là ẢNH THẬT, tự tính từ mã ngôn ngữ ============
// Mã ngôn ngữ (ISO 639) không trùng mã quốc gia (ISO 3166) dùng cho ảnh cờ,
// nên cần bảng ánh xạ. Ngôn ngữ mới thêm ở Admin sẽ TỰ ĐỘNG có cờ đúng nếu
// mã đã có trong bảng bên dưới; nếu là mã lạ sẽ tự dùng cờ "un" (Liên Hợp Quốc)
// làm mặc định — chỉ cần bổ sung thêm 1 dòng vào bảng này khi phát sinh mã mới.
const LANG_TO_COUNTRY = {
  vi: 'vn', en: 'gb', ja: 'jp', ko: 'kr', fr: 'fr', zh: 'cn',
  es: 'es', de: 'de', th: 'th', ru: 'ru', pt: 'pt', it: 'it',
  id: 'id', ar: 'sa', hi: 'in', nl: 'nl', pl: 'pl', tr: 'tr'
};
function flagImgFor(code, size) {
  size = size || 20;
  // flagcdn.com chỉ hỗ trợ các bucket kích thước cố định: 20,40,80,160,320,640,1280,2560
  // -> làm tròn lên bucket hợp lệ gần nhất để tránh URL 404 khi có nơi truyền size lẻ (VD 22)
  const VALID_BUCKETS = [20, 40, 80, 160, 320, 640, 1280, 2560];
  const wanted = size * 2;
  const bucket = VALID_BUCKETS.find(b => b >= wanted) || VALID_BUCKETS[VALID_BUCKETS.length - 1];
  const country = LANG_TO_COUNTRY[(code || '').toLowerCase()] || 'un';
  return `<img src="https://flagcdn.com/w${bucket}/${country}.png" width="${size}" alt="${code}" style="vertical-align:middle; border-radius:2px; box-shadow:0 0 0 1px rgba(0,0,0,0.08);">`;
}

// ============ Ngôn ngữ hiển thị của blog (Dynamic) ============
let LANG_LABELS = {};
let LANG_TO_ID = {};
let ID_TO_LANG = {};

// UI copy dictionary. This only translates interface chrome; article bodies,
// comments and user-entered content are deliberately excluded.
const UI_COPY_PAIRS = [
  ['Tìm kiếm...', 'Search...'], ['Tìm danh mục...', 'Search categories...'],
  ['Tìm kiếm bài viết...', 'Search posts...'], ['Tìm theo tên hoặc email...', 'Search by name or email...'],
  ['Trang chủ', 'Home'], ['Hồ sơ', 'Profile'], ['Giới thiệu', 'About'],
  ['Bảng điều khiển', 'Dashboard'], ['Bảng điều khiển Admin', 'Admin Dashboard'],
  ['Quản lý bài viết', 'Manage posts'], ['Quản lý thành viên', 'Manage users'],
  ['Quản lý người dùng', 'Manage users'], ['Quản lý danh mục', 'Manage categories'],
  ['Quản lý ngôn ngữ', 'Manage languages'], ['Về trang Blog', 'Back to Blog'],
  ['Tổng quan hệ thống', 'System Dashboard'], ['Người dùng', 'Users'], ['Bài viết', 'Posts'],
  ['Bài chờ duyệt', 'Pending Posts'], ['Danh mục', 'Categories'], ['Ngôn ngữ', 'Languages'],
  ['Thêm người dùng', 'Add User'], ['Thêm danh mục', 'Add Category'], ['Thêm ngôn ngữ', 'Add Language'],
  ['Viết bài mới', 'New Post'], ['Hủy', 'Cancel'], ['Lưu nháp', 'Save Draft'], ['Xuất bản', 'Publish'],
  ['Tiêu đề', 'Title'], ['Trạng thái', 'Status'], ['Ngày đăng', 'Date'], ['Ngày tham gia', 'Joined'],
  ['Vai trò', 'Role'], ['Tất cả trạng thái', 'All statuses'], ['Tất cả vai trò', 'All roles'],
  ['Đã xuất bản', 'Published'], ['Chờ duyệt', 'Pending'], ['Bị từ chối', 'Rejected'],
  ['Hoạt động', 'Active'], ['Đã khóa', 'Locked'], ['Khóa', 'Lock'], ['Mở khóa', 'Unlock'],
  ['Xem', 'View'], ['Sửa', 'Edit'], ['Xóa', 'Delete'], ['Duyệt', 'Approve'], ['Từ chối', 'Reject'],
  ['Lưu thay đổi', 'Save changes'], ['Tạo người dùng', 'Create user'], ['Tạo danh mục', 'Create category'],
  ['Đặt làm mặc định', 'Set as default'], ['Chỉnh sửa', 'Edit'],
  ['Chỉnh sửa danh mục', 'Edit category'], ['Chỉnh sửa ngôn ngữ', 'Edit language'],
  ['Tên đăng nhập', 'Username'], ['Họ và tên', 'Full name'], ['Mật khẩu', 'Password'],
  ['Nhập mật khẩu...', 'Enter password...'], ['Tối thiểu 8 ký tự', 'At least 8 characters'],
  ['Chào mừng trở lại', 'Welcome back'], ['Đăng nhập', 'Sign in'], ['Đăng ký', 'Sign up'],
  ['Đăng xuất', 'Logout'], ['Quên mật khẩu?', 'Forgot password?'],
  ['Chưa có tài khoản?', "Don't have an account?"], ['Đã có tài khoản?', 'Already have an account?'],
  ['Đăng ký ngay', 'Sign up now'], ['Tạo tài khoản', 'Create an account'], ['hoặc', 'or'],
  ['Đăng nhập nhanh (Bỏ qua mật khẩu)', 'Quick sign in (skip password)'],
  ['Đăng nhập với Google', 'Sign in with Google'], ['Đăng nhập với Facebook', 'Sign in with Facebook'],
  ['Đăng ký với Google', 'Sign up with Google'], ['Đăng ký với Facebook', 'Sign up with Facebook'],
  ['Khôi phục mật khẩu', 'Reset password'], ['Quay lại đăng nhập', 'Back to sign in'],
  ['Gửi liên kết khôi phục', 'Send reset link'],
  ['Nhập email đã đăng ký, chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.', 'Enter your registered email and we will send you a password reset link.'],
  ['Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi.', 'By signing up, you agree to our Terms of Service and Privacy Policy.'],
  ['Thay ảnh bìa', 'Change cover'], ['bài viết', 'posts'], ['lượt thích', 'likes'],
  ['Bài viết nổi bật', 'Featured post'], ['Chưa có bài viết', 'No posts yet'],
  ['Tiêu đề bài viết nhiều lượt thích nhất sẽ hiển thị ở đây.', 'The most-liked post will appear here.'],
  ['Lượt thích', 'Likes'], ['Thông tin cá nhân', 'Personal information'], ['Họ tên', 'Full name'],
  ['Ngày sinh', 'Date of birth'], ['Xác thực', 'Verification'], ['Đã xác thực', 'Verified'],
  ['Chưa xác thực', 'Not verified'], ['Thành viên', 'Member'], ['Reply', 'Trả lời'],
  ['Đang trả lời', 'Replying to'], ['Viết phản hồi...', 'Write a reply...'],
  ['Bạn cần đăng nhập để thực hiện chức năng bình luận.', 'You need to sign in to comment.'],
  ['Không có nội dung', 'No content'], ['Bài viết không tồn tại.', 'Post not found.'],
  ['Bài viết không tồn tại hoặc đã bị ẩn.', 'This post does not exist or has been hidden.'],
  ['Ngôn ngữ bài viết', 'Post Language'], ['Tiêu đề bài viết', 'Post Title'],
  ['Nội dung bài viết', 'Post Content'], ['Dịch sang ngôn ngữ khác', 'Translate to other languages'],
  ['Nhập tiêu đề bài viết...', 'Enter post title...'], ['Viết nội dung ở đây...', 'Write your content here...'],
  ['(Chưa có tiêu đề)', '(Untitled)'], ['Tổng bài viết', 'Total Posts'],
  ['Không có bài viết nào.', 'No posts found.'], ['Không tìm thấy kết quả', 'No results found'],
  ['Không tìm thấy danh mục.', 'No categories found.'], ['Chưa có', 'Missing'],
  ['Ngôn ngữ nguồn để dịch tự động', 'Source language for automatic translation'],
  ['Dịch tự động', 'Auto translate'], ['Đang dịch...', 'Translating...'],
  ['Tên danh mục (EN)', 'Category name (EN)'], ['Tên danh mục (VI)', 'Category name (VI)'],
  ['Mô tả (EN)', 'Description (EN)'], ['Mô tả (VI)', 'Description (VI)'],
  ['Mô tả ngắn...', 'Short description...'], ['Lý do từ chối', 'Rejection reason'],
  ['Nhập lý do từ chối...', 'Enter rejection reason...'], ['Từ chối bài viết', 'Reject post'],
  ['Xác nhận', 'Confirm'], ['Đăng xuất', 'Logout'], ['Xóa bài viết', 'Delete post'],
  ['Mở khóa tài khoản', 'Unlock account'], ['Khóa tài khoản', 'Lock account'],
  ['Thay đổi vai trò', 'Change role'], ['Duyệt bài viết', 'Approve post'],
  ['Thay đổi mặc định', 'Change default'], ['Xóa ngôn ngữ', 'Delete language'],
  ['Xóa danh mục', 'Delete category'], ['Đồng ý', 'Agree'],
  ['Vui lòng đăng nhập với tài khoản Admin!', 'Please sign in with an Admin account!'],
  ['Vui lòng đăng nhập với tài khoản Super Admin!', 'Please sign in with a Super Admin account!'],
  ['Vui lòng đăng nhập với tài khoản hợp lệ!', 'Please sign in with a valid account!'],
  ['Đã xóa bài viết!', 'Post deleted!'], ['Đã cập nhật ảnh bìa!', 'Cover image updated!'],
  ['Đã cập nhật ảnh đại diện!', 'Profile picture updated!'],
  ['Vui lòng nhập tiêu đề và nội dung!', 'Please enter a title and content!'],
  ['Đã xuất bản thành công!', 'Post published successfully!'], ['Đã lưu bản nháp!', 'Draft saved!'],
  ['Đã mở khóa tài khoản!', 'Account unlocked!'], ['Đã khóa tài khoản!', 'Account locked!'],
  ['Đã cập nhật vai trò!', 'Role updated!'], ['Vui lòng điền đầy đủ thông tin!', 'Please complete all required fields!'],
  ['Mật khẩu nhập lại không khớp!', 'Passwords do not match!'], ['Email này đã tồn tại!', 'This email already exists!'],
  ['Tên đăng nhập đã tồn tại!', 'This username already exists!'], ['Đã tạo người dùng thành công!', 'User created successfully!'],
  ['Dịch tự động thành công! (Mock)', 'Automatic translation completed! (Mock)'],
  ['Đã tạo danh mục!', 'Category created!'], ['Đã cập nhật danh mục!', 'Category updated!'],
  ['Đã xóa danh mục!', 'Category deleted!'], ['Đã thay đổi ngôn ngữ mặc định', 'Default language changed'],
  ['Vui lòng nhập mã và tên ngôn ngữ!', 'Please enter a language code and name!'],
  ['Mã ngôn ngữ này đã tồn tại!', 'This language code already exists!'],
  ['Đã thêm ngôn ngữ!', 'Language added!'], ['Đã cập nhật ngôn ngữ!', 'Language updated!'],
  ['Không thể xóa ngôn ngữ mặc định!', 'The default language cannot be deleted!'],
  ['Đã xóa ngôn ngữ!', 'Language deleted!'], ['Đã duyệt bài viết!', 'Post approved!'],
  ['Vui lòng nhập lý do từ chối!', 'Please enter a rejection reason!'], ['Đã từ chối bài viết!', 'Post rejected!'],
  ['Email hoặc mật khẩu không đúng!', 'Incorrect email or password!'],
  ['Email này đã được sử dụng!', 'This email is already in use!'], ['Đăng ký thành công!', 'Registration successful!'],
  ['Email này chưa được đăng ký trong hệ thống!', 'This email is not registered!'],
  ['Bạn cần đăng nhập để bình luận!', 'You need to sign in to comment!']
];

UI_COPY_PAIRS.push(
  ['Không tìm thấy người dùng.', 'No users found.'],
  ['Không tìm thấy bài viết.', 'No posts found.'],
  ['Không có bài viết nào.', 'No posts yet.'],
  ['Chưa có ngôn ngữ nào.', 'No languages yet.'],
  ['Người dùng không tồn tại.', 'User not found.'],
  ['Không rõ lý do', 'No reason provided'],
  ['Không rõ', 'Unknown'],
  ['Bản nháp', 'Draft'],
  ['Quản trị viên', 'Administrator'],
  ['Chủ blog', 'Blog Owner'],
  ['Người dùng thường', 'User'],
  ['Phản hồi', 'Responses'],
  ['Tác giả:', 'Author:'],
  ['Không thể khóa Super Admin', 'Super Admin cannot be locked'],
  ['Không thể xóa ngôn ngữ mặc định', 'The default language cannot be deleted'],
  ['Ngôn ngữ mặc định', 'Default language'],
  ['Chỉ bài viết đang chờ duyệt mới có thể được xuất bản.', 'Only pending posts can be published.'],
  ['Chỉ bài viết đang chờ duyệt mới có thể bị từ chối.', 'Only pending posts can be rejected.']
);

const UI_COPY = { vi: new Map(), en: new Map() };
UI_COPY_PAIRS.forEach(([vi, en]) => { UI_COPY.en.set(vi, en); UI_COPY.vi.set(en, vi); });

function translateUiText(value, lang) {
  if (value === null || value === undefined) return value;
  const raw = String(value);
  const trimmed = raw.trim();
  const translated = UI_COPY[lang]?.get(trimmed);
  if (translated) return raw.replace(trimmed, translated);

  // UI labels containing live values cannot be represented by the exact-match
  // dictionary above. Keep these patterns here so dynamically rendered screens
  // switch language without touching article titles or user-entered content.
  const dynamicPairs = lang === 'en'
    ? [
        [/^Phản hồi \((\d+)\)$/u, 'Responses ($1)'],
        [/^Tác giả:\s*/u, 'Author: '],
        [/^Hiển thị (\d+)[–-](\d+) trong tổng số (\d+)$/u, 'Showing $1–$2 of $3']
      ]
    : [
        [/^Responses \((\d+)\)$/u, 'Phản hồi ($1)'],
        [/^Author:\s*/u, 'Tác giả: '],
        [/^Showing (\d+)[–-](\d+) of (\d+)$/u, 'Hiển thị $1–$2 trong tổng số $3']
      ];
  const pair = dynamicPairs.find(([pattern]) => pattern.test(trimmed));
  return pair ? raw.replace(trimmed, trimmed.replace(pair[0], pair[1])) : raw;
}

function getUiLocale() {
  return (localStorage.getItem('blog-lang') || 'vi') === 'en' ? 'en-US' : 'vi-VN';
}

// ============ Shared pagination ============
const DEFAULT_SYSTEM_SETTINGS = Object.freeze({
  default_language_id: 2,
  posts_per_page: 5,
  require_post_approval: true,
  auto_translate_categories: true,
  auto_translate_posts: true,
  default_theme: 'system',
  reduce_motion: false
});

function getSystemSettings() {
  if (typeof db === 'undefined') return { ...DEFAULT_SYSTEM_SETTINGS };
  const stored = db.get('settings');
  const validStored = stored && !Array.isArray(stored) && typeof stored === 'object' ? stored : {};
  return { ...DEFAULT_SYSTEM_SETTINGS, ...validStored };
}

function getSystemPageSize() {
  const configured = Number(getSystemSettings().posts_per_page);
  return Number.isInteger(configured) && configured > 0 && configured <= 100 ? configured : 5;
}

const AUDIT_SENSITIVE_KEYS = new Set(['password', 'password_hash', 'token', 'access_token', 'refresh_token', 'otp_code']);

function sanitizeAuditData(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(sanitizeAuditData);
  if (typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !AUDIT_SENSITIVE_KEYS.has(String(key).toLowerCase()))
    .map(([key, item]) => [key, sanitizeAuditData(item)]));
}

function recordAuditLog({ action, entityType, entityId = null, entityLabel = '', beforeData = null, afterData = null, metadata = null, actor = undefined }) {
  if (typeof db === 'undefined' || !action || !entityType) return null;
  const currentActor = actor === undefined ? db.getCurrentUser() : actor;
  const actorRole = currentActor ? (db.get('roles').find(role => role.id === currentActor.role_id)?.name_role || String(currentActor.role_id || '')) : null;
  const logs = db.get('audit_logs');
  const safeLogs = Array.isArray(logs) ? logs : [];
  const nextId = safeLogs.length ? Math.max(...safeLogs.map(log => Number(log.id) || 0)) + 1 : 1;
  const entry = {
    id: nextId,
    actor_id: currentActor?.id ?? null,
    actor_name: currentActor ? (currentActor.full_name || currentActor.user_name || currentActor.email || '') : null,
    actor_role: actorRole,
    action: String(action),
    entity_type: String(entityType),
    entity_id: entityId === undefined ? null : entityId,
    entity_label: String(entityLabel || ''),
    before_data: sanitizeAuditData(beforeData),
    after_data: sanitizeAuditData(afterData),
    metadata: sanitizeAuditData(metadata),
    ip_address: null,
    user_agent: navigator.userAgent || null,
    created_at: new Date().toISOString()
  };
  safeLogs.push(entry);
  db.set('audit_logs', safeLogs);
  return entry;
}

function getPageFromQuery(key = 'page') {
  const page = Number(new URLSearchParams(window.location.search).get(key));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function setPageInQuery(page, key = 'page') {
  const url = new URL(window.location.href);
  if (page > 1) url.searchParams.set(key, String(page));
  else url.searchParams.delete(key);
  history.replaceState(null, '', url.pathname + url.search + url.hash);
}

function paginateItems(items, requestedPage = 1, pageSize = getSystemPageSize()) {
  const safeItems = Array.isArray(items) ? items : [];
  const totalPages = Math.max(1, Math.ceil(safeItems.length / pageSize));
  const currentPage = Math.min(Math.max(1, Number(requestedPage) || 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  return {
    items: safeItems.slice(startIndex, startIndex + pageSize),
    currentPage,
    totalPages,
    totalItems: safeItems.length,
    pageSize,
    startIndex
  };
}

function renderPagination({ container, pageData, onPageChange, queryKey = 'page', scrollTarget }) {
  const host = typeof container === 'string' ? document.getElementById(container) : container;
  if (!host || !pageData) return;
  const { currentPage, totalPages, totalItems, pageSize, startIndex } = pageData;
  if (!totalItems || totalPages <= 1) { host.innerHTML = ''; host.hidden = true; return; }

  const lang = localStorage.getItem('blog-lang') || 'vi';
  const from = startIndex + 1;
  const to = Math.min(startIndex + pageSize, totalItems);
  const labels = lang === 'en'
    ? { previous: 'Previous', next: 'Next', page: 'Page', of: 'of', summary: `Showing ${from}–${to} of ${totalItems}` }
    : { previous: 'Trước', next: 'Sau', page: 'Trang', of: '/', summary: `Hiển thị ${from}–${to} trong tổng số ${totalItems}` };

  const pageNumbers = [];
  for (let page = 1; page <= totalPages; page++) {
    if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) pageNumbers.push(page);
  }
  const controls = [];
  pageNumbers.forEach((page, index) => {
    if (index && page - pageNumbers[index - 1] > 1) controls.push('<span class="pagination-ellipsis" aria-hidden="true">…</span>');
    controls.push(`<button type="button" class="pagination-page${page === currentPage ? ' active' : ''}" data-page="${page}" ${page === currentPage ? 'aria-current="page"' : ''} aria-label="${labels.page} ${page}">${page}</button>`);
  });

  host.hidden = false;
  host.className = 'pagination-wrap';
  host.innerHTML = `<p class="pagination-summary">${labels.summary}</p><nav class="pagination-nav" aria-label="${lang === 'en' ? 'Pagination' : 'Phân trang'}"><button type="button" class="pagination-direction" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}><iconify-icon icon="solar:alt-arrow-left-linear"></iconify-icon><span>${labels.previous}</span></button><div class="pagination-pages">${controls.join('')}</div><span class="pagination-mobile-status">${labels.page} ${currentPage} ${labels.of} ${totalPages}</span><button type="button" class="pagination-direction" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}><span>${labels.next}</span><iconify-icon icon="solar:alt-arrow-right-linear"></iconify-icon></button></nav>`;

  host.querySelectorAll('button[data-page]').forEach(button => button.addEventListener('click', () => {
    const nextPage = Number(button.dataset.page);
    if (button.disabled || nextPage === currentPage || nextPage < 1 || nextPage > totalPages) return;
    setPageInQuery(nextPage, queryKey);
    onPageChange(nextPage);
    const target = typeof scrollTarget === 'string' ? document.querySelector(scrollTarget) : scrollTarget;
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }));
}

function translateUiMessage(value, lang) {
  let result = translateUiText(value, lang);
  if (lang !== 'en' || result !== value) return result;
  const replacements = [
    ['Bạn có chắc muốn đăng xuất không?', 'Are you sure you want to log out?'],
    ['Bạn có chắc muốn xóa bài viết', 'Are you sure you want to delete the post'],
    ['Bạn có chắc muốn mở khóa tài khoản của', 'Are you sure you want to unlock the account of'],
    ['Bạn có chắc muốn khóa tài khoản của', 'Are you sure you want to lock the account of'],
    ['Bạn có chắc muốn thay đổi vai trò của người dùng này?', "Are you sure you want to change this user's role?"],
    ['Bạn có chắc muốn duyệt và xuất bản bài viết', 'Are you sure you want to approve and publish the post'],
    ['Bạn có chắc muốn đặt', 'Are you sure you want to set'],
    ['làm ngôn ngữ mặc định của hệ thống?', 'as the system default language?'],
    ['Bạn có chắc muốn xóa ngôn ngữ', 'Are you sure you want to delete the language'],
    ['Các bản dịch liên quan cũng sẽ bị xóa.', 'Related translations will also be deleted.'],
    ['Bạn có chắc muốn xóa danh mục', 'Are you sure you want to delete the category'],
    ['Các bài viết thuộc danh mục này sẽ không còn danh mục.', 'Posts in this category will become uncategorized.'],
    ['Hành động này không thể hoàn tác.', 'This action cannot be undone.'],
    ['không?', '?']
  ];
  replacements.forEach(([from, to]) => { result = result.replace(from, to); });
  return result;
}

const nativeUiAlert = window.alert.bind(window);
window.alert = message => nativeUiAlert(translateUiMessage(String(message), localStorage.getItem('blog-lang') || 'vi'));

function translateUiTree(root, lang) {
  if (!root) return;
  const skipSelector = '.article-body,.body-text,.comment-content,.post-content,.ql-editor,.post-title,.post-title-cell,.featured-title,.featured-desc,.search-result-title,.user-name,.comment-author,[data-user-content]';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(node => {
    const parent = node.parentElement;
    if (!parent || parent.closest(skipSelector) || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return;
    node.nodeValue = translateUiText(node.nodeValue, lang);
  });
  root.querySelectorAll?.('input[placeholder],textarea[placeholder],[title],[aria-label]').forEach(el => {
    ['placeholder', 'title', 'aria-label'].forEach(attr => {
      const explicit = el.getAttribute(`data-${lang}-${attr}`);
      if (explicit !== null) el.setAttribute(attr, explicit);
      else if (el.hasAttribute(attr)) el.setAttribute(attr, translateUiText(el.getAttribute(attr), lang));
    });
  });
}

function initDynamicLanguages() {
  if (typeof db === 'undefined') return;
  const dLanguages = db.get('languages') || [];
  if (!dLanguages.length) return;

  dLanguages.forEach(l => {
    // Bao bọc tên vào span để canh giữa dòng chuẩn xác với ảnh cờ
    LANG_LABELS[l.code] = `${flagImgFor(l.code)} <span style="vertical-align:middle; display:inline-block; margin-left:4px;">${l.name}</span>`;
    LANG_TO_ID[l.code] = l.id.toString();
    ID_TO_LANG[l.id.toString()] = l.code;
  });

  // Re-render dropdowns dynamically
  document.querySelectorAll('.lang-menu').forEach(menu => {
    menu.innerHTML = dLanguages.map(l =>
      `<a href="#" data-lang="${l.code}" onclick="selectLanguage('${l.code}');return false;">${flagImgFor(l.code)} <span style="vertical-align:middle; display:inline-block; margin-left:6px;">${l.name}</span></a>`
    ).join('');
  });
}

function applyLanguage(lang) {
  if (Object.keys(LANG_LABELS).length === 0) initDynamicLanguages();

  localStorage.setItem('blog-lang', lang);
  document.documentElement.lang = lang;

  // Dùng innerHTML thay vì textContent để render được thẻ <img> của cờ
  document.querySelectorAll('.lang-current-label').forEach(el => {
    el.innerHTML = LANG_LABELS[lang] || lang;
  });

  document.querySelectorAll('.lang-menu a').forEach(a => {
    a.classList.toggle('active', a.dataset.lang === lang);
  });

  // Apply data-vi / data-en translations across the whole page
  document.querySelectorAll('[data-vi],[data-en]').forEach(el => {
    const val = el.dataset[lang];
    if (val !== undefined) el.textContent = val;
  });

  // Translate supported attributes and known interface-only text while keeping
  // every existing element, id and event handler intact.
  translateUiTree(document.body, lang);
  const titlePairs = [
    ['Đăng nhập – Medium', 'Sign in – Medium'], ['Đăng ký – Medium', 'Sign up – Medium'],
    ['Khôi phục mật khẩu – Medium', 'Reset password – Medium'], ['Medium – Trang chủ', 'Medium – Home'],
    ['Viết bài – Medium', 'Write – Medium'], ['Quản lý bài viết – Medium', 'Manage posts – Medium'],
    ['Quản lý người dùng – Medium', 'Manage users – Medium'], ['Quản lý danh mục – Medium', 'Manage categories – Medium'],
    ['Quản lý ngôn ngữ – Medium', 'Manage languages – Medium']
  ];
  titlePairs.forEach(([vi, en]) => {
    if (lang === 'en' && document.title === vi) document.title = en;
    if (lang === 'vi' && document.title === en) document.title = vi;
  });
}

function selectLanguage(lang) {
  const prevLang = localStorage.getItem('blog-lang');
  const newLangId = LANG_TO_ID[lang];
  const prevLangId = localStorage.getItem('current_language_id');
  const changed = prevLang !== lang || prevLangId !== newLangId;

  applyLanguage(lang);
  closeLangMenu();
  if (newLangId) localStorage.setItem('current_language_id', newLangId);

  // Reload to re-filter posts by correct language
  if (changed) {
    location.reload();
  }
}

function toggleLangMenu() {
  document.querySelectorAll('.lang-menu').forEach(m => {
    const open = m.classList.toggle('open');
    m.closest('.lang-dropdown')?.querySelector('.lang-btn')?.setAttribute('aria-expanded', String(open));
  });
}
function closeLangMenu() {
  document.querySelectorAll('.lang-menu').forEach(m => {
    m.classList.remove('open');
    m.closest('.lang-dropdown')?.querySelector('.lang-btn')?.setAttribute('aria-expanded', 'false');
  });
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-dropdown')) closeLangMenu();
  if (!e.target.closest('.category-dropdown')) {
    document.querySelectorAll('.category-dropdown-panel').forEach(p => p.classList.remove('open'));
  }
  if (!e.target.closest('.search-box-wrap')) {
    document.querySelectorAll('.search-results-dropdown').forEach(d => d.classList.remove('open'));
  }
});

// ============ ConfirmDialog — reusable modal thay confirm() native ============
function showConfirm({ title = 'Xác nhận', message = '', confirmText = 'Xác nhận', cancelText = 'Hủy', danger = false, onConfirm, onCancel }) {
  const existing = document.getElementById('confirmDialogOverlay');
  if (existing) existing.remove();
  const returnFocusTo = document.activeElement;

  const overlay = document.createElement('div');
  overlay.id = 'confirmDialogOverlay';
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal" role="dialog" aria-modal="true">
      <div class="confirm-icon ${danger ? 'danger' : 'info'}">
        <iconify-icon icon="${danger ? 'weui:delete-outlined' : 'solar:question-circle-bold-duotone'}"></iconify-icon>
      </div>
      <h3 class="confirm-title">${translateUiText(title, localStorage.getItem('blog-lang') || 'vi')}</h3>
      <p class="confirm-message">${translateUiMessage(message, localStorage.getItem('blog-lang') || 'vi')}</p>
      <div class="confirm-actions">
        <button class="btn btn-outline confirm-cancel-btn">${translateUiText(cancelText, localStorage.getItem('blog-lang') || 'vi')}</button>
        <button class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'} confirm-ok-btn">${translateUiText(confirmText, localStorage.getItem('blog-lang') || 'vi')}</button>
      </div>
    </div>
  `;

  const closeConfirm = (confirmed) => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 200);
    document.removeEventListener('keydown', handleConfirmKeydown);
    returnFocusTo?.focus?.();
    if (confirmed ? onConfirm : onCancel) (confirmed ? onConfirm : onCancel)();
  };
  const handleConfirmKeydown = event => {
    if (event.key === 'Escape') closeConfirm(false);
    if (event.key === 'Tab') {
      const controls = [...overlay.querySelectorAll('button')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };
  overlay.querySelector('.confirm-cancel-btn').onclick = () => closeConfirm(false);
  overlay.querySelector('.confirm-ok-btn').onclick = () => closeConfirm(true);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeConfirm(false);
    }
  });

  document.body.appendChild(overlay);
  document.addEventListener('keydown', handleConfirmKeydown);
  requestAnimationFrame(() => overlay.classList.add('open'));
  requestAnimationFrame(() => overlay.querySelector('.confirm-cancel-btn')?.focus());
}

// ============ Toast Notification ============
let _toastTimer = null;
function showToast(message, type = 'success', duration = 3000) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'global-toast';
    document.body.appendChild(toast);
  }
  const icons = { success: 'solar:check-circle-bold-duotone', error: 'solar:close-circle-bold-duotone', info: 'solar:info-circle-bold-duotone' };
  toast.innerHTML = `<iconify-icon icon="${icons[type] || icons.info}"></iconify-icon> ${translateUiText(message, localStorage.getItem('blog-lang') || 'vi')}`;
  toast.className = `global-toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { toast.classList.remove('show'); }, duration);
}

// ============ Modal form helper ============
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m._returnFocusTo = document.activeElement;
    m.classList.add('open');
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => m.querySelector('input:not([type="hidden"]),select,textarea,button,[href]')?.focus());
  }
}
function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.remove('open');
    if (!document.querySelector('.modal-overlay.open')) document.body.classList.remove('modal-open');
    m._returnFocusTo?.focus?.();
  }
}

function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input || !button) return;
  const reveal = input.type === 'password';
  const lang = localStorage.getItem('blog-lang') || 'vi';
  input.type = reveal ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(reveal));
  button.setAttribute('aria-label', reveal
    ? (lang === 'en' ? 'Hide password' : 'Ẩn mật khẩu')
    : (lang === 'en' ? 'Show password' : 'Hiện mật khẩu'));
  const icon = button.querySelector('iconify-icon');
  if (icon) icon.setAttribute('icon', reveal ? 'solar:eye-closed-bold-duotone' : 'solar:eye-bold-duotone');
}

document.addEventListener('keydown', event => {
  const openDrawer = document.querySelector('.sidebar.drawer-open');
  if (event.key === 'Escape' && openDrawer) {
    toggleSidebar(true);
    return;
  }
  const modal = document.querySelector('.modal-overlay.open');
  if (!modal || document.getElementById('confirmDialogOverlay')) return;
  if (event.key === 'Escape' && modal.id && modal.getAttribute('aria-busy') !== 'true') closeModal(modal.id);
  if (event.key !== 'Tab') return;
  const controls = [...modal.querySelectorAll('button:not([disabled]),[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el => el.offsetParent !== null);
  if (!controls.length) return;
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

// ============ Search (topbar) ============
function initSearch(getPostsFn) {
  const boxes = document.querySelectorAll('.search-box-wrap');
  boxes.forEach(box => {
    const input = box.querySelector('.search-input');
    const dropdown = box.querySelector('.search-results-dropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', () => {
      const kw = input.value.trim().toLowerCase();
      if (!kw) { dropdown.classList.remove('open'); return; }
      const posts = getPostsFn ? getPostsFn() : [];
      const results = posts.filter(p =>
        (p.title || '').toLowerCase().includes(kw) ||
        (p.author_name || '').toLowerCase().includes(kw) ||
        (p.category_name || '').toLowerCase().includes(kw)
      ).slice(0, 6);

      if (!results.length) {
        dropdown.innerHTML = `<div class="search-empty">Không tìm thấy kết quả</div>`;
      } else {
        dropdown.innerHTML = results.map(p => `
          <a href="article.html?id=${p.id}" class="search-result-item">
            <div class="search-result-title">${p.title}</div>
            <div class="search-result-meta">${p.author_name || ''} · ${p.category_name || ''}</div>
          </a>`).join('');
      }
      dropdown.classList.add('open');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { dropdown.classList.remove('open'); input.blur(); if (box.classList.contains('mobile-open')) toggleMobileSearch(true); }
      if (e.key === 'Enter') {
        const kw = input.value.trim();
        if (kw) { dropdown.classList.remove('open'); window.location.href = (window.location.pathname.includes('/admin/') ? '../' : '') + 'index.html?q=' + encodeURIComponent(kw); }
      }
    });
  });
}

// ============ Sidebar: bổ sung link theo vai trò đang đăng nhập ============
function injectRoleSidebarLinks() {
  const sidebar = document.getElementById('mainSidebar');
  if (!sidebar || typeof db === 'undefined') return;
  const user = db.getCurrentUser();
  if (!user) return;

  const inAdminFolder = window.location.pathname.includes('/admin/');
  const prefix = inAdminFolder ? '../' : '';

  // Tránh inject duplicate
  const hasOwnerLink = !!sidebar.querySelector('a[href$="owner-posts.html"]');
  const hasAdminLink = inAdminFolder
    ? !!sidebar.querySelector('a[href="index.html"], a[href*="admin/index.html"]')
    : !!sidebar.querySelector('a[href*="admin/index.html"], a[href="index.html"][data-admin]');

  if (user.role_id === 1 && inAdminFolder && !sidebar.querySelector('a[href="logs.html"]')) {
    const logsLink = document.createElement('a');
    logsLink.href = 'logs.html';
    logsLink.classList.toggle('active', window.location.pathname.endsWith('/logs.html'));
    logsLink.innerHTML = '<span class="icon"><iconify-icon icon="solar:history-bold-duotone"></iconify-icon></span><span data-vi="Nhật ký hoạt động" data-en="Activity logs">Activity logs</span>';
    const backToBlog = sidebar.querySelector('a[href="../index.html"]');
    if (backToBlog) sidebar.insertBefore(logsLink, backToBlog);
    else sidebar.appendChild(logsLink);
  }

  if (user.role_id === 1 && inAdminFolder && !sidebar.querySelector('a[href="settings.html"]')) {
    const settingsLink = document.createElement('a');
    settingsLink.href = 'settings.html';
    settingsLink.innerHTML = '<span class="icon"><iconify-icon icon="solar:settings-bold-duotone"></iconify-icon></span><span data-vi="Cài đặt hệ thống" data-en="System settings">System settings</span>';
    const backToBlog = sidebar.querySelector('a[href="../index.html"]');
    if (backToBlog) sidebar.insertBefore(settingsLink, backToBlog);
    else sidebar.appendChild(settingsLink);
  }

  let extraHtml = '';
  if (user.role_id === 2 && !hasOwnerLink) {
    extraHtml += `<a href="${prefix}owner-posts.html"><span class="icon"><iconify-icon icon="fluent-mdl2:blog"></iconify-icon></span> <span data-vi="Quản lý bài viết" data-en="Manage posts">Manage posts</span></a>`;
  }
  if (user.role_id === 1 && !hasAdminLink) {
    extraHtml += `<a href="${prefix}admin/index.html" data-admin><span class="icon"><iconify-icon icon="mage:dashboard-fill"></iconify-icon></span> <span data-vi="Bảng điều khiển Admin" data-en="Admin Dashboard">Admin dashboard</span></a>`;
  }
  if (extraHtml) {
    sidebar.insertAdjacentHTML('beforeend', extraHtml);
  }
}

const FALLBACK_COVER = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
  <rect width="400" height="280" fill="#EDEBE7"/>
  <g fill="none" stroke="#B9B4AC" stroke-width="2">
    <rect x="130" y="90" width="140" height="100" rx="6"/>
    <circle cx="165" cy="120" r="10"/>
    <path d="M130 175 L175 135 L210 165 L235 145 L270 180"/>
  </g>
</svg>`);

const FALLBACK_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#DDD8D0"/>
  <circle cx="50" cy="38" r="18" fill="#B9B4AC"/>
  <path d="M15 92 C15 65 30 55 50 55 C70 55 85 65 85 92 Z" fill="#B9B4AC"/>
</svg>`);

function imgFallback(imgEl, type) {
  imgEl.onerror = null;
  imgEl.src = type === 'avatar' ? FALLBACK_AVATAR : FALLBACK_COVER;
}

function applyBgFallback() {
  document.querySelectorAll('[data-fallback-bg]').forEach(el => {
    const style = el.getAttribute('style') || '';
    const match = style.match(/url\((['"]?)(.*?)\1\)/);
    if (!match) return;
    const url = match[2];
    const test = new Image();
    test.onerror = () => { el.style.backgroundImage = `url('${FALLBACK_COVER}')`; };
    test.src = url;
  });
}

function toggleMobileSearch(forceClose = false) {
  const wrap = document.getElementById('topSearchWrap') || document.querySelector('.topbar .search-box-wrap');
  if (!wrap) return;
  let closeBtn = wrap.querySelector('.mobile-search-close');
  if (!closeBtn) {
    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'mobile-search-close';
    closeBtn.setAttribute('aria-label', localStorage.getItem('blog-lang') === 'en' ? 'Close search' : 'Đóng tìm kiếm');
    closeBtn.innerHTML = '<iconify-icon icon="solar:close-circle-linear"></iconify-icon>';
    closeBtn.onclick = () => toggleMobileSearch(true);
    wrap.appendChild(closeBtn);
  }
  const shouldOpen = !forceClose && !wrap.classList.contains('mobile-open');
  wrap.classList.toggle('mobile-open', shouldOpen);
  if (shouldOpen) {
    const input = wrap.querySelector('.search-input');
    requestAnimationFrame(() => input?.focus());
  } else {
    wrap.querySelector('.search-results-dropdown')?.classList.remove('open');
  }
}

function hydrateAccountAvatar(element, user) {
  if (!element || !user || element.querySelector('img')) return;
  const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.full_name || user.user_name || 'User')}`;
  element.innerHTML = `<img src="${avatarUrl}" alt="${user.full_name || user.user_name || 'User'}">`;
  element.title = user.full_name || user.user_name || '';
  element.classList.add('account-avatar');
  element.setAttribute('role', 'link');
  element.setAttribute('tabindex', '0');
  element.setAttribute('aria-label', localStorage.getItem('blog-lang') === 'en' ? 'Open profile' : 'Mở hồ sơ');
  const profileUrl = window.location.pathname.includes('/admin/') ? '../profile.html' : 'profile.html';
  element.onclick = () => { window.location.href = profileUrl; };
  element.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); window.location.href = profileUrl; } };
}

function enhanceUiAccessibility(root = document) {
  const collect = selector => {
    const nodes = [...(root.querySelectorAll?.(selector) || [])];
    if (root.matches?.(selector)) nodes.unshift(root);
    return nodes;
  };

  collect('.hamburger,.mobile-search-icon,.quick-link-card,[onclick].topic-pill').forEach(el => {
    if (el.dataset.a11yReady) return;
    el.dataset.a11yReady = 'true';
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', el.classList.contains('quick-link-card') ? 'link' : 'button');
    if (el.classList.contains('hamburger')) {
      el.setAttribute('aria-label', localStorage.getItem('blog-lang') === 'en' ? 'Toggle navigation' : 'Mở hoặc đóng menu');
      el.setAttribute('aria-expanded', 'false');
    }
    if (el.classList.contains('mobile-search-icon')) el.setAttribute('aria-label', localStorage.getItem('blog-lang') === 'en' ? 'Open search' : 'Mở tìm kiếm');
    el.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); el.click(); }
    });
  });

  collect('.lang-btn').forEach(el => { el.setAttribute('aria-haspopup', 'menu'); el.setAttribute('aria-expanded', el.getAttribute('aria-expanded') || 'false'); el.setAttribute('aria-label', localStorage.getItem('blog-lang') === 'en' ? 'Change language' : 'Thay đổi ngôn ngữ'); });
  collect('.theme-toggle').forEach(el => { el.setAttribute('aria-label', localStorage.getItem('blog-theme') === 'dark' ? (localStorage.getItem('blog-lang') === 'en' ? 'Use light mode' : 'Dùng giao diện sáng') : (localStorage.getItem('blog-lang') === 'en' ? 'Use dark mode' : 'Dùng giao diện tối')); });
  collect('.sidebar').forEach(el => el.setAttribute('aria-label', localStorage.getItem('blog-lang') === 'en' ? 'Main navigation' : 'Điều hướng chính'));
  collect('button[title],a[title]').forEach(el => { if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.title); });
  collect('img').forEach(img => {
    img.decoding = 'async';
    if (!img.closest('.topbar,.byline') && !img.classList.contains('author-avatar-feed')) img.loading = 'lazy';
    if (!img.hasAttribute('alt')) img.alt = '';
  });
  enhanceResponsiveAdminTables(root);
}

function enhanceResponsiveAdminTables(root = document) {
  const tables = new Set();
  if (root.matches?.('body:has(.admin-main) table.data-table')) tables.add(root);
  root.querySelectorAll?.('body:has(.admin-main) table.data-table, table.data-table').forEach(table => {
    if (table.closest('body')?.querySelector('.admin-main')) tables.add(table);
  });
  const ownerTable = root.closest?.('table.data-table');
  if (ownerTable && ownerTable.closest('body')?.querySelector('.admin-main')) tables.add(ownerTable);

  const lang = localStorage.getItem('blog-lang') || 'vi';
  tables.forEach(table => {
    const headers = [...table.querySelectorAll('thead th')].map((header, index, list) =>
      header.textContent.trim() || (index === list.length - 1 ? (lang === 'en' ? 'Actions' : 'Thao tác') : '')
    );
    table.querySelectorAll('tbody tr').forEach(row => {
      const cells = [...row.children].filter(cell => cell.tagName === 'TD');
      const isEmpty = cells.length === 1 && cells[0].hasAttribute('colspan');
      row.classList.toggle('responsive-empty-row', isEmpty);
      cells.forEach((cell, index) => {
        if (isEmpty) cell.removeAttribute('data-label');
        else cell.dataset.label = headers[index] || (lang === 'en' ? 'Details' : 'Thông tin');
      });
    });
  });
}

// ============ Textarea tự giãn dòng (bình luận) ============
function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
}
document.addEventListener('input', (e) => {
  if (e.target.classList && e.target.classList.contains('comment-textarea')) {
    autoResizeTextarea(e.target);
  }
});

// ============ Tương tác: Like / Bookmark ============
function isPostLiked(postId) {
  if (typeof db === 'undefined') return false;
  const user = db.getCurrentUser();
  if (!user) return false;
  return db.get('post_likes').some(l => l.post_id === postId && l.user_id === user.id);
}

function getLikeCount(postId) {
  if (typeof db === 'undefined') return 0;
  return db.get('post_likes').filter(l => l.post_id === postId).length;
}

function toggleLike(postId, el) {
  if (typeof db === 'undefined') return;
  const user = db.getCurrentUser();
  if (!user) { showToast('Bạn cần đăng nhập để thực hiện chức năng này!', 'info'); return; }

  let likes = db.get('post_likes');
  const existing = likes.find(l => l.post_id === postId && l.user_id === user.id);
  let liked;
  if (existing) {
    likes = likes.filter(l => l.id !== existing.id);
    liked = false;
  } else {
    const newId = likes.length ? Math.max(...likes.map(l => l.id)) + 1 : 1;
    likes.push({ id: newId, post_id: postId, user_id: user.id, created_at: new Date().toISOString() });
    liked = true;
  }
  db.set('post_likes', likes);

  const wrapper = el.closest('.like-btn') || el;
  wrapper.classList.toggle('liked', liked);
  const countEl = wrapper.querySelector('.like-count');
  if (countEl) countEl.textContent = getLikeCount(postId);
}

function isPostBookmarked(postId) {
  const list = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]');
  return list.includes(postId);
}

function toggleBookmark(postId, el) {
  if (typeof db !== 'undefined' && !db.getCurrentUser()) {
    showToast('Bạn cần đăng nhập để thực hiện chức năng này!', 'info');
    return;
  }
  let list = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]');
  const idx = list.indexOf(postId);
  let active;
  if (idx > -1) { list.splice(idx, 1); active = false; }
  else { list.push(postId); active = true; }
  localStorage.setItem('bookmarked_posts', JSON.stringify(list));

  const wrapper = el.closest('.bookmark-btn') || el;
  wrapper.classList.toggle('active', active);
}

function focusCommentBox() {
  const box = document.getElementById('newCommentText');
  const notice = document.getElementById('guest-comment-notice');
  if (box) { box.scrollIntoView({ behavior: 'smooth', block: 'center' }); box.focus(); }
  else if (notice) { notice.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

// ============ Khởi tạo khi tải trang ============
window.addEventListener('DOMContentLoaded', () => {
  const systemSettings = getSystemSettings();
  const savedTheme = localStorage.getItem('blog-theme') || systemSettings.default_theme || 'system';
  applyTheme(savedTheme, false);
  document.documentElement.classList.toggle('system-reduce-motion', Boolean(systemSettings.reduce_motion));

  // Đưa hàm injectRoleSidebarLinks lên TRƯỚC applyLanguage để đảm bảo DOM sidebar hoàn chỉnh
  ensureOverlay();
  applyBgFallback();
  injectRoleSidebarLinks();

  // Sync language: ensure current_language_id consistent with blog-lang
  if (Object.keys(LANG_LABELS).length === 0) initDynamicLanguages();

  let savedLang = localStorage.getItem('blog-lang');
  if (!savedLang) {
    const dLangId = getSystemSettings().default_language_id;
    savedLang = ID_TO_LANG[dLangId.toString()] || 'vi';
  }

  const savedLangId = localStorage.getItem('current_language_id');
  if (savedLangId && ID_TO_LANG[savedLangId] && ID_TO_LANG[savedLangId] !== savedLang) {
    localStorage.setItem('current_language_id', LANG_TO_ID[savedLang]);
  } else if (!savedLangId && LANG_TO_ID[savedLang]) {
    localStorage.setItem('current_language_id', LANG_TO_ID[savedLang]);
  }

  // Gọi hàm gán ngôn ngữ dịch thuật
  applyLanguage(savedLang);

  // Global Logout logic
  if (typeof db !== 'undefined') {
    const user = db.getCurrentUser();
    if (user) {
      document.querySelectorAll('.avatar').forEach(av => {
        hydrateAccountAvatar(av, user);
      });

      const topbarRight = document.querySelector('.topbar-right');
      if (topbarRight && !topbarRight.querySelector('.logout-link')) {
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'logout-link';
        logoutBtn.title = localStorage.getItem('blog-lang') === 'en' ? 'Logout' : 'Đăng xuất';
        logoutBtn.setAttribute('aria-label', logoutBtn.title);
        logoutBtn.innerHTML = `<iconify-icon icon="solar:logout-2-linear"></iconify-icon><span data-vi="Đăng xuất" data-en="Logout">${logoutBtn.title}</span>`;
        logoutBtn.onclick = (e) => {
          e.preventDefault();
          showConfirm({
            title: 'Đăng xuất',
            message: 'Bạn có chắc muốn đăng xuất không?',
            confirmText: 'Đăng xuất',
            cancelText: 'Hủy',
            danger: false,
            onConfirm: () => {
              db.logout();
              window.location.href = window.location.pathname.includes('/admin/') ? '../login.html' : 'login.html';
            }
          });
        };
        topbarRight.appendChild(logoutBtn);
      }
    }
  }

  enhanceUiAccessibility(document);
  document.querySelectorAll('#mainSidebar a').forEach(link => link.addEventListener('click', () => {
    if (window.innerWidth <= 768) toggleSidebar(true);
  }));

  // Lists, badges and modal content are rendered after page load on several
  // screens. Observe only added UI nodes so their labels follow the selected
  // language without changing any rendering or business function.
  const uiObserver = new MutationObserver(records => {
    const lang = localStorage.getItem('blog-lang') || 'vi';
    const user = typeof db !== 'undefined' ? db.getCurrentUser() : null;
    records.forEach(record => {
      if (record.target?.matches?.('.avatar') && user) hydrateAccountAvatar(record.target, user);
      record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          translateUiTree(node, lang);
          enhanceUiAccessibility(node);
        }
        if (node.nodeType === Node.TEXT_NODE && node.parentElement && !node.parentElement.closest('.article-body,.body-text,.comment-content,.post-content,.ql-editor,.post-title,.post-title-cell,.featured-title,.featured-desc,.search-result-title,.user-name,.comment-author,[data-user-content]')) {
          node.nodeValue = translateUiText(node.nodeValue, lang);
        }
      });
    });
  });
  uiObserver.observe(document.body, { childList: true, subtree: true });
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    ensureOverlay().classList.remove('show');
    document.getElementById('mainSidebar')?.classList.remove('drawer-open');
    document.body.classList.remove('drawer-scroll-lock');
    document.querySelectorAll('.hamburger').forEach(el => el.setAttribute('aria-expanded', 'false'));
  }
});

// ============ Floating Preview Panel ============
function injectPreviewPanel() {
  if (document.getElementById('previewPanel')) return;

  const overlay = document.createElement('div');
  overlay.id = 'previewOverlay';
  overlay.className = 'preview-overlay';
  overlay.onclick = closePreview;
  document.body.appendChild(overlay);

  const panel = document.createElement('div');
  panel.id = 'previewPanel';
  panel.className = 'preview-panel';
  panel.innerHTML = `
    <div class="preview-header">
      <h3 data-vi="Xem trước bài viết" data-en="Post Preview">Xem trước bài viết</h3>
      <button onclick="closePreview()" class="preview-close-btn">&times;</button>
    </div>
    <div class="preview-body" id="previewPanelBody">
      <!-- Loading or content -->
    </div>
    <div class="preview-footer">
      <span class="preview-access-notice" id="previewAccessNotice" hidden></span>
      <a href="#" id="previewFullLink" class="btn btn-primary" data-vi="Đọc đầy đủ" data-en="Read Full Article">Đọc đầy đủ</a>
    </div>
  `;
  document.body.appendChild(panel);
}

function openPreview(postId) {
  injectPreviewPanel();
  const panel = document.getElementById('previewPanel');
  const overlay = document.getElementById('previewOverlay');
  const body = document.getElementById('previewPanelBody');
  const fullLink = document.getElementById('previewFullLink');
  const accessNotice = document.getElementById('previewAccessNotice');

  if (typeof db === 'undefined') return;

  const langId = localStorage.getItem('current_language_id') || '1';
  const posts = db.get('posts');
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const users = db.get('users');
  const author = users.find(u => u.id === post.author_id) || {};
  const trans = db.get('post_translations');
  const categoryTrans = db.get('category_translation');

  let pt = trans.find(t => t.post_id === post.id && t.language_id == langId) || trans.find(t => t.post_id === post.id) || {};
  let ct = categoryTrans.find(c => c.category_id === post.category_id && c.language_id == langId) || categoryTrans.find(c => c.category_id === post.category_id) || {};

  const title = pt.title || 'Untitled';
  const content = pt.content || '';
  const catName = ct.name || 'Uncategorized';
  const authorName = author.full_name || author.user_name || 'Anonymous';
  const dateFormatted = new Date(post.created_at).toLocaleDateString(getUiLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
  const imgUrl = post.thumbnail || `https://images.unsplash.com/photo-${1441974231531 + post.id}-c6227db76b6e?w=600`;

  body.innerHTML = `
    <div class="preview-img" style="background-image: url('${imgUrl}'); height: 200px; background-size: cover; background-position: center; border-radius: 12px; margin-bottom: 20px;"></div>
    <span class="badge badge-yellow" style="margin-bottom: 12px; display: inline-block;">${catName}</span>
    <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 10px; color: var(--text);">${title}</h2>
    <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
      <span>Tác giả: <strong>${authorName}</strong></span> &nbsp;&middot;&nbsp; <span>${dateFormatted}</span>
    </div>
    <div class="preview-text-content" style="line-height: 1.6; color: var(--text);">${content}</div>
  `;

  const isSubFolder = window.location.pathname.includes('/admin/');
  const isPublished = post.status === 'PUBLISHED';
  const statusCopy = {
    PENDING: { vi: 'Đang chờ duyệt', en: 'Pending review', icon: 'solar:clock-circle-bold-duotone' },
    DRAFT: { vi: 'Bản nháp', en: 'Draft', icon: 'solar:document-text-bold-duotone' },
    REJECTED: { vi: 'Đã bị từ chối', en: 'Rejected', icon: 'solar:close-circle-bold-duotone' }
  };
  fullLink.hidden = !isPublished;
  fullLink.removeAttribute('href');
  if (isPublished) fullLink.href = (isSubFolder ? '../' : '') + `article.html?id=${post.id}`;
  if (accessNotice) {
    const config = statusCopy[post.status];
    const lang = localStorage.getItem('blog-lang') || 'vi';
    accessNotice.hidden = isPublished || !config;
    accessNotice.className = `preview-access-notice status-${String(post.status || '').toLowerCase()}`;
    accessNotice.innerHTML = config ? `<iconify-icon icon="${config.icon}"></iconify-icon><span>${config[lang]}</span>` : '';
  }

  // Re-apply translation on panel if any data-vi exists
  if (typeof applyLanguage === 'function') {
    const currentLang = localStorage.getItem('blog-lang') || 'vi';
    applyLanguage(currentLang);
  }

  overlay.classList.add('open');
  panel.classList.add('open');
}

function closePreview() {
  const panel = document.getElementById('previewPanel');
  const overlay = document.getElementById('previewOverlay');
  if (panel && overlay) {
    panel.classList.remove('open');
    overlay.classList.remove('open');
  }
}

// ============ Reveal on Scroll ============
function initRevealOnScroll() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    elements.forEach(el => observer.observe(el));
  } else {
    elements.forEach(el => el.classList.add('is-visible'));
  }
}
window.addEventListener('DOMContentLoaded', initRevealOnScroll);
