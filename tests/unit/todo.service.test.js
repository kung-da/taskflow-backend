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

// ─── CREATE ────────────────────────────────────────────────

describe('todoService.createTodo', () => {
  it('creates a todo with a valid title', async () => {
    todoRepository.create.mockResolvedValue(mockTodo);
    const result = await todoService.createTodo({ title: 'Buy groceries' });
    expect(todoRepository.create).toHaveBeenCalledWith({
      title: 'Buy groceries',
      description: undefined,
    });
    expect(result).toEqual(mockTodo);
  });

  it('trims leading/trailing whitespace from title', async () => {
    todoRepository.create.mockResolvedValue(mockTodo);
    await todoService.createTodo({ title: '  Buy groceries  ' });
    expect(todoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Buy groceries' }),
    );
  });

  it('creates a todo with title and description', async () => {
    const withDesc = { ...mockTodo, description: 'Milk, eggs, bread' };
    todoRepository.create.mockResolvedValue(withDesc);
    const result = await todoService.createTodo({
      title: 'Buy groceries',
      description: 'Milk, eggs, bread',
    });
    expect(todoRepository.create).toHaveBeenCalledWith({
      title: 'Buy groceries',
      description: 'Milk, eggs, bread',
    });
    expect(result.description).toBe('Milk, eggs, bread');
  });

  it('throws 400 when title is missing', async () => {
    await expect(todoService.createTodo({})).rejects.toThrow(ApiError);
    await expect(todoService.createTodo({})).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws 400 when title is only whitespace', async () => {
    await expect(todoService.createTodo({ title: '   ' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws 400 when title is empty string', async () => {
    await expect(todoService.createTodo({ title: '' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws 400 when title exceeds 200 characters', async () => {
    await expect(
      todoService.createTodo({ title: 'a'.repeat(201) }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('allows title at exactly 200 characters', async () => {
    todoRepository.create.mockResolvedValue({ ...mockTodo, title: 'a'.repeat(200) });
    const result = await todoService.createTodo({ title: 'a'.repeat(200) });
    expect(result.title).toHaveLength(200);
  });

  it('throws 400 when description exceeds 1000 characters', async () => {
    await expect(
      todoService.createTodo({ title: 'Valid', description: 'a'.repeat(1001) }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── READ ──────────────────────────────────────────────────

describe('todoService.getTodo', () => {
  it('returns a todo for a valid id', async () => {
    todoRepository.findById.mockResolvedValue(mockTodo);
    const result = await todoService.getTodo('1');
    expect(todoRepository.findById).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockTodo);
  });

  it('throws 400 for an invalid (non-numeric) id', async () => {
    await expect(todoService.getTodo('abc')).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      field: 'id',
    });
  });

  it('throws 400 for negative id', async () => {
    await expect(todoService.getTodo('-1')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for zero id', async () => {
    await expect(todoService.getTodo('0')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for decimal id', async () => {
    await expect(todoService.getTodo('1.5')).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── LIST ──────────────────────────────────────────────────

describe('todoService.listTodos', () => {
  it('returns todos with validated pagination params', async () => {
    todoRepository.findMany.mockResolvedValue({ todos: [mockTodo], total: 1 });
    const result = await todoService.listTodos({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(1);
    expect(result.todos).toHaveLength(1);
  });

  it('passes validated search and filter to repository', async () => {
    todoRepository.findMany.mockResolvedValue({ todos: [], total: 0 });
    await todoService.listTodos({
      search: 'groceries',
      status: 'active',
      page: '2',
      limit: '5',
    });
    expect(todoRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'groceries',
        status: 'active',
        page: 2,
        limit: 5,
      }),
    );
  });

  it('applies default sortBy and order', async () => {
    todoRepository.findMany.mockResolvedValue({ todos: [], total: 0 });
    await todoService.listTodos({});
    expect(todoRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'createdAt', order: 'desc' }),
    );
  });
});

// ─── UPDATE ────────────────────────────────────────────────

describe('todoService.updateTodo', () => {
  it('updates a todo with valid data', async () => {
    const updated = { ...mockTodo, title: 'Updated title' };
    todoRepository.update.mockResolvedValue(updated);
    const result = await todoService.updateTodo('1', { title: 'Updated title' });
    expect(todoRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Updated title' }));
    expect(result.title).toBe('Updated title');
  });

  it('throws 400 for invalid id', async () => {
    await expect(
      todoService.updateTodo('abc', { title: 'Valid' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for invalid body', async () => {
    await expect(
      todoService.updateTodo('1', { title: '' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when isCompleted is not a boolean', async () => {
    await expect(
      todoService.updateTodo('1', { title: 'Valid', isCompleted: 'yes' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── TOGGLE ────────────────────────────────────────────────

describe('todoService.toggleTodo', () => {
  it('calls repository.toggle with the parsed id', async () => {
    const toggled = { ...mockTodo, isCompleted: true };
    todoRepository.toggle.mockResolvedValue(toggled);
    const result = await todoService.toggleTodo('1');
    expect(todoRepository.toggle).toHaveBeenCalledWith(1);
    expect(result.isCompleted).toBe(true);
  });

  it('throws 400 for invalid id', async () => {
    await expect(todoService.toggleTodo('abc')).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── DELETE ────────────────────────────────────────────────

describe('todoService.deleteTodo', () => {
  it('calls repository.remove with the parsed id', async () => {
    todoRepository.remove.mockResolvedValue(undefined);
    await todoService.deleteTodo('1');
    expect(todoRepository.remove).toHaveBeenCalledWith(1);
  });

  it('throws 400 for a non-numeric id', async () => {
    await expect(todoService.deleteTodo('xyz')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for zero id', async () => {
    await expect(todoService.deleteTodo('0')).rejects.toMatchObject({ statusCode: 400 });
  });
});
