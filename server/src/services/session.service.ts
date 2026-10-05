import bcrypt from 'bcryptjs';
import { prisma } from '../database/prisma.js';
import { activityLog } from '../logging/activity-log.js';
import type { AuthContext, CreatedSession, LoginData } from '../data/session-data.js';
import { ForbiddenError, InvalidCredentialsError, NotFoundError } from '../errors/api-errors.js';
import { generateToken, hashToken } from './token.js';

/**
 * Regras de negócio de sessão (login/logout).
 * A tabela sessions é a "whitelist" de sessões ativas do protocolo.
 */
export const sessionService = {
  async create(data: LoginData): Promise<CreatedSession> {
    // Regra 8: e-mails são salvos em minúsculo, então basta normalizar a entrada.
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (user === null || !(await bcrypt.compare(data.senha, user.password))) {
      throw new InvalidCredentialsError();
    }

    // Regra 14: cada login cria uma sessão nova e independente.
    const token = generateToken();
    const session = await prisma.session.create({
      data: { tokenHash: hashToken(token), userId: user.id },
    });

    await activityLog.loggedIn(user, session.id);

    return { id: session.id, token, user };
  },

  /** Sessão ativa dona do token, ou null se o token não está na whitelist. */
  async findByToken(token: string): Promise<AuthContext | null> {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, userId: true },
    });

    return session && { sessionId: session.id, userId: session.userId };
  },

  /**
   * Logout. Ao contrário de /users/{id}, aqui não dá para saber o dono sem ir
   * ao banco (o id da sessão não diz de quem ela é), então 403 e 404 saem
   * da mesma consulta: sessão de outro usuário -> 403; inexistente -> 404.
   * O usuário pode encerrar qualquer sessão própria, não só a do token atual.
   */
  async delete(sessionId: string, auth: AuthContext): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true, user: { select: { id: true, name: true, email: true } } },
    });

    if (session === null) {
      throw new NotFoundError('Sessão não encontrada.');
    }
    if (session.userId !== auth.userId) {
      throw new ForbiddenError('Esta sessão não pertence ao usuário autenticado.');
    }

    await prisma.session.delete({ where: { id: sessionId } });
    await activityLog.loggedOut(session.user, sessionId);
  },
};
