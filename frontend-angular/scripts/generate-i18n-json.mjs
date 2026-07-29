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
    'auth.error.AUTH_INVALID_CREDENTIALS': 'Email hoặc mật khẩu không đúng.',
    'auth.error.AUTH_ACCOUNT_LOCKED': 'Tài khoản đã bị khóa.',
    'auth.error.AUTH_EMAIL_ALREADY_EXISTS': 'Email đã được sử dụng.',
    'auth.error.AUTH_USERNAME_ALREADY_EXISTS': 'Tên người dùng đã được sử dụng.',
    'auth.error.AUTH_PASSWORD_CONFIRMATION_MISMATCH': 'Mật khẩu xác nhận không khớp.',
    'auth.error.AUTH_PASSWORD_COMPLEXITY_REQUIRED': 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.',
    'auth.error.AUTH_OTP_INVALID_OR_EXPIRED': 'Mã OTP không đúng hoặc đã hết hạn.',
    'auth.error.AUTH_OTP_ATTEMPTS_EXCEEDED': 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới.',
    'auth.error.AUTH_RESET_TOKEN_INVALID_OR_EXPIRED': 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
    'auth.error.AUTH_RESET_EMAIL_NOT_CONFIGURED': 'Hệ thống chưa được cấu hình email gửi mã OTP.',
    'auth.error.AUTH_RESET_EMAIL_SEND_FAILED': 'Không thể gửi email OTP. Vui lòng thử lại sau.',
    'auth.error.generic': 'Không thể hoàn tất yêu cầu.',
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
    'auth.error.AUTH_INVALID_CREDENTIALS': 'The email or password is incorrect.',
    'auth.error.AUTH_ACCOUNT_LOCKED': 'This account has been locked.',
    'auth.error.AUTH_EMAIL_ALREADY_EXISTS': 'This email is already in use.',
    'auth.error.AUTH_USERNAME_ALREADY_EXISTS': 'This username is already in use.',
    'auth.error.AUTH_PASSWORD_CONFIRMATION_MISMATCH': 'The passwords do not match.',
    'auth.error.AUTH_PASSWORD_COMPLEXITY_REQUIRED': 'Use at least 8 characters with uppercase, lowercase and a number.',
    'auth.error.AUTH_OTP_INVALID_OR_EXPIRED': 'The OTP is invalid or has expired.',
    'auth.error.AUTH_OTP_ATTEMPTS_EXCEEDED': 'Too many invalid OTP attempts. Please request a new code.',
    'auth.error.AUTH_RESET_TOKEN_INVALID_OR_EXPIRED': 'The password reset session is invalid or has expired.',
    'auth.error.AUTH_RESET_EMAIL_NOT_CONFIGURED': 'The OTP email service has not been configured.',
    'auth.error.AUTH_RESET_EMAIL_SEND_FAILED': 'Unable to send the OTP email. Please try again later.',
    'auth.error.generic': 'Unable to complete the request.',
  },
  zh: {
    ...existingPack('zh'),
    'dashboard.lastDays': '过去 {count} 天',
    'pagination.summary': '显示第 {from}–{to} 项，共 {total} 项',
    'field.email': '电子邮箱',
    'auth.error.AUTH_INVALID_CREDENTIALS': '电子邮箱或密码不正确。',
    'auth.error.AUTH_ACCOUNT_LOCKED': '此账户已被锁定。',
    'auth.error.AUTH_EMAIL_ALREADY_EXISTS': '此电子邮箱已被使用。',
    'auth.error.AUTH_USERNAME_ALREADY_EXISTS': '此用户名已被使用。',
    'auth.error.AUTH_PASSWORD_CONFIRMATION_MISMATCH': '两次输入的密码不一致。',
    'auth.error.AUTH_PASSWORD_COMPLEXITY_REQUIRED': '密码至少 8 个字符，并包含大写字母、小写字母和数字。',
    'auth.error.AUTH_OTP_INVALID_OR_EXPIRED': '验证码无效或已过期。',
    'auth.error.AUTH_OTP_ATTEMPTS_EXCEEDED': '验证码错误次数过多，请重新获取验证码。',
    'auth.error.AUTH_RESET_TOKEN_INVALID_OR_EXPIRED': '密码重置会话无效或已过期。',
    'auth.error.AUTH_RESET_EMAIL_NOT_CONFIGURED': '验证码邮件服务尚未配置。',
    'auth.error.AUTH_RESET_EMAIL_SEND_FAILED': '无法发送验证码邮件，请稍后重试。',
    'auth.error.generic': '无法完成请求。',
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
  'Verify OTP': '验证一次性验证码',
  'Sending…': '正在发送…',
  'John Smith': '张伟',
  'Resend code': '重新发送验证码',
  'Email is required.': '请输入电子邮箱。',
  'At least 8 characters with uppercase, lowercase and a number.':
    '至少 8 个字符，并包含大写字母、小写字母和数字。',
  'Create a new password for your account.': '为你的账户创建新密码。',
  'Recover password': '找回密码',
  'Creating account…': '正在创建账户…',
  'Enter the six-digit OTP sent to you.': '请输入发送给你的六位验证码。',
  'The OTP must contain exactly six digits.': '验证码必须正好为六位数字。',
  'New accounts use the authenticated user role.': '新账户将使用已认证用户角色。',
  'Change email': '更改电子邮箱',
  'No account yet?': '还没有账户？',
  'Create an account': '创建账户',
  Hide: '隐藏',
  'Forgot password?': '忘记密码？',
  'OTP code': '验证码',
  'Use at least 8 characters with uppercase, lowercase and a number.':
    '请使用至少 8 个字符，并包含大写字母、小写字母和数字。',
  'Your password has been reset. You can now sign in with the new password.':
    '密码已重置，现在可以使用新密码登录。',
  'The passwords do not match.': '两次输入的密码不一致。',
  'Passwords do not match.': '两次输入的密码不一致。',
  'At least 8 characters': '至少 8 个字符',
  'Username must contain 2–50 characters.': '用户名必须包含 2–50 个字符。',
  'This field is required.': '此字段为必填项。',
  'Signing in…': '正在登录…',
  'Join the community': '加入社区',
  'Enter your registered email to receive a password reset OTP.':
    '请输入注册邮箱以接收密码重置验证码。',
  'Password is required.': '请输入密码。',
  Show: '显示',
  'By registering, you agree to the system terms of use.':
    '注册即表示你同意系统使用条款。',
  'Send OTP': '发送验证码',
  'Email is invalid.': '电子邮箱格式无效。',
  'Welcome back': '欢迎回来',
  'Updating…': '正在更新…',
  'Continue reading, writing and managing your content.':
    '继续阅读、创作和管理你的内容。',
  'Create account': '创建账户',
  'Quick test accounts': '快速测试账户',
  'Already have an account?': '已有账户？',
  'Back to sign in': '返回登录',
  'Create one': '立即注册',
  'Reset password': '重置密码',
  'New password': '新密码',
  'Sign in': '登录',
  'Verifying…': '正在验证…',
  'Enter a valid email address.': '请输入有效的电子邮箱地址。',
};

