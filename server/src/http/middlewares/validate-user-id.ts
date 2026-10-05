import type { RequestHandler } from 'express';
import { BadRequestError } from '../../errors/api-errors.js';

/**
 * Passo 2 da regra 10 -> 400.
 * O YAML define o id de /users/{id} como integer.
 */
export const validateUserId: RequestHandler = (req, res, next) => {
  const raw = String(req.params.id);
  const id = Number(raw);

  if (!/^-?\d+$/.test(raw) || !Number.isSafeInteger(id)) {
    throw new BadRequestError('O id informado na URL não é um número inteiro válido.');
  }

  res.locals.targetUserId = id;
  next();
};
