import { z } from 'zod';
import { descricao, email, nome, nomeProduto, quantidade, senha } from './rules.js';

/*
 * Schemas dos corpos de requisição do YAML.
 * z.object descarta campos desconhecidos (regra 7).
 */

/** LoginRequest (POST /sessions). */
export const loginRequest = z.object({ email, senha });

/** UserRequest (POST /users e PUT /users/{id}): os três campos obrigatórios. */
export const userRequest = z.object({ nome, email, senha });

/** UserPatchRequest (PATCH /users/{id}): pelo menos um de nome, email ou senha. */
export const userPatchRequest = z
  .object({
    nome: nome.optional(),
    email: email.optional(),
    senha: senha.optional(),
  })
  .refine(
    (body) => body.nome !== undefined || body.email !== undefined || body.senha !== undefined,
    'Informe pelo menos um campo: nome, email ou senha.',
  );

/** ProductRequest (POST /products e PUT /products/{id}): os três campos obrigatórios. */
export const productRequest = z.object({ nome: nomeProduto, descricao, quantidade });

/** ProductPatchRequest (PATCH /products/{id}): pelo menos um de nome, descricao ou quantidade. */
export const productPatchRequest = z
  .object({
    nome: nomeProduto.optional(),
    descricao: descricao.optional(),
    quantidade: quantidade.optional(),
  })
  .refine(
    (body) => body.nome !== undefined || body.descricao !== undefined || body.quantidade !== undefined,
    'Informe pelo menos um campo: nome, descricao ou quantidade.',
  );
