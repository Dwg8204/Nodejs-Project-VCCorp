import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { USER_ROLES } from './core/models/auth.model';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-layout/public-layout.component').then((c) => c.PublicLayoutComponent),
    children: [
      { path: 'article/:id', title: 'Article | VCCorp Blog', loadComponent: () => import('./pages/article/article.component').then((c) => c.ArticleComponent) },
      { path: 'profile', title: 'Profile | VCCorp Blog', loadComponent: () => import('./pages/profile/profile.component').then((c) => c.ProfileComponent) },
      { path: 'profile/:id', title: 'Profile | VCCorp Blog', loadComponent: () => import('./pages/profile/profile.component').then((c) => c.ProfileComponent) },
      { path: '', title: 'Trang chủ | VCCorp Blog', loadComponent: () => import('./pages/home/home.component').then((c) => c.HomeComponent) },
    ],
  },
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./layout/auth-layout/auth-layout.component').then((c) => c.AuthLayoutComponent),
    children: [
      { path: 'login', title: 'Đăng nhập | VCCorp Blog', loadComponent: () => import('./pages/auth/login/login.component').then((c) => c.LoginComponent) },
      { path: 'register', title: 'Đăng ký | VCCorp Blog', loadComponent: () => import('./pages/auth/register/register.component').then((c) => c.RegisterComponent) },
      { path: 'forgot-password', title: 'Quên mật khẩu | VCCorp Blog', loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then((c) => c.ForgotPasswordComponent) },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard([USER_ROLES.SUPER_ADMIN])],
    loadComponent: () => import('./layout/admin-layout/admin-layout.component').then((c) => c.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: 'Bảng điều khiển | VCCorp Blog', loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then((c) => c.AdminDashboardComponent) },
    ],
  },
  {
    path: 'owner',
    canActivate: [authGuard, roleGuard([USER_ROLES.BLOG_OWNER])],
    loadComponent: () => import('./layout/public-layout/public-layout.component').then((c) => c.PublicLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'posts' },
      { path: 'posts/new', title: 'Viết bài mới | VCCorp Blog', loadComponent: () => import('./pages/post-form/post-form.component').then((c) => c.PostFormComponent) },
      { path: 'posts/:id/edit', title: 'Chỉnh sửa bài viết | VCCorp Blog', loadComponent: () => import('./pages/post-form/post-form.component').then((c) => c.PostFormComponent) },
      { path: 'posts', title: 'Bài viết của tôi | VCCorp Blog', loadComponent: () => import('./pages/owner-posts/owner-posts.component').then((c) => c.OwnerPostsComponent) },
    ],
  },
  { path: '**', title: 'Không tìm thấy trang | VCCorp Blog', loadComponent: () => import('./pages/not-found/not-found.component').then((c) => c.NotFoundComponent) },
];
