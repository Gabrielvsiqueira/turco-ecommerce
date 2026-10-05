import type { User } from '@prisma/client';
import type { AuthContext } from '../data/session-data.js';

/**
 * Dados que os middlewares deixam em res.locals para os próximos da cadeia.
 * Cada campo só existe depois que o middleware indicado rodou.
 */
declare global {
  namespace Express {
    interface Locals {
      /** Preenchido por `authenticate`. */
      auth: AuthContext;
      /** Preenchido por `validateUserId`: o id da URL já convertido. */
      targetUserId: number;
      /** Preenchido por `loadUser`. */
      user: User;
    }
  }
}

export {};
