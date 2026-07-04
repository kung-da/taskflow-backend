// tests/integration/todo.routes.test.js
// Integration tests for the /api/todos routes.
// Uses supertest to make real HTTP requests against the Express app.
// Prisma is NOT mocked here — tests run against a real SQLite test database.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/db/client.js';

// Ensure we're using the test DATABASE_URL
beforeAll(async () => {
  // Clean database before the test suite
  await prisma.todo.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.todo.deleteMany();
});

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/todos', () => {
  it('creates a todo with valid data', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Integration test todo' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ title: 'Integration test todo', isCompleted: false });
  });

  it('returns 400 for missing title', async () => {
    const res = await request(app).post('/api/todos').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.field).toBe('title');
  });

  it('returns 400 for whitespace-only title', async () => {
    const res = await request(app).post('/api/todos').send({ title: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/todos', () => {
  it('returns an empty list when no todos exist', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('returns todos with pagination meta', async () => {
    await prisma.todo.createMany({
      data: [{ title: 'First' }, { title: 'Second' }],
    });

    const res = await request(app).get('/api/todos?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
  });

  it('filters by status=completed', async () => {
    await prisma.todo.createMany({
      data: [{ title: 'Done', isCompleted: true }, { title: 'Not done' }],
    });

    const res = await request(app).get('/api/todos?status=completed');
    expect(res.body.data.every((t) => t.isCompleted)).toBe(true);
  });
});

describe('GET /api/todos/:id', () => {
  it('returns the todo for a valid id', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Find me' } });
    const res = await request(app).get(`/api/todos/${todo.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Find me');
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/api/todos/99999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/todos/:id', () => {
  it('updates the todo title', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Old title' } });
    const res = await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({ title: 'New title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('New title');
  });
});

describe('PATCH /api/todos/:id/toggle', () => {
  it('toggles isCompleted from false to true', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Toggle me' } });
    const res = await request(app).patch(`/api/todos/${todo.id}/toggle`);
    expect(res.status).toBe(200);
    expect(res.body.data.isCompleted).toBe(true);
  });
});

describe('DELETE /api/todos/:id', () => {
  it('deletes the todo and returns 204', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Delete me' } });
    const res = await request(app).delete(`/api/todos/${todo.id}`);
    expect(res.status).toBe(204);

    const check = await prisma.todo.findUnique({ where: { id: todo.id } });
    expect(check).toBeNull();
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/todos/99999');
    expect(res.status).toBe(404);
  });
});
