import type { User } from '@prisma/client';

/** Entrada do login, já validada. */
export type LoginData = {
  email: string;
  senha: string;
};

/**
 * Resultado de um login bem-sucedido.
 * O token em texto puro só existe neste momento: no banco fica apenas o hash.
 */
export type CreatedSession = {
  id: string;
  token: string;
  user: User;
};

/** Quem está autenticado na requisição atual (preenchido pelo middleware de auth). */
export type AuthContext = {
  sessionId: string;
  userId: number;
};
