import type { Product } from '@prisma/client';

/** Schema ProductResponse do YAML. */
export type ProductResponse = {
  id: number;
  nome: string;
  descricao: string;
  quantidade: number;
};

/** Mapeia as colunas do banco (name, description, quantity) para os nomes do protocolo. */
export function presentProduct(product: Product): ProductResponse {
  return {
    id: product.id,
    nome: product.name,
    descricao: product.description,
    quantidade: product.quantity,
  };
}
