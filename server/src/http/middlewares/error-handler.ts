import type { ErrorRequestHandler } from 'express';
import { ApiError, MethodNotAllowedError } from '../../errors/api-errors.js';

/**
 * Regra 6: todo erro sai como {"mensagem": "..."}, sempre JSON,
 * independentemente do header Accept.
 *
 * É o único lugar da aplicação que transforma erro em resposta HTTP.
 * Controllers, services e middlewares só lançam.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof MethodNotAllowedError) {
    res.set('Allow', error.allowed.join(', '));
  }

  if (error instanceof ApiError) {
    res.status(error.status).json({ mensagem: error.message });
    return;
  }

  // Erros 4xx do próprio Express (ex.: corpo grande demais -> 413).
  const status = (error as { status?: unknown })?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ mensagem: 'Requisição inválida.' });
    return;
  }

  // Regra 12: falha inesperada -> 500. O detalhe vai pro log, não pro cliente.
  console.error(error);
  res.status(500).json({ mensagem: 'Erro interno do servidor.' });
};
