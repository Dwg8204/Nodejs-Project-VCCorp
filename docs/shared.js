/* ============================================================
   SIDEBAR TOGGLE (desktop collapse + mobile drawer)
   ============================================================ */
function ensureOverlay() {
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.onclick = () => toggleSidebar(true);
    document.body.appendChild(overlay);
  }
  return overlay;
}

function toggleSidebar(forceClose) {
  const layout = document.getElementById('layoutRoot');
  if (!layout) return;
  const overlay = ensureOverlay();
  const isMobile = window.innerWidth <= 760;

  if (forceClose === true) {
    layout.classList.remove('sidebar-collapsed');
    overlay.classList.remove('show');
    return;
  }

  layout.classList.toggle('sidebar-collapsed');
  if (isMobile) {
    overlay.classList.toggle('show', layout.classList.contains('sidebar-collapsed'));
  }
}

/* ============================================================
   THEME (sáng / tối)
   ============================================================ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-toggle .knob iconify-icon').forEach(el => {
    el.setAttribute('icon', theme === 'dark' ? 'solar:moon-bold' : 'solar:sun-bold');
  });
  localStorage.setItem('blog-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ============================================================
   NGÔN NGỮ GIAO DIỆN (i18n) — dịch toàn bộ chrome tĩnh
   ============================================================ */
const I18N = {
  vi: {
    home: 'Home', profile: 'Profile', manage_posts: 'Quản lý bài viết', admin_dashboard: 'Bảng điều khiển Admin',
    dashboard: 'Tổng quan', manage_users: 'Quản lý người dùng', manage_categories: 'Quản lý danh mục',
    manage_languages: 'Quản lý ngôn ngữ', back_to_blog: 'Về trang blog',
    search_placeholder: 'Tìm kiếm bài viết...', sign_in: 'Đăng nhập', get_started: 'Bắt đầu',
    follow: 'Theo dõi', reply: 'Trả lời', logout: 'Đăng xuất',
    all_categories: 'Tất cả danh mục', search_category: 'Tìm danh mục...',
    write_new_post: '+ Viết bài mới', save_draft: 'Lưu nháp', publish: 'Xuất bản', cancel: 'Hủy', preview: 'Xem trước',
    edit: 'Sửa', delete: 'Xóa', add_user: '+ Thêm người dùng', add_category: '+ Thêm danh mục', add_language: '+ Thêm ngôn ngữ',
    search_user: 'Tìm theo tên hoặc email...', all_roles: 'Tất cả vai trò', all_status: 'Tất cả trạng thái',
    active: 'Hoạt động', locked: 'Đã khóa', lock: 'Khóa', unlock: 'Mở khóa',
  },
  en: {
    home: 'Home', profile: 'Profile', manage_posts: 'Manage posts', admin_dashboard: 'Admin Dashboard',
    dashboard: 'Dashboard', manage_users: 'Manage users', manage_categories: 'Manage categories',
    manage_languages: 'Manage languages', back_to_blog: 'Back to blog',
    search_placeholder: 'Search stories...', sign_in: 'Sign In', get_started: 'Get Started',
    follow: 'Follow', reply: 'Reply', logout: 'Logout',
    all_categories: 'All categories', search_category: 'Search category...',
    write_new_post: '+ New post', save_draft: 'Save draft', publish: 'Publish', cancel: 'Cancel', preview: 'Preview',
    edit: 'Edit', delete: 'Delete', add_user: '+ Add user', add_category: '+ Add category', add_language: '+ Add language',
    search_user: 'Search by name or email...', all_roles: 'All roles', all_status: 'All status',
    active: 'Active', locked: 'Locked', lock: 'Lock', unlock: 'Unlock',
  }
};

function t(key, lang) {
  lang = lang || localStorage.getItem('blog-lang') || 'vi';
  return (I18N[lang] && I18N[lang][key]) || (I18N.vi[key]) || key;
}

function applyLanguage(lang) {
  localStorage.setItem('blog-lang', lang);
  document.querySelectorAll('.lang-current-label').forEach(el => el.textContent = lang === 'en' ? 'English' : 'Tiếng Việt');
  document.querySelectorAll('.lang-menu a').forEach(a => a.classList.toggle('active', a.dataset.lang === lang));

  // Dịch mọi phần tử có data-i18n theo khóa trong từ điển I18N
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n, lang);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder, lang));
  });

  // Legacy: một số phần tử dùng data-vi/data-en trực tiếp
  document.querySelectorAll('[data-vi][data-en]').forEach(el => {
    el.textContent = el.dataset[lang] || el.dataset.vi;
  });
}

