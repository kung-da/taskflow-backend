# TaskFlow Backend

REST API for the TaskFlow todo app, built with Express, Prisma, SQLite, and Zod.

## Features

- CRUD API for todos
- Toggle complete/incomplete endpoint
- Search, status filter, pagination, and sorting
- Request validation with clear error responses
- Centralized error handling and 404 handling
- SQLite local database via Prisma
- Unit and integration tests with Vitest and Supertest

## Tech Stack

- Node.js 18+
- Express
- Prisma ORM
- SQLite
- Zod
- Vitest + Supertest
- ESLint + Prettier

## Setup

```bash
npm install
copy .env.example .env
npx prisma migrate deploy
npm run dev
```

The API runs at `http://localhost:4000` by default.

Health check:

```bash
curl http://localhost:4000/health
```

## Run With Docker

From this backend repo:

```bash
docker compose -f docker-compose.backend.yml up --build
```

The API will be available at:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/health
```

Stop and remove the container:

```bash
docker compose -f docker-compose.backend.yml down
```

The Docker setup uses SQLite inside a Docker volume named `backend-db`.

## Environment Variables

Create `.env` from `.env.example`.

| Variable | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `PORT` | `4000` | API server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `NODE_ENV` | `development` | Runtime environment |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start API with nodemon |
| `npm start` | Start API with Node |
| `npm test` | Run backend tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format source files |
| `npm run prisma:migrate` | Create/apply Prisma dev migration |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed sample data |
| `npm run railway:generate` | Generate Prisma client from the PostgreSQL Railway schema |
| `npm run railway:migrate` | Apply PostgreSQL migrations for Railway |

## API Endpoints

Base path: `/api/todos`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/todos` | List todos |
| `GET` | `/api/todos/:id` | Get one todo |
| `POST` | `/api/todos` | Create todo |
| `PUT` | `/api/todos/:id` | Update todo |
| `PATCH` | `/api/todos/:id/toggle` | Toggle completion |
| `DELETE` | `/api/todos/:id` | Delete todo |
| `GET` | `/health` | Health check |

List query params:

| Param | Values | Default |
|---|---|---|
| `search` | Any string | none |
| `status` | `all`, `active`, `completed` | `all` |
| `page` | Positive integer | `1` |
| `limit` | Positive integer up to `100` | `10` |
| `sortBy` | `createdAt`, `updatedAt`, `title` | `createdAt` |
| `order` | `asc`, `desc` | `desc` |

Example:

```bash
curl "http://localhost:4000/api/todos?search=milk&status=active&page=1&limit=10"
```

## Request Examples

Create todo:

```bash
curl -X POST http://localhost:4000/api/todos ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Buy milk\",\"description\":\"2 bottles\"}"
```

Update todo:

```bash
curl -X PUT http://localhost:4000/api/todos/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Buy oat milk\",\"isCompleted\":false}"
```

Toggle todo:

```bash
curl -X PATCH http://localhost:4000/api/todos/1/toggle
```

Delete todo:

```bash
curl -X DELETE http://localhost:4000/api/todos/1
```

## Response Shape

Success:

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

List responses also include `meta`:

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

Error:

```json
{
  "error": {
    "message": "Title cannot be empty",
    "code": "VALIDATION_ERROR",
    "field": "title"
  }
}
```

## Tests

```bash
npm test
```

The `pretest` script applies Prisma migrations to the test SQLite database before Vitest runs.

Current verified result: `65 tests passed`.

## Project Structure

```text
src/
  config/             Environment loading
  db/                 Prisma client
  middleware/         Logger, 404, error handler
  modules/todos/      Routes, controller, service, repository, validation
  utils/              Shared API error class
tests/
  unit/               Service tests
  integration/        API route tests
prisma/
  schema.prisma       Database schema
  migrations/         Versioned migrations
  seed.js             Seed script
```

## Design Notes

- Controllers only map HTTP input/output.
- Services own validation orchestration and business flow.
- Repositories are the only layer that talks to Prisma.
- SQLite keeps local setup simple for reviewers.
- `PATCH /api/todos/:id/toggle` keeps the common completion action explicit and small.

## Deploy Backend To Railway With Supabase

This repo is local-dev friendly with SQLite, but Railway production deployment should use PostgreSQL. The repo includes a separate PostgreSQL Prisma schema at `prisma-postgres/schema.prisma` and a `railway.json` file for Railway deployment.

Railway will use:

- Build command: `npm ci && npx prisma generate --schema prisma-postgres/schema.prisma`
- Start command: `npx prisma migrate deploy --schema prisma-postgres/schema.prisma && npm start`
- Health check: `/health`

For Supabase, the PostgreSQL schema uses both:

```prisma
url       = env("DATABASE_URL")
directUrl = env("DIRECT_URL")
```

Use `DATABASE_URL` for the Supabase transaction-mode pooler and `DIRECT_URL` for the session-mode/direct migration connection.

### 1. Create A Backend GitHub Repository

Push only this backend folder as its own repo:

```bash
cd taskflow-backend
git init
git add .
git commit -m "initial backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow-backend.git
git push -u origin main
```

### 2. Create Railway Project

1. Open Railway.
2. Click `New Project`.
3. Choose `Deploy from GitHub repo`.
4. Select the backend repo.

Railway supports config-as-code with `railway.json`, so the build/start settings in this repo will be used during deploy. See Railway's official config docs: https://docs.railway.com/config-as-code

### 3. Create Supabase Database

1. Create a Supabase project.
2. Open the database connection settings.
3. Copy the transaction-mode pooler URL for runtime.
4. Copy the session-mode pooler or direct URL for migrations.

Example Railway variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
```

Do not commit these values to git.

### 4. Add Backend Variables On Railway

In the Railway backend service variables, set:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

Railway injects `PORT` automatically. The app already reads `process.env.PORT`, so you do not need to hardcode it.

During early testing, you can temporarily set:

```env
CORS_ORIGIN=http://localhost:5173
```

Then update it after the frontend is deployed.

### 5. Deploy

Push to GitHub. Railway will deploy automatically.

After deployment, open:

```text
https://your-railway-service.up.railway.app/health
```

Expected response:

```json
{ "status": "ok" }
```

### 6. Connect Frontend

In the frontend hosting provider, set:

```env
VITE_API_BASE_URL=https://your-railway-service.up.railway.app/api
```

Redeploy the frontend after changing this variable.

### Railway Notes

- Keep using the default `prisma/schema.prisma` for local SQLite development.
- Railway uses `prisma-postgres/schema.prisma`.
- Do not run the SQLite migrations in `prisma/migrations` against Railway PostgreSQL.
- The PostgreSQL migration used by Railway lives in `prisma-postgres/migrations`.
- If you paste database credentials into a chat, issue tracker, or screenshot, rotate the Supabase database password afterward.
