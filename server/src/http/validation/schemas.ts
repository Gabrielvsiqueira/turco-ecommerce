import { z } from 'zod';
import { email, nome, senha } from './rules.js';

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
