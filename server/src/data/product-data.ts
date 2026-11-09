/** Entrada de POST /products e PUT /products/{id}, já validada (nome e descricao já com trim). */
export type ProductData = {
  nome: string;
  descricao: string;
  quantidade: number;
};

/** Entrada de PATCH /products/{id}: só o que foi enviado muda. */
export type ProductPatchData = Partial<ProductData>;
