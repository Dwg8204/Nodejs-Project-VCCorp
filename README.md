# VCCorp Blog Platform

Nền tảng blog đa ngôn ngữ gồm:

- Frontend Angular 18 trong `frontend-angular/`.
- Backend NestJS 11 trong `backend/`.
- MySQL được quản lý bằng TypeORM migrations.
- Cloudinary lưu ảnh, Gmail SMTP gửi OTP và Redis cache dữ liệu ít thay đổi.

Người mới tiếp nhận dự án nên bắt đầu tại [PROJECT_DOCS/README.md](PROJECT_DOCS/README.md).

## Chạy nhanh ở local

```powershell
# Terminal 1
cd backend
npm install
npm run migration:run
npm run dev

# Terminal 2
cd frontend-angular
npm install
npm start
```

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:3000/api`
- Health check: `http://localhost:3000/api/health`

Không commit `.env`, JWT secret, Gmail App Password, Cloudinary secret hoặc mật khẩu database.
