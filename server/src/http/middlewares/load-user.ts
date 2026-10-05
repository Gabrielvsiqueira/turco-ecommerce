import type { RequestHandler } from 'express';
import { NotFoundError } from '../../errors/api-errors.js';
import { userService } from '../../services/user.service.js';

/** Passo 4 da regra 10 -> 404. */
export const loadUser: RequestHandler = async (_req, res, next) => {
  const user = await userService.findById(res.locals.targetUserId);
  if (user === null) {
    throw new NotFoundError('Usuário não encontrado.');
  }

  res.locals.user = user;
  next();
};
