import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireObjectBody } from '../middleware/validation.js';
import {
  createManagedUser,
  getManagedUserById,
  listManagedUsers,
} from '../services/managed-user-service.js';

type CreateUserRequest = {
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
};

export const usersRouter = Router();

usersRouter.get('/users', requireAuth, asyncHandler(async (req, res) => {
  const result = await listManagedUsers();
  res.status(result.status).json(result.body);
}));

usersRouter.post('/users', requireAuth, requireObjectBody, asyncHandler(async (req, res) => {
  const result = await createManagedUser((req.body || {}) as CreateUserRequest);
  res.status(result.status).json(result.body);
}));

usersRouter.get('/users/:id', requireAuth, asyncHandler(async (req, res) => {
  const result = await getManagedUserById(req.params.id);
  res.status(result.status).json(result.body);
}));
