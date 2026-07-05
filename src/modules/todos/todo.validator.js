// src/modules/todos/todo.validator.js
// Input validation schemas using Zod.
// All validation rules are defined here — single source of truth for the backend.
// The service layer calls these; controllers never validate raw input themselves.

import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';

// Reusable title schema — enforces trim, non-empty, max length
const titleSchema = z
  .string({ required_error: 'Title is required' })
  .trim()
  .min(1, 'Title cannot be empty')
  .max(200, 'Title cannot exceed 200 characters');

// Reusable description schema — optional, max 1000 chars
const descriptionSchema = z
  .string()
  .trim()
  .max(1000, 'Description cannot exceed 1000 characters')
  .optional()
  .nullable();

export const createTodoSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
});

export const updateTodoSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  isCompleted: z.boolean({ invalid_type_error: 'isCompleted must be a boolean' }).optional(),
});

export const listTodosQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'completed']).optional().default('all'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Validates data against a Zod schema.
 * Throws ApiError(400) with field-specific messages on failure.
 * @param {z.ZodSchema} schema
 * @param {unknown} data
 * @returns {object} Parsed (and transformed) data
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    const field = firstError.path.join('.');
    throw new ApiError(400, firstError.message, 'VALIDATION_ERROR', field || undefined);
  }
  return result.data;
}

/**
 * Validates that an id route param is a positive integer.
 * @param {string|number} id
 * @returns {number}
 */
export function validateId(id) {
  const value = String(id).trim();
  if (!/^[1-9]\d*$/.test(value)) {
    throw new ApiError(400, 'Invalid id - must be a positive integer', 'VALIDATION_ERROR', 'id');
  }
  return Number(value);
}
