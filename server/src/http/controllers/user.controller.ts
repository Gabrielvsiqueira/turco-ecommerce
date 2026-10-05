import type { RequestHandler } from 'express';
import { userService } from '../../services/user.service.js';
import { presentUser } from '../presenters/user.presenter.js';
import { parseBody } from '../validation/parse-body.js';
import { userPatchRequest, userRequest } from '../validation/schemas.js';

/**
 * Nas rotas /users/{id}, quando o controller roda, os middlewares já
 * garantiram token válido, id bem formatado, dono certo e usuário existente
 * (res.locals.user). Falta só o corpo (400) e o service (409).
 */
export const userController = {
  /** POST /api/v1/users (cadastro) */
  store: (async (req, res) => {
    const data = parseBody(req, userRequest);
    const user = await userService.create(data);

    res.status(201).json(presentUser(user));
  }) satisfies RequestHandler,

  /** GET /api/v1/users/{id} */
  show: ((_req, res) => {
    res.status(200).json(presentUser(res.locals.user));
  }) satisfies RequestHandler,

  /** PUT /api/v1/users/{id}: exige nome, email e senha juntos. */
  replace: (async (req, res) => {
    const data = parseBody(req, userRequest);
    const user = await userService.update(res.locals.user.id, data);

    res.status(200).json(presentUser(user));
  }) satisfies RequestHandler,

  /** PATCH /api/v1/users/{id}: só o que for enviado muda. */
  update: (async (req, res) => {
    const data = parseBody(req, userPatchRequest);
    const user = await userService.update(res.locals.user.id, data);

    res.status(200).json(presentUser(user));
  }) satisfies RequestHandler,

  /** DELETE /api/v1/users/{id}: também derruba todas as sessões do usuário. */
  destroy: (async (_req, res) => {
    await userService.delete(res.locals.user);

    res.status(204).end();
  }) satisfies RequestHandler,
};
