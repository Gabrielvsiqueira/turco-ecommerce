import type { RequestHandler } from 'express';
import { sessionService } from '../../services/session.service.js';
import { presentSession } from '../presenters/session.presenter.js';
import { parseBody } from '../validation/parse-body.js';
import { loginRequest } from '../validation/schemas.js';

/**
 * Controllers finos: corpo validado -> service -> presenter.
 * Não têm regra de negócio nem montam erro na mão.
 */
export const sessionController = {
  /** POST /api/v1/sessions (login) */
  store: (async (req, res) => {
    const data = parseBody(req, loginRequest);
    const session = await sessionService.create(data);

    res.status(201).json(presentSession(session));
  }) satisfies RequestHandler,

  /** DELETE /api/v1/sessions/{id} (logout) */
  destroy: (async (req, res) => {
    await sessionService.delete(String(req.params.id), res.locals.auth);

    res.status(204).end();
  }) satisfies RequestHandler,
};
