# Deploy thử nghiệm trên Ubuntu VMware

## 1. Chuẩn bị biến môi trường

```bash
cp .env.docker.example .env.docker
nano .env.docker
```

Đổi toàn bộ giá trị `replace-with-*`. `CORS_ORIGIN` phải là địa chỉ mở trên
trình duyệt Windows, ví dụ `http://192.168.101.128`.

## 2. Build image

Các lệnh Compose phải luôn nhận cùng file biến môi trường:

```bash
docker compose --env-file .env.docker build
```

## 3. Khởi động database và Redis

```bash
docker compose --env-file .env.docker up -d mysql redis
docker compose --env-file .env.docker ps
```

## 4. Chạy migration production

```bash
docker compose --env-file .env.docker run --rm app npm run migration:run:prod
```

Migration phải hoàn tất trước khi mở ứng dụng lần đầu.

## 5. Khởi động toàn hệ thống

```bash
docker compose --env-file .env.docker up -d
docker compose --env-file .env.docker ps
```

Mở `http://<IP-UBUNTU>` trên Windows. API health check nằm tại
`http://<IP-UBUNTU>/api/health`.

## 6. Xem log

```bash
docker compose --env-file .env.docker logs -f app
```

Thoát chế độ theo dõi log bằng `Ctrl+C`.

## 7. Dừng hoặc khởi động lại

```bash
docker compose --env-file .env.docker stop
docker compose --env-file .env.docker up -d
```

Không chạy `docker compose down -v`: tham số `-v` xóa volume MySQL và Redis.
