import { Router } from 'express';
import { sessionController } from './http/controllers/session.controller.js';
import { userController } from './http/controllers/user.controller.js';
import { authenticate } from './http/middlewares/authenticate.js';
import { ensureOwnsUser } from './http/middlewares/ensure-owns-user.js';
import { methodNotAllowed } from './http/middlewares/fallbacks.js';
import { loadUser } from './http/middlewares/load-user.js';
import { validateUserId } from './http/middlewares/validate-user-id.js';

/*
 * Rotas do protocolo (prefixo /api/v1 aplicado em app.ts).
 *
 * Rotas públicas (regra 4): POST /sessions e POST /users.
 * As demais passam pela cadeia da regra 10, nesta ordem:
 *   401 token -> 400 id -> 403 dono -> 404 existe -> (controller) 400 corpo -> 409
 */
export const routes = Router();

/** Passos 1 a 4 da regra 10 para /users/{id}. */
const userIdChain = [authenticate, validateUserId, ensureOwnsUser, loadUser];

routes
  .route('/sessions')
  .post(sessionController.store)
  .all(methodNotAllowed('POST'));

// O YAML não lista 400 para esta rota: não há checagem de formato do id.
routes
  .route('/sessions/:id')
  .delete(authenticate, sessionController.destroy)
  .all(methodNotAllowed('DELETE'));

routes
  .route('/users')
  .post(userController.store)
  .all(methodNotAllowed('POST'));

routes
  .route('/users/:id')
  .get(...userIdChain, userController.show)
  .put(...userIdChain, userController.replace)
  .patch(...userIdChain, userController.update)
  .delete(...userIdChain, userController.destroy)
  .all(methodNotAllowed('GET', 'PUT', 'PATCH', 'DELETE'));
