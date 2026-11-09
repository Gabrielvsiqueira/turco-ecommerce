import type { RequestHandler } from 'express';
import { ForbiddenError } from '../../errors/api-errors.js';

/**
 * Passo 3 da regra 10 -> 403, nas rotas /users/{id}.
 * Passa se o id da URL é do dono do token OU se o dono do token é ADM (regra 4).
 *
 * Compara ANTES de ir ao banco: para o usuário comum, "id de outro usuário,
 * exista ou não, sempre dá 403". Para o ADM, um id inexistente segue para o
 * loadUser e dá 404.
 */
export const ensureOwnerOrAdmin: RequestHandler = (_req, res, next) => {
  const { auth, targetUserId } = res.locals;

  if (targetUserId !== auth.userId && !auth.isAdmin) {
    throw new ForbiddenError('O id informado não pertence ao usuário autenticado.');
  }

  next();
};
