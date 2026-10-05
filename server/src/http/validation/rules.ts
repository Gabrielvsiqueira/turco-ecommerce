import { z } from 'zod';

/**
 * Schemas compartilhados do YAML (components/schemas: Email, Senha, Nome).
 *
 * Ficam num lugar só porque são reaproveitados em várias rotas
 * (login, cadastro, PUT, PATCH). Se o protocolo mudar, muda aqui.
 */

/**
 * Regra 13: o campo precisa ser string JSON. Número, booleano e null dão 400,
 * e nada é convertido.
 */
function texto(campo: string) {
  return z.string({
    error: (issue) =>
      issue.input === undefined
        ? `O campo ${campo} é obrigatório.`
        : `O campo ${campo} deve ser um texto.`,
  });
}

/** Email: 5 a 30 caracteres, com "@" e domínio. */
export const email = texto('email')
  .min(5, 'O campo email deve ter no mínimo 5 caracteres.')
  .max(30, 'O campo email deve ter no máximo 30 caracteres.')
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'O campo email está em um formato inválido.');

/** Senha: 6 a 20 caracteres, só letras e números. Sem trim (regra 13). */
export const senha = texto('senha')
  .min(6, 'O campo senha deve ter no mínimo 6 caracteres.')
  .max(20, 'O campo senha deve ter no máximo 20 caracteres.')
  .regex(/^[a-zA-Z0-9]+$/, 'O campo senha deve conter apenas letras e números.');

/** Nome: trim antes de validar e salvar (regra 9), depois 3 a 50 caracteres. */
export const nome = texto('nome')
  .trim()
  .min(3, 'O campo nome deve ter no mínimo 3 caracteres.')
  .max(50, 'O campo nome deve ter no máximo 50 caracteres.');
