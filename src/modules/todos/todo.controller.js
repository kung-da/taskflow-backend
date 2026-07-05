// src/modules/todos/todo.controller.js
// HTTP layer — parses req, calls service, sends standardized res.
// No business logic lives here; only HTTP-in / HTTP-out mapping.

import * as todoService from './todo.service.js';

/**
 * GET /api/todos
 * Query: search, status, page, limit, sortBy, order
 */
export async function getAll(req, res, next) {
  try {
    const result = await todoService.listTodos(req.query);
    res.json({
      data: result.todos,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/todos/:id
 */
export async function getOne(req, res, next) {
  try {
    const todo = await todoService.getTodo(req.params.id);
    res.json({ data: todo });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/todos
 */
export async function create(req, res, next) {
  try {
    const todo = await todoService.createTodo(req.body);
    res.status(201).json({ data: todo });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/todos/:id
 */
export async function update(req, res, next) {
  try {
    const todo = await todoService.updateTodo(req.params.id, req.body);
    res.json({ data: todo });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/todos/:id/toggle
 */
export async function toggle(req, res, next) {
  try {
    const todo = await todoService.toggleTodo(req.params.id);
    res.json({ data: todo });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/todos/:id
 */
export async function remove(req, res, next) {
  try {
    await todoService.deleteTodo(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
