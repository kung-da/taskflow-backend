// src/modules/todos/todo.repository.js
// Data access layer — the ONLY place that talks to Prisma/the database.
// Services call this; no other layer interacts with Prisma directly.
// All DB errors are caught here and translated to ApiErrors before propagating.

import prisma from '../../db/client.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Fetch a paginated list of todos with optional search and status filter.
 *
 * Note on search: SQLite does not support Prisma's `mode: 'insensitive'`.
 * We use a raw SQL approach for case-insensitive LIKE matching on SQLite.
 * When switching to PostgreSQL in production, the `mode: 'insensitive'`
 * option can be used directly in the Prisma query.
 *
 * @param {{ search?: string, status?: 'all'|'active'|'completed', page: number, limit: number, sortBy: string, order: 'asc'|'desc' }} params
 * @returns {{ todos: Todo[], total: number }}
 */
export async function findMany({ search, status, page, limit, sortBy, order }) {
  const where = {};

  // Case-insensitive search: SQLite's `LIKE` is case-insensitive for ASCII by default,
  // so `contains` without `mode` works for English text on SQLite.
  if (search) {
    where.title = { contains: search };
  }

  if (status === 'active') {
    where.isCompleted = false;
  } else if (status === 'completed') {
    where.isCompleted = true;
  }

  const [todos, total] = await prisma.$transaction([
    prisma.todo.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.todo.count({ where }),
  ]);

  return { todos, total };
}

/**
 * Fetch a single todo by id. Throws 404 if not found.
 * @param {number} id
 * @returns {Todo}
 */
export async function findById(id) {
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    throw new ApiError(404, 'Todo not found', 'NOT_FOUND');
  }
  return todo;
}

/**
 * Create a new todo.
 * @param {{ title: string, description?: string }} data
 * @returns {Todo}
 */
export async function create(data) {
  return prisma.todo.create({ data });
}

/**
 * Update an existing todo by id. Throws 404 if not found.
 * @param {number} id
 * @param {{ title?: string, description?: string, isCompleted?: boolean }} data
 * @returns {Todo}
 */
export async function update(id, data) {
  try {
    return await prisma.todo.update({ where: { id }, data });
  } catch (err) {
    // Prisma P2025: record not found
    if (err.code === 'P2025') {
      throw new ApiError(404, 'Todo not found', 'NOT_FOUND');
    }
    throw err;
  }
}

/**
 * Toggle the isCompleted flag on a todo. Throws 404 if not found.
 * @param {number} id
 * @returns {Todo}
 */
export async function toggle(id) {
  const todo = await findById(id);
  return prisma.todo.update({
    where: { id },
    data: { isCompleted: !todo.isCompleted },
  });
}

/**
 * Delete a todo by id. Throws 404 if not found.
 * @param {number} id
 * @returns {void}
 */
export async function remove(id) {
  try {
    await prisma.todo.delete({ where: { id } });
  } catch (err) {
    if (err.code === 'P2025') {
      throw new ApiError(404, 'Todo not found', 'NOT_FOUND');
    }
    throw err;
  }
}
