import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/public-layout/public-layout.component').then(
        (component) => component.PublicLayoutComponent,
      ),
    children: [
      {
        path: '',
        title: 'Trang chủ | VCCorp Blog',
        loadComponent: () =>
          import('./pages/home/home.component').then(
            (component) => component.HomeComponent,
          ),
      },
    ],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component').then(
        (component) => component.AdminLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        title: 'Bảng điều khiển | VCCorp Blog',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard.component').then(
            (component) => component.AdminDashboardComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    title: 'Không tìm thấy trang | VCCorp Blog',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (component) => component.NotFoundComponent,
      ),
  },
];
