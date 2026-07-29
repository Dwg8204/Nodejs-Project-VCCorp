import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appRoot = path.join(root, 'src', 'app');
const outputRoot = path.join(root, 'public', 'i18n');

function hash(value) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory()
      ? walk(target)
      : /\.(?:ts|html)$/.test(entry.name)
        ? [target]
        : [];
  });
}

function existingPack(code) {
  const file = path.join(outputRoot, `${code}.json`);
  return fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, 'utf8'))
    : {};
}

function decode(quote, value) {
  if (value.includes('${')) return null;
  try {
    return Function(`"use strict";return ${quote}${value}${quote}`)();
  } catch {
    return null;
  }
}

const packs = {
  vi: {
    ...existingPack('vi'),
    'nav.home': 'Trang chủ',
    'nav.profile': 'Hồ sơ',
    'nav.dashboard': 'Bảng điều khiển',
    'nav.managePosts': 'Quản lý bài viết',
    'nav.manageUsers': 'Quản lý người dùng',
    'nav.manageCategories': 'Quản lý danh mục',
    'nav.manageLanguages': 'Quản lý ngôn ngữ',
    'nav.backToBlog': 'Trở về blog',
    'action.search': 'Tìm kiếm...',
    'action.signIn': 'Đăng nhập',
    'action.getStarted': 'Bắt đầu',
    'action.logout': 'Đăng xuất',
    'action.cancel': 'Hủy',
    'action.confirm': 'Xác nhận',
    activityLogs: 'Nhật ký hoạt động',
    'dashboard.lastDays': '{count} ngày qua',
    'pagination.summary': 'Hiển thị {from}–{to} trong tổng số {total}',
    'field.email': 'Email',
  },
  en: {
    ...existingPack('en'),
    'nav.home': 'Home',
    'nav.profile': 'Profile',
    'nav.dashboard': 'Dashboard',
    'nav.managePosts': 'Manage posts',
    'nav.manageUsers': 'Manage users',
    'nav.manageCategories': 'Manage categories',
    'nav.manageLanguages': 'Manage languages',
    'nav.backToBlog': 'Back to blog',
    'action.search': 'Search...',
    'action.signIn': 'Sign in',
    'action.getStarted': 'Get started',
    'action.logout': 'Log out',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    activityLogs: 'Activity logs',
    'dashboard.lastDays': 'Last {count} days',
    'pagination.summary': 'Showing {from}–{to} of {total}',
    'field.email': 'Email',
  },
  zh: {
    ...existingPack('zh'),
    'dashboard.lastDays': '过去 {count} 天',
    'pagination.summary': '显示第 {from}–{to} 项，共 {total} 项',
    'field.email': '电子邮箱',
  },
};

