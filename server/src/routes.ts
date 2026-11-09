import { Router } from 'express';
import { productController } from './http/controllers/product.controller.js';
import { sessionController } from './http/controllers/session.controller.js';
import { userController } from './http/controllers/user.controller.js';
import { authenticate } from './http/middlewares/authenticate.js';
import { ensureOwnerOrAdmin } from './http/middlewares/ensure-owner-or-admin.js';
import { methodNotAllowed } from './http/middlewares/fallbacks.js';
import { loadProduct } from './http/middlewares/load-product.js';
import { loadUser } from './http/middlewares/load-user.js';
import { requireAdmin } from './http/middlewares/require-admin.js';
import { validateId } from './http/middlewares/validate-id.js';

/*
 * Rotas do protocolo (prefixo /api/v1 aplicado em app.ts).
 *
 * Rotas públicas (regra 4): POST /sessions e POST /users.
 * As demais passam pela cadeia da regra 10, nesta ordem:
 *   401 token -> 400 id -> 403 permissão -> 404 existe -> (controller) 400 corpo -> 409
 */
export const routes = Router();

/** Passos 1 a 4 da regra 10 para /users/{id}: dono do id ou ADM. */
const userIdChain = [authenticate, validateId, ensureOwnerOrAdmin, loadUser];

/**
 * /products/{id}: leitura liberada para qualquer logado (o GET não lista 403),
 * escrita só ADM. O requireAdmin vem antes do loadProduct, então o usuário
 * comum recebe 403 mesmo para um produto que não existe (regra 10).
 */
const productReadChain = [authenticate, validateId, loadProduct];
const productWriteChain = [authenticate, validateId, requireAdmin, loadProduct];

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

routes
  .route('/products')
  .get(authenticate, productController.index)
  .post(authenticate, requireAdmin, productController.store)
  .all(methodNotAllowed('GET', 'POST'));

routes
  .route('/products/:id')
  .get(...productReadChain, productController.show)
  .put(...productWriteChain, productController.replace)
  .patch(...productWriteChain, productController.update)
  .delete(...productWriteChain, productController.destroy)
  .all(methodNotAllowed('GET', 'PUT', 'PATCH', 'DELETE'));
