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
    return;
  }

  if (isMobile) {
    if (sidebar) {
      const isOpen = sidebar.classList.toggle('drawer-open');
      overlay.classList.toggle('show', isOpen);
    }
  } else {
    layout.classList.toggle('sidebar-collapsed');
  }
}

// ============ Theme (sáng / tối) ============
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-toggle .knob iconify-icon').forEach(el => {
    el.setAttribute('icon', theme === 'dark' ? 'solar:moon-bold' : 'solar:sun-bold');
  });
  document.querySelectorAll('.theme-toggle .knob').forEach(el => {
    if (!el.querySelector('iconify-icon')) {
      el.textContent = theme === 'dark' ? '\u{1F319}' : '\u{2600}';
    }
  });
  localStorage.setItem('blog-theme', theme);
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
  if (!e.target.closest('.search-box-wrap')) {
    document.querySelectorAll('.search-results-dropdown').forEach(d => d.classList.remove('open'));
  }
});

// ============ ConfirmDialog — reusable modal thay confirm() native ============
function showConfirm({ title = 'Xác nhận', message = '', confirmText = 'Xác nhận', cancelText = 'Hủy', danger = false, onConfirm, onCancel }) {
  const existing = document.getElementById('confirmDialogOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'confirmDialogOverlay';
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal" role="dialog" aria-modal="true">
      <div class="confirm-icon ${danger ? 'danger' : 'info'}">
        <iconify-icon icon="${danger ? 'weui:delete-outlined' : 'solar:question-circle-bold-duotone'}"></iconify-icon>
      </div>
      <h3 class="confirm-title">${title}</h3>
      <p class="confirm-message">${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-outline confirm-cancel-btn">${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'} confirm-ok-btn">${confirmText}</button>
      </div>
    </div>
  `;

  overlay.querySelector('.confirm-cancel-btn').onclick = () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 200);
    if (onCancel) onCancel();
  };
  overlay.querySelector('.confirm-ok-btn').onclick = () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 200);
    if (onConfirm) onConfirm();
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
      if (onCancel) onCancel();
    }
  });

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
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
  toast.innerHTML = `<iconify-icon icon="${icons[type] || icons.info}"></iconify-icon> ${message}`;
  toast.className = `global-toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { toast.classList.remove('show'); }, duration);
}

// ============ Modal form helper ============
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) { m.classList.add('open'); }
}
function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) { m.classList.remove('open'); }
}

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
      if (e.key === 'Escape') { dropdown.classList.remove('open'); input.blur(); }
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
  const hasAdminLink = !!sidebar.querySelector('a[href*="admin/index.html"], a[href="index.html"][data-admin]');

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
  const savedTheme = localStorage.getItem('blog-theme') || 'light';
  applyTheme(savedTheme);

  // Đưa hàm injectRoleSidebarLinks lên TRƯỚC applyLanguage để đảm bảo DOM sidebar hoàn chỉnh
  ensureOverlay();
  applyBgFallback();
  injectRoleSidebarLinks();

  // Sync language: ensure current_language_id consistent with blog-lang
  if (Object.keys(LANG_LABELS).length === 0) initDynamicLanguages();

  let savedLang = localStorage.getItem('blog-lang');
  if (!savedLang) {
    const dLangId = typeof db !== 'undefined' ? (db.get('settings')?.default_language_id || 2) : 2;
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
        if (av.textContent.trim() === 'N' || av.textContent.trim() === 'A') {
          av.textContent = (user.full_name || user.user_name || '?').charAt(0).toUpperCase();
        }
      });

      const topbarRight = document.querySelector('.topbar-right');
      if (topbarRight && !topbarRight.querySelector('.logout-link')) {
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'logout-link';
        logoutBtn.setAttribute('data-vi', 'Đăng xuất');
        logoutBtn.setAttribute('data-en', 'Logout');
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.cssText = 'margin-left:4px; color:var(--danger); text-decoration:none; font-size:14px; font-weight:600;';
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
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 760) {
    ensureOverlay().classList.remove('show');
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
  const dateFormatted = new Date(post.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
  fullLink.href = (isSubFolder ? '../' : '') + `article.html?id=${post.id}`;

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