// Trả về language_id tương ứng với 1 mã ngôn ngữ, tra cứu trực tiếp từ bảng languages
// (không hardcode số để tránh lệch với dữ liệu thật, gây hiện tượng "chuyển ngôn ngữ bị ngược")
function resolveLanguageId(langCode) {
  if (typeof db !== 'undefined') {
    const lang = db.get('languages').find(l => l.code === langCode);
    if (lang) return String(lang.id);
  }
  return langCode === 'en' ? '2' : '1';
}

function selectLanguage(lang) {
  const prevLang = localStorage.getItem('blog-lang');
  const prevLangId = localStorage.getItem('current_language_id');
  const newLangId = resolveLanguageId(lang);

  applyLanguage(lang);
  closeLangMenu();
  localStorage.setItem('current_language_id', newLangId);

  // Reload để mọi lệnh gọi db.getPostsWithDetails(langId) chạy lại đúng ngôn ngữ mới
  if (prevLang !== lang || prevLangId !== newLangId) {
    location.reload();
  }
}

function toggleLangMenu() {
  document.querySelectorAll('.lang-menu').forEach(m => m.classList.toggle('open'));
}
function closeLangMenu() {
  document.querySelectorAll('.lang-menu').forEach(m => m.classList.remove('open'));
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-dropdown')) closeLangMenu();
  if (!e.target.closest('.category-dropdown')) {
    document.querySelectorAll('.category-dropdown-panel').forEach(p => p.classList.remove('open'));
  }
});

/* ============================================================
   SIDEBAR: hiện/ẩn link theo vai trò — VỊ TRÍ CỐ ĐỊNH TRONG HTML,
   không chèn động (tránh lỗi "chạy lung tung" do append trùng lặp)
   ============================================================ */
function applyRoleSidebarVisibility() {
  if (typeof db === 'undefined') return;
  const user = db.getCurrentUser();
  const roleId = user ? user.role_id : null;

  document.querySelectorAll('[data-role-link]').forEach(el => {
    const requiredRole = parseInt(el.dataset.roleLink, 10);
    el.style.display = (roleId === requiredRole) ? 'flex' : 'none';
  });
}

/* ============================================================
   ẢNH MẶC ĐỊNH KHI LỖI
   ============================================================ */
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

/* ============================================================
   TEXTAREA TỰ GIÃN DÒNG (bình luận)
   ============================================================ */
function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
}
document.addEventListener('input', (e) => {
  if (e.target.classList && e.target.classList.contains('comment-textarea')) {
    autoResizeTextarea(e.target);
  }
});

/* ============================================================
   TƯƠNG TÁC: LIKE / BOOKMARK
   ============================================================ */
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
  if (!user) { alert('Bạn cần đăng nhập để thực hiện chức năng này!'); return; }

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
    alert('Bạn cần đăng nhập để thực hiện chức năng này!');
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

/* ============================================================
   COMPONENT DÙNG CHUNG: MODAL XÁC NHẬN (thay confirm()/alert())
   ============================================================ */
function ensureConfirmModalRoot() {
  let root = document.getElementById('confirmModalRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'confirmModalRoot';
    root.className = 'app-modal-overlay';
    root.innerHTML = `
      <div class="app-modal app-modal-sm">
        <div class="app-modal-icon" id="confirmModalIcon"><iconify-icon icon="solar:danger-triangle-bold-duotone"></iconify-icon></div>
        <div class="app-modal-title" id="confirmModalTitle">Xác nhận</div>
        <div class="app-modal-text" id="confirmModalText"></div>
        <div class="app-modal-actions">
          <button class="btn btn-outline" id="confirmModalCancel">Hủy</button>
          <button class="btn btn-danger-solid" id="confirmModalOk">Xác nhận</button>
        </div>
      </div>`;
    document.body.appendChild(root);
    root.addEventListener('click', (e) => { if (e.target === root) closeConfirmModal(); });
  }
  return root;
}
let _confirmModalCallback = null;
function openConfirmModal(message, onConfirm, opts) {
  opts = opts || {};
  const root = ensureConfirmModalRoot();
  document.getElementById('confirmModalTitle').textContent = opts.title || 'Xác nhận thao tác';
  document.getElementById('confirmModalText').textContent = message;
  const okBtn = document.getElementById('confirmModalOk');
  okBtn.textContent = opts.okLabel || 'Xóa';
  _confirmModalCallback = onConfirm;
  okBtn.onclick = () => { closeConfirmModal(); if (_confirmModalCallback) _confirmModalCallback(); };
  document.getElementById('confirmModalCancel').onclick = closeConfirmModal;
  root.classList.add('open');
}
function closeConfirmModal() {
  const root = document.getElementById('confirmModalRoot');
  if (root) root.classList.remove('open');
}

