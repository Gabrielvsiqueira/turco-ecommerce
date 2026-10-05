import type { User } from '@prisma/client';

/** Schema UserResponse do YAML. */
export type UserResponse = {
  id: number;
  nome: string;
  email: string;
};

/**
 * Desacopla o banco do protocolo: a coluna se chama "name", o protocolo expõe
 * "nome". E a senha nunca sai (regra 11): nunca devolver o model direto.
 */
export function presentUser(user: User): UserResponse {
  return { id: user.id, nome: user.name, email: user.email };
}
