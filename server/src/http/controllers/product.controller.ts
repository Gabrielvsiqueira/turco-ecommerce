import type { RequestHandler } from 'express';
import { productService } from '../../services/product.service.js';
import { presentProduct } from '../presenters/product.presenter.js';
import { parseBody } from '../validation/parse-body.js';
import { productPatchRequest, productRequest } from '../validation/schemas.js';

/**
 * Nas rotas /products/{id}, quando o controller roda, os middlewares já
 * garantiram token válido, id bem formatado, permissão (ADM, nas escritas) e
 * produto existente (res.locals.product). Falta só o corpo (400).
 */
export const productController = {
  /** GET /api/v1/products (qualquer logado). */
  index: (async (_req, res) => {
    const products = await productService.list();

    res.status(200).json(products.map(presentProduct));
  }) satisfies RequestHandler,

  /** POST /api/v1/products (só ADM). */
  store: (async (req, res) => {
    const data = parseBody(req, productRequest);
    const product = await productService.create(data, res.locals.auth);

    res.status(201).json(presentProduct(product));
  }) satisfies RequestHandler,

  /** GET /api/v1/products/{id} (qualquer logado): consulta de estoque. */
  show: ((_req, res) => {
    res.status(200).json(presentProduct(res.locals.product));
  }) satisfies RequestHandler,

  /** PUT /api/v1/products/{id} (só ADM): exige nome, descricao e quantidade juntos. */
  replace: (async (req, res) => {
    const data = parseBody(req, productRequest);
    const product = await productService.update(res.locals.product.id, data, res.locals.auth);

    res.status(200).json(presentProduct(product));
  }) satisfies RequestHandler,

  /** PATCH /api/v1/products/{id} (só ADM): só o que for enviado muda. */
  update: (async (req, res) => {
    const data = parseBody(req, productPatchRequest);
    const product = await productService.update(res.locals.product.id, data, res.locals.auth);

    res.status(200).json(presentProduct(product));
  }) satisfies RequestHandler,

  /** DELETE /api/v1/products/{id} (só ADM). */
  destroy: (async (_req, res) => {
    await productService.delete(res.locals.product, res.locals.auth);

    res.status(204).end();
  }) satisfies RequestHandler,
};
