// ============ Sidebar toggle ============
function toggleSidebar() {
  const layout = document.getElementById('layoutRoot');
  if (layout) layout.classList.toggle('sidebar-collapsed');
}

// ============ Theme (sáng / tối) ============
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icons = document.querySelectorAll('.theme-toggle .knob');
  icons.forEach(el => el.textContent = theme === 'dark' ? '\u{1F319}' : '\u{2600}');
  localStorage.setItem('blog-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ============ Ngôn ngữ hiển thị của blog (Vi / En) ============
const LANG_LABELS = { vi: 'Tiếng Việt', en: 'English' };

function applyLanguage(lang) {
  localStorage.setItem('blog-lang', lang);
  document.querySelectorAll('.lang-current-label').forEach(el => el.textContent = LANG_LABELS[lang] || lang);
  document.querySelectorAll('.lang-menu a').forEach(a => {
    a.classList.toggle('active', a.dataset.lang === lang);
  });
  // Dịch các phần tử tĩnh có data-vi / data-en (menu, nhãn...)
  document.querySelectorAll('[data-vi][data-en]').forEach(el => {
    el.textContent = el.dataset[lang] || el.dataset.vi;
  });
}

function selectLanguage(lang) {
  applyLanguage(lang);
  closeLangMenu();
}

function toggleLangMenu() {
  document.querySelectorAll('.lang-menu').forEach(m => m.classList.toggle('open'));
}
function closeLangMenu() {
  document.querySelectorAll('.lang-menu').forEach(m => m.classList.remove('open'));
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-dropdown')) closeLangMenu();
});

// ============ Khởi tạo khi tải trang ============
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('blog-theme') || 'light';
  applyTheme(savedTheme);
  const savedLang = localStorage.getItem('blog-lang') || 'vi';
  applyLanguage(savedLang);

  // Global Logout logic
  if (typeof db !== 'undefined') {
    const user = db.getCurrentUser();
    if (user) {
      const topbarRight = document.querySelector('.topbar-right');
      if (topbarRight) {
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.cssText = 'margin-left: 15px; color: #d32f2f; text-decoration: none; font-size: 14px; font-weight: 600;';
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
