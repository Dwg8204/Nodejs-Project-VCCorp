/**
 * Mock Data Initializer
 * File này chạy mỗi khi tải trang để đảm bảo localStorage luôn có dữ liệu giả lập.
 * Dữ liệu bám sát 100% schema Database đã cho.
 */

const MOCK_DATA = {
  settings: {
    default_language_id: 2,
    posts_per_page: 5,
    require_post_approval: true,
    auto_translate_categories: true,
    auto_translate_posts: true,
    default_theme: 'system',
    reduce_motion: false
  },
  roles: [
    { id: 1, name_role: 'SUPER_ADMIN', created_at: '2026-07-01T00:00:00Z' },
    { id: 2, name_role: 'BLOG_OWNER', created_at: '2026-07-01T00:00:00Z' },
    { id: 3, name_role: 'AUTHENTICATED_USER', created_at: '2026-07-01T00:00:00Z' }
  ],

  users: [
    {
      id: 1,
      user_name: 'admin',
      email: 'admin@gmail.com',
      full_name: 'Super Admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Super%20Admin',
      cover_image: null,
      date_of_birth: '1990-01-15',
      is_active: true,
      password_hash: '123456',
      email_verified: true,
      role_id: 1,
      otp_code: null,
      otp_created_at: null,
      otp_ttl_seconds: 180,
      created_at: '2026-07-01T08:00:00Z',
      updated_at: '2026-07-01T08:00:00Z'
    },
    {
      id: 2,
      user_name: 'ritakind',
      email: 'blog@gmail.com',
      full_name: 'Rita Kind-Envy',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rita%20Kind-Envy',
      cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      date_of_birth: '1995-06-20',
      is_active: true,
      password_hash: '123456',
      email_verified: true,
      role_id: 2,
      otp_code: null,
      otp_created_at: null,
      otp_ttl_seconds: 180,
      created_at: '2026-07-02T10:30:00Z',
      updated_at: '2026-07-02T10:30:00Z'
    },
    {
      id: 3,
      user_name: 'tenneyb',
      email: 'user@gmail.com',
      full_name: 'Tenney Balogun',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tenney%20Balogun',
      cover_image: 'https://images.unsplash.com/photo-1472214222555-d4cdc4d2e245?w=800',
      date_of_birth: '1992-11-08',
      is_active: true,
      password_hash: '123456',
      email_verified: true,
      role_id: 2,
      otp_code: null,
      otp_created_at: null,
      otp_ttl_seconds: 180,
      created_at: '2026-07-03T09:15:00Z',
      updated_at: '2026-07-03T09:15:00Z'
    },
    {
      id: 4,
      user_name: 'jamess',
      email: 'jamess@gmail.com',
      full_name: 'James S. Baker',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James%20S.%20Baker',
      cover_image: null,
      date_of_birth: '1998-03-25',
      is_active: true,
      password_hash: '123456',
      email_verified: true,
      role_id: 3,
      otp_code: null,
      otp_created_at: null,
      otp_ttl_seconds: 180,
      created_at: '2026-07-04T14:20:00Z',
      updated_at: '2026-07-04T14:20:00Z'
    }
  ],

  languages: [
    { id: 1, code: 'en', name: 'English', flag: '<img src="https://flagcdn.com/w20/gb.png" style="width:20px; vertical-align:middle; border-radius:2px; margin-top:-2px;" alt="English">', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 2, code: 'vi', name: 'Tiếng Việt', flag: '<img src="https://flagcdn.com/w20/vn.png" style="width:20px; vertical-align:middle; border-radius:2px; margin-top:-2px;" alt="Tiếng Việt">', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' }
  ],

  categories: [
    { id: 1, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' }, 
    { id: 2, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' }, 
    { id: 3, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' }, 
    { id: 4, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' }  
  ],

  category_translation: [
    { id: 1, category_id: 1, language_id: 1, name: 'UX Design', des: 'User Experience and User Interface' },
    { id: 2, category_id: 1, language_id: 2, name: 'Thiết kế UX', des: 'Trải nghiệm người dùng và Giao diện' },
    { id: 3, category_id: 2, language_id: 1, name: 'Sports', des: 'Latest news about sports' },
    { id: 4, category_id: 2, language_id: 2, name: 'Thể thao', des: 'Tin tức thể thao mới nhất' },
    { id: 5, category_id: 3, language_id: 1, name: 'Programming', des: 'Software development' },
    { id: 6, category_id: 3, language_id: 2, name: 'Lập trình', des: 'Phát triển phần mềm' },
    { id: 7, category_id: 4, language_id: 1, name: 'Lifestyle', des: 'Healthy living, food, and culture' },
    { id: 8, category_id: 4, language_id: 2, name: 'Đời sống', des: 'Sống khỏe, ẩm thực và văn hóa' }
  ],

  posts: [
    { id: 1, author_id: 2, category_id: 1, status: 'PUBLISHED', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=400', created_at: '2026-07-05T08:00:00Z', updated_at: '2026-07-05T08:00:00Z' },
    { id: 2, author_id: 3, category_id: 2, status: 'PUBLISHED', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400', created_at: '2026-07-06T15:30:00Z', updated_at: '2026-07-06T15:30:00Z' },
    { id: 3, author_id: 2, category_id: 4, status: 'PENDING', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400', created_at: '2026-07-07T10:00:00Z', updated_at: '2026-07-07T10:00:00Z' },
    { id: 4, author_id: 4, category_id: 3, status: 'PUBLISHED', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400', created_at: '2026-07-08T09:00:00Z', updated_at: '2026-07-08T09:00:00Z' },
    { id: 5, author_id: 2, category_id: 1, status: 'PUBLISHED', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400', created_at: '2026-07-09T10:00:00Z', updated_at: '2026-07-09T10:00:00Z' },
    { id: 6, author_id: 3, category_id: 2, status: 'PUBLISHED', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', created_at: '2026-07-10T11:00:00Z', updated_at: '2026-07-10T11:00:00Z' },
    { id: 7, author_id: 4, category_id: 3, status: 'PUBLISHED', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400', created_at: '2026-07-11T12:00:00Z', updated_at: '2026-07-11T12:00:00Z' },
    { id: 8, author_id: 2, category_id: 4, status: 'PUBLISHED', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400', created_at: '2026-07-12T13:00:00Z', updated_at: '2026-07-12T13:00:00Z' },
    { id: 9, author_id: 3, category_id: 1, status: 'PUBLISHED', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400', created_at: '2026-07-13T14:00:00Z', updated_at: '2026-07-13T14:00:00Z' },
    { id: 10, author_id: 4, category_id: 2, status: 'PUBLISHED', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400', created_at: '2026-07-14T15:00:00Z', updated_at: '2026-07-14T15:00:00Z' },
    { id: 11, author_id: 2, category_id: 3, status: 'PUBLISHED', source_language_id: 1, thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400', created_at: '2026-07-15T16:00:00Z', updated_at: '2026-07-15T16:00:00Z' }
  ],

  post_translations: [
    { id: 1, post_id: 1, language_id: 1, title: 'What good writing looks like', content: '<p>The essential (micro) copy rules I used at Google. Good UX writing is invisible...</p>', is_auto_translated: false, created_at: '2026-07-05T08:00:00Z' },
    { id: 2, post_id: 1, language_id: 2, title: 'Thế nào là kỹ năng viết tốt', content: '<p>Các quy tắc viết nội dung siêu nhỏ tôi đã dùng tại Google. Viết UX tốt là khi người dùng không nhận ra nó...</p>', is_auto_translated: true, created_at: '2026-07-05T08:05:00Z' },
    { id: 3, post_id: 2, language_id: 1, title: 'When Bukayo Saka Missed the Penalty', content: '<p>In the middle of watching Belgium Vs Senegal, I was speaking with my friends...</p>', is_auto_translated: false, created_at: '2026-07-06T15:30:00Z' },
    { id: 4, post_id: 2, language_id: 2, title: 'Khi Bukayo Saka Sút Hỏng Phạt Đền', content: '<p>Vào giữa lúc xem Bỉ đá với Senegal, tôi đang nói chuyện với bạn bè...</p>', is_auto_translated: true, created_at: '2026-07-06T15:35:00Z' },
    { id: 5, post_id: 3, language_id: 1, title: 'How To Save A Summer: What I Dried All Summer Long', content: '<p>A guide to drying fruits and vegetables during the summer season.</p>', is_auto_translated: false, created_at: '2026-07-07T10:00:00Z' },
    { id: 6, post_id: 4, language_id: 1, title: '10 Things To Know Before Becoming A Developer', content: '<p>Programming is hard, but here is what you need to know before you start your journey...</p>', is_auto_translated: false, created_at: '2026-07-08T09:00:00Z' },
    { id: 7, post_id: 5, language_id: 1, title: 'The Future of UX Design in 2027', content: '<p>As AI continues to grow, UX designers need to adapt and learn new tools and methodologies.</p>', is_auto_translated: false, created_at: '2026-07-09T10:00:00Z' },
    { id: 8, post_id: 6, language_id: 1, title: 'Top 5 Football Matches of the Decade', content: '<p>A look back at the most thrilling matches we have witnessed over the last 10 years.</p>', is_auto_translated: false, created_at: '2026-07-10T11:00:00Z' },
    { id: 9, post_id: 7, language_id: 1, title: 'Why I Switched from React to Vue', content: '<p>After years of using React, I decided to give Vue a try. Here are my thoughts.</p>', is_auto_translated: false, created_at: '2026-07-11T12:00:00Z' },
    { id: 10, post_id: 8, language_id: 1, title: 'Minimalism: How Less Can Be More', content: '<p>Decluttering your life and focusing on what truly matters can bring immense peace.</p>', is_auto_translated: false, created_at: '2026-07-12T13:00:00Z' },
    { id: 11, post_id: 9, language_id: 1, title: 'Accessibility in Web Design', content: '<p>Making your website accessible is no longer optional. Here is how to get started.</p>', is_auto_translated: false, created_at: '2026-07-13T14:00:00Z' },
    { id: 12, post_id: 10, language_id: 1, title: 'Marathon Training for Beginners', content: '<p>Running a marathon is a huge challenge, but with the right plan, anyone can do it.</p>', is_auto_translated: false, created_at: '2026-07-14T15:00:00Z' },
    { id: 13, post_id: 11, language_id: 1, title: 'Understanding Asynchronous JavaScript', content: '<p>Callbacks, Promises, and Async/Await explained with real-world examples.</p>', is_auto_translated: false, created_at: '2026-07-15T16:00:00Z' }
  ],

  comments: [
    { id: 1, user_id: 4, post_id: 1, parent_id: null, is_reply: false, content: 'Great insights! I completely agree with the micro-copy rules.', created_at: '2026-07-05T09:12:00Z' },
    { id: 2, user_id: 2, post_id: 1, parent_id: 1, is_reply: true, content: 'Thank you James! Glad you found it useful.', created_at: '2026-07-05T10:30:00Z' }
  ],

  post_likes: [
    { id: 1, post_id: 1, user_id: 4, is_liked: true, updated_at: '2026-07-05T09:15:00Z' },
    { id: 2, post_id: 1, user_id: 3, is_liked: true, updated_at: '2026-07-05T11:00:00Z' },
    { id: 3, post_id: 2, user_id: 4, is_liked: true, updated_at: '2026-07-06T16:00:00Z' }
  ],
  audit_logs: []
};

// Hàm khởi tạo Mock Data
function initMockData() {
  // Đổi key để force reset trên máy bạn, tránh phải clear localStorage bằng tay
  const isInitialized = localStorage.getItem('vccorp_mock_init_v6');
  if (!isInitialized) {
    console.log('Khởi tạo Mock Data bản mới (V6)...');
    // Đẩy từng table vào localStorage
    Object.keys(MOCK_DATA).forEach(table => {
      localStorage.setItem(`db_${table}`, JSON.stringify(MOCK_DATA[table]));
    });

    // Set current language default is English (id = 1)
    localStorage.setItem('current_language_id', '1');

    // Đánh dấu đã khởi tạo bản v6
    localStorage.setItem('vccorp_mock_init_v6', 'true');
  }
}

// Chạy khởi tạo
initMockData();

// Forward-compatible migration for workspaces initialized before audit logs.
if (localStorage.getItem('db_audit_logs') === null) {
  localStorage.setItem('db_audit_logs', '[]');
}

// Hotfix: vá lỗi dữ liệu bài viết bị thiếu source_language_id
(function fixLegacyPosts() {
  const posts = JSON.parse(localStorage.getItem('db_posts') || '[]');
  let changed = false;
  posts.forEach(p => {
    if (!p.source_language_id) {
      p.source_language_id = 1; // Default to English
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem('db_posts', JSON.stringify(posts));
  }
})();

// Utility helpers
const db = {
  get: (table) => JSON.parse(localStorage.getItem(`db_${table}`) || '[]'),
  set: (table, data) => localStorage.setItem(`db_${table}`, JSON.stringify(data)),

  getPostsWithDetails: (languageId) => {
    const posts = db.get('posts').filter(p => p.status === 'PUBLISHED');
    const users = db.get('users');
    const translations = db.get('post_translations');
    const categoryTrans = db.get('category_translation');
    const likes = db.get('post_likes');
    const comments = db.get('comments');

    return posts.map(post => {
      const author = users.find(u => u.id === post.author_id) || {};

      let postTrans = translations.find(t => t.post_id === post.id && t.language_id == languageId);
      if (!postTrans) {
        postTrans = translations.find(t => t.post_id === post.id && t.language_id == post.source_language_id) || {};
      }

      let catTrans = categoryTrans.find(c => c.category_id === post.category_id && c.language_id == languageId);
      if (!catTrans) {
        catTrans = categoryTrans.find(c => c.category_id === post.category_id) || {};
      }

      const postLikeCount = likes.filter(l => l.post_id === post.id && l.is_liked).length;
      const postCommentCount = comments.filter(c => c.post_id === post.id).length;

      return {
        ...post,
        author_name: author.full_name || author.user_name,
        author_avatar: author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.full_name || author.user_name || 'U'}`,
        category_name: catTrans.name,
        title: postTrans.title,
        content: postTrans.content,
        likes: postLikeCount,
        comments: postCommentCount,
        date_formatted: new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  updateUser: (updatedUser) => {
    let users = db.get('users');
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updatedUser };
      db.set('users', users);
      
      const curr = db.getCurrentUser();
      if (curr && curr.id === updatedUser.id) {
        localStorage.setItem('current_user', JSON.stringify(users[idx]));
      }
      return true;
    }
    return false;
  },

  login: (email, password) => {
    const users = db.get('users');
    const user = users.find(u => u.email === email && u.password_hash === password && u.is_active);
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user));
      if (typeof recordAuditLog === 'function') recordAuditLog({ action: 'AUTH_LOGIN_SUCCEEDED', entityType: 'AUTH', entityId: user.id, entityLabel: user.email });
      return true;
    }
    if (typeof recordAuditLog === 'function') recordAuditLog({ action: 'AUTH_LOGIN_FAILED', entityType: 'AUTH', entityLabel: email, metadata: { email }, actor: null });
    return false;
  },

  logout: () => {
    const currentUser = db.getCurrentUser();
    if (currentUser && typeof recordAuditLog === 'function') recordAuditLog({ action: 'AUTH_LOGOUT', entityType: 'AUTH', entityId: currentUser.id, entityLabel: currentUser.email });
    localStorage.removeItem('current_user');
  }
};

// Build an initial audit history for browsers that already had project data
// before the audit-log feature was introduced. This runs once and never
// overwrites real logs created by subsequent actions.
(function seedLegacyAuditHistory() {
  if (localStorage.getItem('vccorp_audit_seed_v1')) return;
  const existingLogs = db.get('audit_logs');
  if (existingLogs.length) {
    localStorage.setItem('vccorp_audit_seed_v1', 'true');
    return;
  }

  const users = db.get('users');
  const roles = db.get('roles');
  const posts = db.get('posts');
  const postTranslations = db.get('post_translations');
  const categories = db.get('categories');
  const categoryTranslations = db.get('category_translation');
  const languages = db.get('languages');
  const admin = users.find(user => user.role_id === 1) || null;
  const logs = [];
  let id = 0;

  const append = ({ actor, action, entityType, entityId, entityLabel, createdAt, afterData = null, metadata = null }) => {
    const role = actor ? roles.find(item => item.id === actor.role_id) : null;
    logs.push({
      id: ++id,
      actor_id: actor?.id ?? null,
      actor_name: actor ? (actor.full_name || actor.user_name || actor.email) : null,
      actor_role: role?.name_role || null,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      entity_label: entityLabel || '',
      before_data: null,
      after_data: afterData,
      metadata: { imported_from_existing_data: true, ...(metadata || {}) },
      ip_address: null,
      user_agent: null,
      created_at: createdAt || new Date().toISOString()
    });
  };

  languages.forEach(language => append({ actor: admin, action: 'LANGUAGE_CREATED', entityType: 'LANGUAGE', entityId: language.id, entityLabel: language.name, createdAt: language.created_at, afterData: language }));
  categories.forEach(category => {
    const label = categoryTranslations.find(item => item.category_id === category.id)?.name || `Category #${category.id}`;
    append({ actor: admin, action: 'CATEGORY_CREATED', entityType: 'CATEGORY', entityId: category.id, entityLabel: label, createdAt: category.created_at, afterData: category });
  });
  users.filter(user => user.id !== admin?.id).forEach(user => append({ actor: admin, action: 'USER_CREATED', entityType: 'USER', entityId: user.id, entityLabel: user.full_name || user.user_name, createdAt: user.created_at, afterData: sanitizeAuditData(user) }));
  posts.forEach(post => {
    const actor = users.find(user => user.id === post.author_id) || null;
    const label = postTranslations.find(item => item.post_id === post.id && item.language_id === post.source_language_id)?.title || postTranslations.find(item => item.post_id === post.id)?.title || `Post #${post.id}`;
    append({ actor, action: 'POST_CREATED', entityType: 'POST', entityId: post.id, entityLabel: label, createdAt: post.created_at, afterData: post });
    if (post.status === 'PENDING') append({ actor, action: 'POST_SUBMITTED', entityType: 'POST', entityId: post.id, entityLabel: label, createdAt: post.submitted_at || post.updated_at || post.created_at, metadata: { status: post.status } });
    if (post.status === 'PUBLISHED') append({ actor: admin, action: 'POST_APPROVED', entityType: 'POST', entityId: post.id, entityLabel: label, createdAt: post.published_at || post.updated_at || post.created_at, metadata: { status: post.status } });
    if (post.status === 'REJECTED') append({ actor: admin, action: 'POST_REJECTED', entityType: 'POST', entityId: post.id, entityLabel: label, createdAt: post.reviewed_at || post.updated_at || post.created_at, metadata: { rejection_reason: post.rejection_reason } });
  });

  logs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).forEach((log, index) => { log.id = index + 1; });
  db.set('audit_logs', logs);
  localStorage.setItem('vccorp_audit_seed_v1', 'true');
})();
