import type { RequestHandler } from 'express';
import { NotFoundError } from '../../errors/api-errors.js';
import { productService } from '../../services/product.service.js';

/** Passo 4 da regra 10 -> 404, nas rotas /products/{id}. */
export const loadProduct: RequestHandler = async (_req, res, next) => {
  const product = await productService.findById(res.locals.targetId);
  if (product === null) {
    throw new NotFoundError('Produto não encontrado.');
  }

  res.locals.product = product;
  next();
};