const choosePattern =
  /language\.choose\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1\s*,\s*(['"`])((?:\\.|(?!\3)[\s\S])*?)\3\s*\)/g;
const bilingualObjectPattern =
  /\bvi\s*:\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1\s*,\s*en\s*:\s*(['"`])((?:\\.|(?!\3)[\s\S])*?)\3/g;
const chooseObjectPattern =
  /language\.chooseObject\(\s*\{([\s\S]*?)\}\s*,\s*\{([\s\S]*?)\}\s*\)/g;
const objectPropertyPattern =
  /([A-Za-z_$][\w$]*)\s*:\s*(['"`])((?:\\.|(?!\2)[\s\S])*?)\2/g;

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
  for (const match of source.matchAll(chooseObjectPattern)) {
    const vietnamese = Object.fromEntries(
      Array.from(match[1].matchAll(objectPropertyPattern), (property) => [
        property[1],
        decode(property[2], property[3]),
      ]),
    );
    const english = Object.fromEntries(
      Array.from(match[2].matchAll(objectPropertyPattern), (property) => [
        property[1],
        decode(property[2], property[3]),
      ]),
    );
    for (const [name, englishMessage] of Object.entries(english)) {
      const vietnameseMessage = vietnamese[name];
      if (!vietnameseMessage || !englishMessage) continue;
      const key = `runtime.${hash(englishMessage)}`;
      packs.vi[key] = vietnameseMessage;
      packs.en[key] = englishMessage;
      packs.zh[key] ??= englishMessage;
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
