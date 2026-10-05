import type { RequestHandler } from 'express';
import { MethodNotAllowedError, NotFoundError } from '../../errors/api-errors.js';

/**
 * Regra 15: o Express não diferencia "rota não existe" de "método não
 * suportado". Cada rota termina com methodNotAllowed(...) e, se nenhuma
 * rota casar, routeNotFound responde 404.
 */
export function methodNotAllowed(...allowed: string[]): RequestHandler {
  return () => {
    throw new MethodNotAllowedError([...allowed, 'OPTIONS']);
  };
}

export const routeNotFound: RequestHandler = () => {
  throw new NotFoundError('Recurso não encontrado.');
};
