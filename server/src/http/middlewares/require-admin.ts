import type { RequestHandler } from 'express';
import { ForbiddenError } from '../../errors/api-errors.js';

/**
 * Passo 3 da regra 10 -> 403, nas rotas exclusivas de ADM
 * (GET /users e, na próxima fase, as escritas de /products).
 * Roda depois do authenticate.
 */
export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (!res.locals.auth.isAdmin) {
    throw new ForbiddenError('Apenas administradores podem acessar este recurso.');
  }

  next();
};