/* ============================================================
   COMPONENT DÙNG CHUNG: MODAL FORM (thêm / chỉnh sửa)
   fields: [{name, label, type: 'text'|'select'|'checkbox', value, options:[{value,label}], placeholder}]
   ============================================================ */
function ensureFormModalRoot() {
  let root = document.getElementById('formModalRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'formModalRoot';
    root.className = 'app-modal-overlay';
    root.innerHTML = `
      <div class="app-modal">
        <iconify-icon icon="solar:close-circle-bold-duotone" class="app-modal-close" onclick="closeFormModal()"></iconify-icon>
        <div class="app-modal-title" id="formModalTitle">Thêm mới</div>
        <div id="formModalBody"></div>
        <div class="app-modal-actions">
          <button class="btn btn-outline" onclick="closeFormModal()">Hủy</button>
          <button class="btn btn-primary" id="formModalSubmit">Lưu</button>
        </div>
      </div>`;
    document.body.appendChild(root);
    root.addEventListener('click', (e) => { if (e.target === root) closeFormModal(); });
  }
  return root;
}
function openFormModal(config) {
  const root = ensureFormModalRoot();
  document.getElementById('formModalTitle').textContent = config.title || 'Thêm mới';
  const body = document.getElementById('formModalBody');
  body.innerHTML = config.fields.map(f => {
    const id = 'fm_' + f.name;
    if (f.type === 'select') {
      const opts = f.options.map(o => `<option value="${o.value}" ${String(o.value) === String(f.value) ? 'selected' : ''}>${o.label}</option>`).join('');
      return `<div class="form-group"><label>${f.label}</label><select class="form-control" id="${id}" ${f.disabled ? 'disabled' : ''}>${opts}</select></div>`;
    }
    if (f.type === 'checkbox') {
      return `<div class="form-group"><label style="display:flex; align-items:center; gap:8px; font-weight:400;"><input type="checkbox" id="${id}" ${f.value ? 'checked' : ''}> ${f.label}</label></div>`;
    }
    return `<div class="form-group"><label>${f.label}</label><input type="${f.type || 'text'}" class="form-control" id="${id}" placeholder="${f.placeholder || ''}" value="${f.value != null ? f.value : ''}" ${f.disabled ? 'disabled' : ''}></div>`;
  }).join('');

  const submitBtn = document.getElementById('formModalSubmit');
  submitBtn.textContent = config.submitLabel || 'Lưu';
  submitBtn.onclick = () => {
    const values = {};
    config.fields.forEach(f => {
      const el = document.getElementById('fm_' + f.name);
      values[f.name] = f.type === 'checkbox' ? el.checked : el.value;
    });
    if (config.onSubmit(values) !== false) closeFormModal();
  };
  root.classList.add('open');
}
function closeFormModal() {
  const root = document.getElementById('formModalRoot');
  if (root) root.classList.remove('open');
}

/* ============================================================
   TÌM KIẾM TRÊN TOPBAR
   ============================================================ */
function handleTopbarSearch(e) {
  if (e.key !== 'Enter') return;
  const keyword = e.target.value.trim();
  const onIndex = /(^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname.endsWith('/');
  if (onIndex && typeof filterFeedByKeyword === 'function') {
    filterFeedByKeyword(keyword);
  } else {
    const prefix = window.location.pathname.includes('/admin/') ? '../' : '';
    window.location.href = `${prefix}index.html?search=${encodeURIComponent(keyword)}`;
  }
}

/* ============================================================
   KHỞI TẠO KHI TẢI TRANG
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('blog-theme') || 'light';
  applyTheme(savedTheme);
  const savedLang = localStorage.getItem('blog-lang') || 'vi';
  applyLanguage(savedLang);
  ensureOverlay();
  applyBgFallback();
  applyRoleSidebarVisibility();

  // Logout
  if (typeof db !== 'undefined') {
    const user = db.getCurrentUser();
    if (user) {
      const topbarRight = document.querySelector('.topbar-right');
      if (topbarRight && !topbarRight.querySelector('.logout-link')) {
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'logout-link';
        logoutBtn.textContent = t('logout');
        logoutBtn.style.cssText = 'margin-left: 4px; color: var(--danger); text-decoration: none; font-size: 14px; font-weight: 600;';
        logoutBtn.onclick = (e) => {
          e.preventDefault();
          db.logout();
          window.location.href = window.location.pathname.includes('/admin/') ? '../login.html' : 'login.html';
        };
        topbarRight.appendChild(logoutBtn);
      }
    }
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 760) {
    ensureOverlay().classList.remove('show');
  }
});
