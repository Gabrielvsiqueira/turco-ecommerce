import type { RequestHandler } from 'express';
import { ForbiddenError } from '../../errors/api-errors.js';

/**
 * Passo 3 da regra 10 -> 403.
 * Compara o id da URL com o dono do token ANTES de ir ao banco: assim
 * "id de outro usuário, exista ou não, sempre dá 403" sai naturalmente.
 */
export const ensureOwnsUser: RequestHandler = (_req, res, next) => {
  if (res.locals.targetUserId !== res.locals.auth.userId) {
    throw new ForbiddenError('O id informado não pertence ao usuário autenticado.');
  }

  next();
};
