// src/modules/todos/todo.routes.js
// Route definitions for the /api/todos resource.
// Mounts all todo endpoints and wires them to their controller handlers.

import { Router } from 'express';
import * as todoController from './todo.controller.js';

const router = Router();

// List all todos (with search, filter, pagination)
router.get('/', todoController.getAll);

// Get a single todo
router.get('/:id', todoController.getOne);

// Create a new todo
router.post('/', todoController.create);

// Replace a todo (full update)
router.put('/:id', todoController.update);

// Toggle completed status — dedicated endpoint for the most frequent action
router.patch('/:id/toggle', todoController.toggle);

// Delete a todo
router.delete('/:id', todoController.remove);

export default router;
