import { Router } from 'express';
import { sessionController } from './http/controllers/session.controller.js';
import { userController } from './http/controllers/user.controller.js';
import { authenticate } from './http/middlewares/authenticate.js';
import { ensureOwnerOrAdmin } from './http/middlewares/ensure-owner-or-admin.js';
import { methodNotAllowed } from './http/middlewares/fallbacks.js';
import { loadUser } from './http/middlewares/load-user.js';
import { requireAdmin } from './http/middlewares/require-admin.js';
import { validateUserId } from './http/middlewares/validate-user-id.js';

/*
 * Rotas do protocolo (prefixo /api/v1 aplicado em app.ts).
 *
 * Rotas públicas (regra 4): POST /sessions e POST /users.
 * As demais passam pela cadeia da regra 10, nesta ordem:
 *   401 token -> 400 id -> 403 permissão -> 404 existe -> (controller) 400 corpo -> 409
 */
export const routes = Router();

/** Passos 1 a 4 da regra 10 para /users/{id}: dono do id ou ADM. */
const userIdChain = [authenticate, validateUserId, ensureOwnerOrAdmin, loadUser];

routes
  .route('/sessions')
  .post(sessionController.store)
  .all(methodNotAllowed('POST'));

// O YAML não lista 400 para esta rota: não há checagem de formato do id.
// Sessão é só do dono, nem o ADM encerra a de outra pessoa.
routes
  .route('/sessions/:id')
  .delete(authenticate, sessionController.destroy)
  .all(methodNotAllowed('DELETE'));

routes
  .route('/users')
  .get(authenticate, requireAdmin, userController.index)
  .post(userController.store)
  .all(methodNotAllowed('GET', 'POST'));

routes
  .route('/users/:id')
  .get(...userIdChain, userController.show)
  .put(...userIdChain, userController.replace)
  .patch(...userIdChain, userController.update)
  .delete(...userIdChain, userController.destroy)
  .all(methodNotAllowed('GET', 'PUT', 'PATCH', 'DELETE'));
