/**
 * Mock Data Initializer
 * File này chạy mỗi khi tải trang để đảm bảo localStorage luôn có dữ liệu giả lập.
 * Dữ liệu bám sát 100% schema Database đã cho.
 */

const MOCK_DATA = {
  roles: [
    { id: 1, name_role: 'SUPER_ADMIN', created_at: '2026-07-01T00:00:00Z' },
    { id: 2, name_role: 'BLOG_OWNER', created_at: '2026-07-01T00:00:00Z' },
    { id: 3, name_role: 'AUTHENTICATED_USER', created_at: '2026-07-01T00:00:00Z' }
  ],

  users: [
    {
      id: 1,
      user_name: 'admin',
      email: 'admin@vccorp.vn',
      full_name: 'Super Admin',
      is_active: true,
      password_hash: 'hash_password_123',
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
      email: 'rita.kind@vccorp.vn',
      full_name: 'Rita Kind-Envy',
      is_active: true,
      password_hash: 'hash_password_123',
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
      email: 'tenney.balogun@vccorp.vn',
      full_name: 'Tenney Balogun',
      is_active: true,
      password_hash: 'hash_password_123',
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
      email: 'james.baker@gmail.com',
      full_name: 'James S. Baker',
      is_active: true,
      password_hash: 'hash_password_123',
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
    { id: 1, code: 'en', name: 'English', flag: '🇬🇧', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 2, code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' }
  ],

  categories: [
    { id: 1, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' }, // UX/UI
    { id: 2, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' }, // Sports
    { id: 3, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' }, // Programming
    { id: 4, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' }  // Lifestyle
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
    { id: 1, author_id: 2, category_id: 1, status: 'PUBLISHED', source_language_id: 1, created_at: '2026-07-05T08:00:00Z', updated_at: '2026-07-05T08:00:00Z' },
    { id: 2, author_id: 3, category_id: 2, status: 'PUBLISHED', source_language_id: 1, created_at: '2026-07-06T15:30:00Z', updated_at: '2026-07-06T15:30:00Z' },
    { id: 3, author_id: 2, category_id: 4, status: 'DRAFT', source_language_id: 1, created_at: '2026-07-07T10:00:00Z', updated_at: '2026-07-07T10:00:00Z' }
  ],

  post_translations: [
    {
      id: 1, post_id: 1, language_id: 1, title: 'What good writing looks like',
      content: '<p>The essential (micro) copy rules I used at Google. Good UX writing is invisible...</p>',
      is_auto_translated: false, created_at: '2026-07-05T08:00:00Z'
    },
    {
      id: 2, post_id: 1, language_id: 2, title: 'Thế nào là kỹ năng viết tốt',
      content: '<p>Các quy tắc viết nội dung siêu nhỏ tôi đã dùng tại Google. Viết UX tốt là khi người dùng không nhận ra nó...</p>',
      is_auto_translated: true, created_at: '2026-07-05T08:05:00Z'
    },
    {
      id: 3, post_id: 2, language_id: 1, title: 'When Bukayo Saka Missed the Penalty',
      content: '<p>In the middle of watching Belgium Vs Senegal, I was speaking with my friends...</p>',
      is_auto_translated: false, created_at: '2026-07-06T15:30:00Z'
    },
    {
      id: 4, post_id: 2, language_id: 2, title: 'Khi Bukayo Saka Sút Hỏng Phạt Đền',
      content: '<p>Vào giữa lúc xem Bỉ đá với Senegal, tôi đang nói chuyện với bạn bè...</p>',
      is_auto_translated: true, created_at: '2026-07-06T15:35:00Z'
    },
    {
      id: 5, post_id: 3, language_id: 1, title: 'How To Save A Summer: What I Dried All Summer Long',
      content: '<p>A guide to drying fruits and vegetables during the summer season.</p>',
      is_auto_translated: false, created_at: '2026-07-07T10:00:00Z'
    }
  ],

  comments: [
    { id: 1, user_id: 4, post_id: 1, parent_id: null, is_reply: false, content: 'Great insights! I completely agree with the micro-copy rules.', created_at: '2026-07-05T09:12:00Z' },
    { id: 2, user_id: 2, post_id: 1, parent_id: 1, is_reply: true, content: 'Thank you James! Glad you found it useful.', created_at: '2026-07-05T10:30:00Z' }
  ],

  post_likes: [
    { id: 1, post_id: 1, user_id: 4, is_liked: true, updated_at: '2026-07-05T09:15:00Z' },
    { id: 2, post_id: 1, user_id: 3, is_liked: true, updated_at: '2026-07-05T11:00:00Z' },
    { id: 3, post_id: 2, user_id: 4, is_liked: true, updated_at: '2026-07-06T16:00:00Z' }
  ]
};

// Hàm khởi tạo Mock Data
function initMockData() {
  const isInitialized = localStorage.getItem('vccorp_mock_initialized');
  if (!isInitialized) {
    console.log('Khởi tạo Mock Data lần đầu...');
    // Đẩy từng table vào localStorage
    Object.keys(MOCK_DATA).forEach(table => {
      localStorage.setItem(`db_${table}`, JSON.stringify(MOCK_DATA[table]));
    });

    // Set current language default is English (id = 1)
    localStorage.setItem('current_language_id', '1');

    // Đánh dấu đã khởi tạo
    localStorage.setItem('vccorp_mock_initialized', 'true');
  }
}

// Chạy khởi tạo
initMockData();

// Utility helpers để truy xuất dữ liệu dễ dàng hơn
const db = {
  get: (table) => JSON.parse(localStorage.getItem(`db_${table}`) || '[]'),
  set: (table, data) => localStorage.setItem(`db_${table}`, JSON.stringify(data)),

  // Hàm lấy data join (ví dụ lấy Post kèm thông tin Author và Category Translation)
  getPostsWithDetails: (languageId) => {
    const posts = db.get('posts').filter(p => p.status === 'PUBLISHED');
    const users = db.get('users');
    const translations = db.get('post_translations');
    const categoryTrans = db.get('category_translation');
    const likes = db.get('post_likes');
    const comments = db.get('comments');

    return posts.map(post => {
      const author = users.find(u => u.id === post.author_id) || {};

      // Tìm bản dịch bài viết theo ngôn ngữ, nếu không có fallback về source_language
      let postTrans = translations.find(t => t.post_id === post.id && t.language_id == languageId);
      if (!postTrans) {
        postTrans = translations.find(t => t.post_id === post.id && t.language_id == post.source_language_id) || {};
      }

      // Tìm bản dịch danh mục
      let catTrans = categoryTrans.find(c => c.category_id === post.category_id && c.language_id == languageId);
      if (!catTrans) {
        catTrans = categoryTrans.find(c => c.category_id === post.category_id) || {};
      }

      // Đếm like và comment
      const postLikeCount = likes.filter(l => l.post_id === post.id && l.is_liked).length;
      const postCommentCount = comments.filter(c => c.post_id === post.id).length;

      return {
        ...post,
        author_name: author.full_name || author.user_name,
        author_avatar: author.user_name?.charAt(0).toUpperCase(),
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

  login: (email, password) => {
    const users = db.get('users');
    const user = users.find(u => u.email === email && u.password_hash === password && u.is_active);
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user));
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem('current_user');
  }
};
