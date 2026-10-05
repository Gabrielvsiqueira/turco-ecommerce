import type { RequestHandler } from 'express';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Regra 5 do protocolo.
 *
 * - Toda resposta (inclusive erro) leva os três cabeçalhos CORS: eles são
 *   definidos antes de qualquer outro middleware, então ficam em tudo que
 *   for respondido depois, até no error handler.
 * - Toda requisição OPTIONS (preflight) responde 204, sem token e sem corpo.
 *
 * O pacote "cors" não serve: ele só manda Allow-Methods/Allow-Headers no preflight.
 */
export const protocolCors: RequestHandler = (req, res, next) => {
  res.set(HEADERS);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
};
