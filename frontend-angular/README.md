# VCCorp Blog Angular Frontend

Ứng dụng Angular mới được chuyển đổi từng đợt từ giao diện HTML/CSS/JavaScript trong `../docs`.
Thư mục `docs` vẫn được giữ nguyên cho đến khi bản Angular đạt đủ chức năng để thay thế.

## Chạy local

```bash
npm install
npm start
```

Mở `http://localhost:4200`.

## Build production

```bash
npm run build
```

## Build cho GitHub Pages

```bash
npm run build:github
```

Kết quả nằm trong `dist/frontend-angular/browser`. GitHub Actions sẽ được bổ sung khi
bản Angular sẵn sàng thay thế site trong `docs`; đợt 1 chưa thay đổi site đang chạy.

## Phạm vi đợt 1

- Angular 18 standalone application, Router và lazy loading.
- Public layout và admin layout responsive.
- Design tokens/style nền dùng chung.
- Route mẫu: `/`, `/admin/dashboard`, trang 404.
- Cấu hình build có `base-href` phù hợp GitHub Pages.

## Phạm vi đợt 2

- Các model TypeScript dùng chung khớp response Auth/User/Language của NestJS.
- `HttpClient` và functional interceptor tự gắn Bearer token cho API backend.
- `AuthService` quản lý đăng nhập, đăng ký, hồ sơ, phiên đăng nhập và role bằng signals.
- Guard xác thực và guard phân quyền đã sẵn sàng để gắn vào route khi chuyển màn hình đăng nhập.
- `LanguageService` quản lý VI/EN tập trung, lưu lựa chọn và cập nhật giao diện tức thời.
- Pipe dịch tái sử dụng cho public/admin layout.

Backend development mặc định: `http://localhost:3000/api`. Khi deploy thật, chuyển URL này sang
environment/config của môi trường tương ứng; Angular không kết nối trực tiếp tới MySQL.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.21.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