const chineseOverrides = {
  'Missing current language': '缺少当前语言',
  'Confirm this action for': '确认对以下对象执行此操作',
  'All activity states': '所有启用状态',
  Inactive: '未启用',
  'Pending Posts': '待审核文章',
  'Access denied': '无权访问',
  'Post rejected': '文章已拒绝',
  'Language deleted': '语言已删除',
  'Edit User': '编辑用户',
  'Admin (Super Admin)': '管理员（超级管理员）',
  'Blogger (Blog Owner)': '博主',
  'User (Authenticated)': '已认证用户',
  'Email *': '电子邮箱 *',
  'Post thumbnail preview': '文章缩略图预览',
  Preview: '预览',
  'Change Details': '更改详情',
  'Only JPG, PNG or WebP images are accepted.': '仅支持 JPG、PNG 或 WebP 图片。',
  'Deactivate language': '停用语言',
  'Default language changed': '默认语言已更改',
  'Login failed': '登录失败',
  'System languages cannot be deleted': '系统语言不能删除',
  Disabled: '已停用',
  'Language created': '语言已创建',
  Approved: '已批准',
  'Post updated': '文章已更新',
  'Language updated': '语言已更新',
  'Category updated': '分类已更新',
  'Processing…': '正在处理…',
  'Settings updated': '设置已更新',
  'Role changed': '角色已更改',
  'Only active languages with Ready status appear in the system language selector.':
    '只有已启用且状态为“就绪”的语言才会显示在系统语言选择器中。',
  FALLBACK: '备用语言',
  'Post created': '文章已创建',
  'Activate language': '启用语言',
  'Login succeeded': '登录成功',
  'Uploading image to Cloudinary…': '正在将图片上传到 Cloudinary…',
  'User unlocked': '用户已解锁',
  'No change data': '没有变更数据',
  Rejected: '已拒绝',
  Categories: '分类',
  Users: '用户',
  Deleted: '已删除',
  'Post submitted': '文章已提交',
  'Category deleted': '分类已删除',
  'Language added successfully.': '语言添加成功。',
  'Category translated': '分类已翻译',
  'Auto-translated': '自动翻译',
  Ready: '就绪',
  'Not deleted': '未删除',
  Restore: '恢复',
  'Edit user': '编辑用户',
  Published: '已发布',
  'Current language only': '仅当前语言',
  'Available in all languages': '所有语言均可用',
  'Search by name or code...': '按名称或代码搜索...',
  'Post deleted': '文章已删除',
  Pending: '待审核',
  'Restore language': '恢复语言',
  'Category created': '分类已创建',
  'The image must not exceed 5 MB.': '图片不能超过 5 MB。',
  Activate: '启用',
  'Post approved': '文章已批准',
  'Could not upload the image to Cloudinary. Please try again.':
    '无法将图片上传到 Cloudinary，请重试。',
  'All records': '所有记录',
  'Loading users…': '正在加载用户…',
  'Loading profile…': '正在加载个人资料…',
  'No languages found.': '未找到语言。',
  'Language updated successfully.': '语言更新成功。',
  'All translation statuses': '所有翻译状态',
  Translating: '正在翻译',
  'Settings restored': '设置已恢复',
  'User created': '用户已创建',
  Failed: '失败',
  Fallback: '备用语言',
  'Total Posts': '文章总数',
  'Uploading…': '正在上传…',
  'User locked': '用户已锁定',
  'Loading languages…': '正在加载语言…',
  'Saving…': '正在保存…',
  'Engagement / post': '平均每篇互动',
  'Logged out': '已退出登录',
  Drafts: '草稿',
  Deactivate: '停用',
};

const choosePattern =
  /language\.choose\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1\s*,\s*(['"`])((?:\\.|(?!\3)[\s\S])*?)\3\s*\)/g;
const bilingualObjectPattern =
  /\bvi\s*:\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1\s*,\s*en\s*:\s*(['"`])((?:\\.|(?!\3)[\s\S])*?)\3/g;

for (const file of walk(appRoot)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const pattern of [choosePattern, bilingualObjectPattern]) {
    for (const match of source.matchAll(pattern)) {
    const vietnamese = decode(match[1], match[2]);
    const english = decode(match[3], match[4]);
    if (!vietnamese || !english) continue;
    const key = `runtime.${hash(english)}`;
    packs.vi[key] = vietnamese;
    packs.en[key] = english;
    packs.zh[key] ??= english;
    }
  }
}

for (const [english, chinese] of Object.entries(chineseOverrides)) {
  packs.zh[`runtime.${hash(english)}`] = chinese;
}

fs.mkdirSync(outputRoot, { recursive: true });
for (const [code, messages] of Object.entries(packs)) {
  const sorted = Object.fromEntries(
    Object.entries(messages).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
  fs.writeFileSync(
    path.join(outputRoot, `${code}.json`),
    `${JSON.stringify(sorted, null, 2)}\n`,
    'utf8',
  );
}

console.log(
  `Generated ${Object.keys(packs).length} language packs in ${outputRoot}`,
);
