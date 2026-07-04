// tests/unit/todo.service.test.js
// Unit tests for the todo service layer.
// The repository is mocked so tests run without a real database.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the repository module before importing the service
vi.mock('../../src/modules/todos/todo.repository.js', () => ({
  findMany: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  toggle: vi.fn(),
  remove: vi.fn(),
}));

import * as todoRepository from '../../src/modules/todos/todo.repository.js';
import * as todoService from '../../src/modules/todos/todo.service.js';
import { ApiError } from '../../src/utils/ApiError.js';

const mockTodo = {
  id: 1,
  title: 'Buy groceries',
  description: null,
  isCompleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('todoService.createTodo', () => {
  it('creates a todo with a valid title', async () => {
    todoRepository.create.mockResolvedValue(mockTodo);
    const result = await todoService.createTodo({ title: 'Buy groceries' });
    expect(todoRepository.create).toHaveBeenCalledWith({ title: 'Buy groceries', description: undefined });
    expect(result).toEqual(mockTodo);
  });

  it('throws 400 when title is missing', async () => {
    await expect(todoService.createTodo({})).rejects.toThrow(ApiError);
    await expect(todoService.createTodo({})).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });

  it('throws 400 when title is only whitespace', async () => {
    await expect(todoService.createTodo({ title: '   ' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws 400 when title exceeds 200 characters', async () => {
    await expect(todoService.createTodo({ title: 'a'.repeat(201) })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe('todoService.getTodo', () => {
  it('returns a todo for a valid id', async () => {
    todoRepository.findById.mockResolvedValue(mockTodo);
    const result = await todoService.getTodo('1');
    expect(result).toEqual(mockTodo);
  });

  it('throws 400 for an invalid id', async () => {
    await expect(todoService.getTodo('abc')).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('todoService.toggleTodo', () => {
  it('calls repository.toggle with the parsed id', async () => {
    const toggled = { ...mockTodo, isCompleted: true };
    todoRepository.toggle.mockResolvedValue(toggled);
    const result = await todoService.toggleTodo('1');
    expect(todoRepository.toggle).toHaveBeenCalledWith(1);
    expect(result.isCompleted).toBe(true);
  });
});

describe('todoService.deleteTodo', () => {
  it('calls repository.remove with the parsed id', async () => {
    todoRepository.remove.mockResolvedValue(undefined);
    await todoService.deleteTodo('1');
    expect(todoRepository.remove).toHaveBeenCalledWith(1);
  });

  it('throws 400 for a non-numeric id', async () => {
    await expect(todoService.deleteTodo('xyz')).rejects.toMatchObject({ statusCode: 400 });
  });
});
