import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../../errors/api-errors.js';
import { sessionService } from '../../services/session.service.js';

/**
 * Passo 1 da regra 10 -> 401.
 * Regra 3: "Authorization: Bearer <token>", com um espaço depois do Bearer.
 * Token de sessão encerrada não está mais na whitelist, então também dá 401.
 */
export const authenticate: RequestHandler = async (req, res, next) => {
  const match = /^Bearer (\S+)$/.exec(req.get('Authorization') ?? '');
  if (!match?.[1]) {
    throw new UnauthorizedError();
  }

  const auth = await sessionService.findByToken(match[1]);
  if (auth === null) {
    throw new UnauthorizedError();
  }

  res.locals.auth = auth;
  next();
};
