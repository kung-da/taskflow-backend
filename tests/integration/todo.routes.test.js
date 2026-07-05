// tests/integration/todo.routes.test.js
// Integration tests for the /api/todos routes.
// Uses supertest to make real HTTP requests against the Express app.
// Prisma is NOT mocked here — tests run against a real SQLite test database.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/db/client.js';

beforeAll(async () => {
  await prisma.todo.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.todo.deleteMany();
});

// ─── HEALTH CHECK ──────────────────────────────────────────

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

// ─── CREATE ────────────────────────────────────────────────

describe('POST /api/todos', () => {
  it('creates a todo with valid data — 201', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Integration test todo' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: 'Integration test todo',
      isCompleted: false,
    });
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();
  });

  it('creates a todo with title + description', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'With desc', description: 'Some details' });

    expect(res.status).toBe(201);
    expect(res.body.data.description).toBe('Some details');
  });

  it('trims title whitespace', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: '  Trimmed  ' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Trimmed');
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
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for empty string title', async () => {
    const res = await request(app).post('/api/todos').send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for title exceeding 200 characters', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'a'.repeat(201) });
    expect(res.status).toBe(400);
  });

  it('allows title at exactly 200 characters', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'a'.repeat(200) });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toHaveLength(200);
  });

  it('returns 400 for description exceeding 1000 characters', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Valid', description: 'a'.repeat(1001) });
    expect(res.status).toBe(400);
  });

  it('handles malformed JSON body gracefully', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Content-Type', 'application/json')
      .send('{"title": }');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PARSE_ERROR');
  });
});

// ─── LIST ──────────────────────────────────────────────────

describe('GET /api/todos', () => {
  it('returns an empty list with correct meta when no todos exist', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta).toEqual({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });

  it('returns todos with pagination meta', async () => {
    await prisma.todo.createMany({
      data: [{ title: 'First' }, { title: 'Second' }],
    });

    const res = await request(app).get('/api/todos?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.meta.totalPages).toBe(1);
  });

  it('paginates correctly — returns only the requested page', async () => {
    // Create 15 todos
    for (let i = 1; i <= 15; i++) {
      await prisma.todo.create({ data: { title: `Todo ${i}` } });
    }

    const page1 = await request(app).get('/api/todos?page=1&limit=5');
    expect(page1.body.data).toHaveLength(5);
    expect(page1.body.meta.totalPages).toBe(3);
    expect(page1.body.meta.total).toBe(15);

    const page2 = await request(app).get('/api/todos?page=2&limit=5');
    expect(page2.body.data).toHaveLength(5);

    const page3 = await request(app).get('/api/todos?page=3&limit=5');
    expect(page3.body.data).toHaveLength(5);

    const page4 = await request(app).get('/api/todos?page=4&limit=5');
    expect(page4.body.data).toHaveLength(0);
  });

  it('filters by status=completed', async () => {
    await prisma.todo.createMany({
      data: [
        { title: 'Done', isCompleted: true },
        { title: 'Not done', isCompleted: false },
      ],
    });

    const res = await request(app).get('/api/todos?status=completed');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data.every((t) => t.isCompleted)).toBe(true);
    expect(res.body.meta.total).toBe(1);
  });

  it('filters by status=active', async () => {
    await prisma.todo.createMany({
      data: [
        { title: 'Done', isCompleted: true },
        { title: 'Not done', isCompleted: false },
      ],
    });

    const res = await request(app).get('/api/todos?status=active');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data.every((t) => !t.isCompleted)).toBe(true);
  });

  it('searches by title (case-insensitive)', async () => {
    await prisma.todo.createMany({
      data: [
        { title: 'Buy groceries' },
        { title: 'Sell groceries' },
        { title: 'Read a book' },
      ],
    });

    const res = await request(app).get('/api/todos?search=groceries');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
  });

  it('combines search + filter correctly', async () => {
    await prisma.todo.createMany({
      data: [
        { title: 'Buy groceries', isCompleted: true },
        { title: 'Sell groceries', isCompleted: false },
        { title: 'Read a book', isCompleted: false },
      ],
    });

    const res = await request(app).get('/api/todos?search=groceries&status=active');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Sell groceries');
    expect(res.body.data[0].isCompleted).toBe(false);
  });

  it('returns empty when search matches nothing', async () => {
    await prisma.todo.create({ data: { title: 'Existing todo' } });
    const res = await request(app).get('/api/todos?search=nonexistent');
    expect(res.body.data).toHaveLength(0);
    expect(res.body.meta.total).toBe(0);
  });

  it('sorts by createdAt desc by default', async () => {
    const first = await prisma.todo.create({ data: { title: 'First created' } });
    const second = await prisma.todo.create({ data: { title: 'Second created' } });

    const res = await request(app).get('/api/todos');
    // Most recent first (desc)
    expect(res.body.data[0].id).toBe(second.id);
    expect(res.body.data[1].id).toBe(first.id);
  });

  it('sorts by title asc when requested', async () => {
    await prisma.todo.createMany({
      data: [{ title: 'Banana' }, { title: 'Apple' }, { title: 'Cherry' }],
    });

    const res = await request(app).get('/api/todos?sortBy=title&order=asc');
    expect(res.body.data[0].title).toBe('Apple');
    expect(res.body.data[1].title).toBe('Banana');
    expect(res.body.data[2].title).toBe('Cherry');
  });
});

