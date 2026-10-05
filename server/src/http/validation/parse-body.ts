import type { Request } from 'express';
import type { z } from 'zod';
import { BadRequestError } from '../../errors/api-errors.js';

/**
 * Lê e valida o corpo JSON da requisição.
 *
 * Por que é uma função chamada pelo controller e não um middleware global:
 * pela regra 10, um corpo inválido (400) só pode ser apontado DEPOIS de
 * 401, 400 do id, 403 e 404. O controller roda depois de todos os
 * middlewares da rota, então a ordem sai certa.
 *
 * Regra 2: o corpo chega cru (express.raw em app.ts) e é lido como JSON
 * independentemente do Content-Type, com ou sem charset.
 */
export function parseBody<S extends z.ZodType>(req: Request, schema: S): z.output<S> {
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';

  if (raw.trim() === '') {
    throw new BadRequestError('O corpo da requisição é obrigatório.');
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    throw new BadRequestError('JSON mal formatado.');
  }

  if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
    throw new BadRequestError('O corpo da requisição deve ser um objeto JSON.');
  }

  const result = schema.safeParse(decoded);
  if (!result.success) {
    // O protocolo pede uma mensagem só: devolve o primeiro problema encontrado.
    throw new BadRequestError(result.error.issues[0]?.message ?? 'Corpo da requisição inválido.');
  }

  return result.data;
}
