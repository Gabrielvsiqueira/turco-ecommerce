import type { Product } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import type { AuthContext } from '../data/session-data.js';
import type { ProductData, ProductPatchData } from '../data/product-data.js';
import { activityLog, type Who } from '../logging/activity-log.js';

/**
 * Regras de negócio de produto (cadastro, listagem, atualização, exclusão).
 *
 * Quem pode ler ou escrever é decidido antes, nos middlewares da rota
 * (leitura: qualquer logado; escrita: só ADM). Não há 409: nomes repetidos
 * são permitidos.
 */
export const productService = {
  findById(id: number): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  },

  /** GET /products: todos, por id crescente, sem paginação (regra 16). */
  list(): Promise<Product[]> {
    return prisma.product.findMany({ orderBy: { id: 'asc' } });
  },

  async create(data: ProductData, actor: AuthContext): Promise<Product> {
    const product = await prisma.product.create({
      data: { name: data.nome, description: data.descricao, quantity: data.quantidade },
    });

    await activityLog.productCreated(whoIs(actor), product);
    return product;
  },

  /** Serve para PUT (todos os campos) e PATCH (só os enviados). */
  async update(id: number, data: ProductPatchData, actor: AuthContext): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data: { name: data.nome, description: data.descricao, quantity: data.quantidade },
    });

    const fields = (['nome', 'descricao', 'quantidade'] as const).filter((field) => data[field] !== undefined);
    await activityLog.productUpdated(whoIs(actor), product, fields);
    return product;
  },

  async delete(product: Product, actor: AuthContext): Promise<void> {
    await prisma.product.delete({ where: { id: product.id } });

    await activityLog.productDeleted(whoIs(actor), product);
  },
};

function whoIs(auth: AuthContext): Who {
  return { id: auth.userId, name: auth.name, email: auth.email, isAdmin: auth.isAdmin };
}