// ─── GET ONE ───────────────────────────────────────────────

describe('GET /api/todos/:id', () => {
  it('returns the todo in data envelope', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Find me' } });
    const res = await request(app).get(`/api/todos/${todo.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Find me');
    expect(res.body.data.id).toBe(todo.id);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/api/todos/99999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for an invalid (non-numeric) id', async () => {
    const res = await request(app).get('/api/todos/abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── UPDATE ────────────────────────────────────────────────

describe('PUT /api/todos/:id', () => {
  it('updates the todo title', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Old title' } });
    const res = await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({ title: 'New title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('New title');
  });

  it('updates title and description together', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Original' } });
    const res = await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({ title: 'Updated', description: 'New description' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated');
    expect(res.body.data.description).toBe('New description');
  });

  it('updates isCompleted via PUT', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Task' } });
    const res = await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({ title: 'Task', isCompleted: true });

    expect(res.status).toBe(200);
    expect(res.body.data.isCompleted).toBe(true);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app)
      .put('/api/todos/99999')
      .send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid body', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Valid' } });
    const res = await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when isCompleted is not a boolean', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Task' } });
    const res = await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({ title: 'Task', isCompleted: 'yes' });
    expect(res.status).toBe(400);
  });
});

// ─── TOGGLE ────────────────────────────────────────────────

describe('PATCH /api/todos/:id/toggle', () => {
  it('toggles isCompleted from false to true', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Toggle me' } });
    const res = await request(app).patch(`/api/todos/${todo.id}/toggle`);
    expect(res.status).toBe(200);
    expect(res.body.data.isCompleted).toBe(true);
  });

  it('toggles back from true to false', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Toggle twice', isCompleted: true } });
    const res = await request(app).patch(`/api/todos/${todo.id}/toggle`);
    expect(res.status).toBe(200);
    expect(res.body.data.isCompleted).toBe(false);
  });

  it('double-toggle returns to the original state', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Double' } });
    expect(todo.isCompleted).toBe(false);

    await request(app).patch(`/api/todos/${todo.id}/toggle`);
    const res = await request(app).patch(`/api/todos/${todo.id}/toggle`);
    expect(res.body.data.isCompleted).toBe(false);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).patch('/api/todos/99999/toggle');
    expect(res.status).toBe(404);
  });
});

// ─── DELETE ────────────────────────────────────────────────

describe('DELETE /api/todos/:id', () => {
  it('deletes the todo and returns 204', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Delete me' } });
    const res = await request(app).delete(`/api/todos/${todo.id}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const check = await prisma.todo.findUnique({ where: { id: todo.id } });
    expect(check).toBeNull();
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/todos/99999');
    expect(res.status).toBe(404);
  });

  it('returns 404 when deleting the same todo twice', async () => {
    const todo = await prisma.todo.create({ data: { title: 'Once only' } });
    await request(app).delete(`/api/todos/${todo.id}`);
    const res = await request(app).delete(`/api/todos/${todo.id}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid id', async () => {
    const res = await request(app).delete('/api/todos/invalid');
    expect(res.status).toBe(400);
  });
});

// ─── 404 FALLBACK ──────────────────────────────────────────

describe('404 fallback', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
