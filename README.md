# TaskFlow Backend

Backend REST API cho ứng dụng Todo List, xây dựng bằng Node.js, Express, Prisma, SQLite cho local/Docker và PostgreSQL cho deploy Railway + Supabase.

## Chức Năng

- Xem danh sách công việc
- Thêm công việc mới
- Chỉnh sửa công việc
- Xóa công việc
- Đánh dấu hoàn thành/chưa hoàn thành
- Tìm kiếm theo tiêu đề
- Lọc theo trạng thái `all`, `active`, `completed`
- Validate dữ liệu không hợp lệ
- Trả lỗi theo format thống nhất

## Công Nghệ

- Node.js 18+
- Express
- Prisma ORM
- SQLite cho local/Docker
- PostgreSQL cho Railway + Supabase
- Zod validation
- Vitest + Supertest
- Docker

## Chạy Bằng Docker

Yêu cầu: đã cài Docker Desktop.

Từ thư mục backend:

```bash
docker compose -f docker-compose.backend.yml up --build
```

API chạy tại:

```text
http://localhost:4000
```

Kiểm tra server:

```text
http://localhost:4000/health
```

Kết quả mong đợi:

```json
{ "status": "ok" }
```

Dừng container:

```bash
docker compose -f docker-compose.backend.yml down
```

Docker backend dùng SQLite trong Docker volume `backend-db`, nên dữ liệu vẫn còn sau khi restart container. Nếu muốn xóa sạch dữ liệu Docker:

```bash
docker compose -f docker-compose.backend.yml down -v
```

## Chạy Không Dùng Docker

Tạo file `.env` từ `.env.example`:

```bash
copy .env.example .env
```

Cài dependencies và chạy migration:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

API chạy tại:

```text
http://localhost:4000
```

## Biến Môi Trường Local

File `.env` khi chạy local SQLite:

```env
DATABASE_URL="file:./dev.db"
PORT=4000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Không cần `DIRECT_URL` khi chạy local SQLite.

## API Endpoints

Base path:

```text
/api/todos
```

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/todos` | Lấy danh sách công việc |
| `GET` | `/api/todos/:id` | Lấy một công việc |
| `POST` | `/api/todos` | Tạo công việc |
| `PUT` | `/api/todos/:id` | Cập nhật công việc |
| `PATCH` | `/api/todos/:id/toggle` | Đổi trạng thái hoàn thành |
| `DELETE` | `/api/todos/:id` | Xóa công việc |
| `GET` | `/health` | Kiểm tra server |

Query khi lấy danh sách:

| Query | Giá trị | Mặc định |
|---|---|---|
| `search` | Chuỗi bất kỳ | Không có |
| `status` | `all`, `active`, `completed` | `all` |
| `page` | Số nguyên dương | `1` |
| `limit` | Số nguyên dương, tối đa `100` | `10` |
| `sortBy` | `createdAt`, `updatedAt`, `title` | `createdAt` |
| `order` | `asc`, `desc` | `desc` |

Ví dụ:

```bash
curl "http://localhost:4000/api/todos?search=milk&status=active&page=1&limit=10"
```

## Ví Dụ Request

Tạo công việc:

```bash
curl -X POST http://localhost:4000/api/todos ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Buy milk\",\"description\":\"2 bottles\"}"
```

Cập nhật công việc:

```bash
curl -X PUT http://localhost:4000/api/todos/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Buy oat milk\",\"isCompleted\":false}"
```

Đánh dấu hoàn thành/chưa hoàn thành:

```bash
curl -X PATCH http://localhost:4000/api/todos/1/toggle
```

Xóa công việc:

```bash
curl -X DELETE http://localhost:4000/api/todos/1
```

## Format Response

Thành công:

```json
{
  "data": {
    "id": 1,
    "title": "Buy milk",
    "description": null,
    "isCompleted": false,
    "createdAt": "2026-07-05T00:00:00.000Z",
    "updatedAt": "2026-07-05T00:00:00.000Z"
  }
}
```

Danh sách có thêm `meta`:

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```

Lỗi:

```json
{
  "error": {
    "message": "Title cannot be empty",
    "code": "VALIDATION_ERROR",
    "field": "title"
  }
}
```

## Xử Lý Dữ Liệu Không Hợp Lệ

Backend validate các trường hợp:

- Thiếu `title`
- `title` rỗng hoặc chỉ có khoảng trắng
- `title` dài hơn 200 ký tự
- `description` dài hơn 1000 ký tự
- `id` không hợp lệ, ví dụ `abc`, `1.5`, số âm
- Query `status`, `page`, `limit`, `sortBy`, `order` không hợp lệ

## Test

```bash
npm test
```

Kết quả đã kiểm tra:

```text
65 tests passed
```

## Cấu Trúc Thư Mục

```text
src/
  config/             Đọc và validate biến môi trường
  db/                 Prisma client
  middleware/         Logger, 404, error handler
  modules/todos/      Routes, controller, service, repository, validator
  utils/              ApiError dùng chung
tests/
  unit/               Test service
  integration/        Test API endpoint
prisma/
  schema.prisma       Schema SQLite cho local/Docker
  migrations/         Migration SQLite
prisma-postgres/
  schema.prisma       Schema PostgreSQL cho Railway + Supabase
  migrations/         Migration PostgreSQL
```

## Deploy Railway + Supabase

Local/Docker dùng SQLite. Khi deploy Railway, backend dùng PostgreSQL trên Supabase qua schema riêng:

```text
prisma-postgres/schema.prisma
```

Railway dùng file:

```text
railway.json
```

Build command:

```bash
npm ci && npx prisma generate --schema prisma-postgres/schema.prisma
```

Start command:

```bash
npx prisma migrate deploy --schema prisma-postgres/schema.prisma && npm start
```

Biến môi trường cần set trên Railway:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

Ghi chú:

- `DATABASE_URL` dùng Supabase transaction pooler cho runtime.
- `DIRECT_URL` dùng session/direct connection cho Prisma migration.
- Không commit `.env` thật lên GitHub.
- Nếu lộ database password, hãy reset password trong Supabase và cập nhật lại biến môi trường trên Railway.

## Checklist Yêu Cầu

- [x] Tổ chức mã nguồn rõ ràng, dễ đọc và dễ bảo trì
- [x] Xử lý các trường hợp dữ liệu không hợp lệ
- [x] Có README hướng dẫn cách chạy dự án
- [x] Có hướng dẫn chạy bằng Docker
