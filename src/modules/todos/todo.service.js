// src/modules/todos/todo.service.js
// Business logic layer — orchestrates validation, rules, and repository calls.
// Controllers call this; this layer never touches Prisma directly.

import * as todoRepository from './todo.repository.js';
import {
  validate,
  validateId,
  createTodoSchema,
  updateTodoSchema,
  listTodosQuerySchema,
} from './todo.validator.js';

/**
 * List todos — validates query params, delegates to repository.
 * @param {object} query  Raw query string params from Express
 */
export async function listTodos(query) {
  const params = validate(listTodosQuerySchema, query);
  return todoRepository.findMany(params);
}

/**
 * Get a single todo by id.
 * @param {string|number} rawId  Route param (may be a string from Express)
 */
export async function getTodo(rawId) {
  const id = validateId(rawId);
  return todoRepository.findById(id);
}

/**
 * Create a new todo after validating input.
 * @param {object} body  Raw request body
 */
export async function createTodo(body) {
  const data = validate(createTodoSchema, body);
  return todoRepository.create(data);
}

/**
 * Update an existing todo after validating input.
 * @param {string|number} rawId
 * @param {object} body
 */
export async function updateTodo(rawId, body) {
  const id = validateId(rawId);
  const data = validate(updateTodoSchema, body);
  return todoRepository.update(id, data);
}

/**
 * Toggle the completed state of a todo.
 * @param {string|number} rawId
 */
export async function toggleTodo(rawId) {
  const id = validateId(rawId);
  return todoRepository.toggle(id);
}

/**
 * Delete a todo by id.
 * @param {string|number} rawId
 */
export async function deleteTodo(rawId) {
  const id = validateId(rawId);
  await todoRepository.remove(id);
}
