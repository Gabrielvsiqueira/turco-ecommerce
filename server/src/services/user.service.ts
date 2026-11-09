import { Prisma, type User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../database/prisma.js';
import type { AuthContext } from '../data/session-data.js';
import type { UserData, UserPatchData } from '../data/user-data.js';
import { ConflictError } from '../errors/api-errors.js';
import { activityLog, type Who } from '../logging/activity-log.js';

const BCRYPT_ROUNDS = 10;
const EMAIL_EM_USO = 'E-mail já cadastrado.';

/**
 * Regras de negócio de usuário (cadastro, listagem, e-mail único, exclusão).
 *
 * O papel ADM nunca é alterado aqui: nenhum método recebe ou grava isAdmin
 * (o campo "admin" do corpo já é descartado na validação, regra 7).
 * Quem pode mexer em quem é decidido antes, nos middlewares da rota.
 */
export const userService = {
  findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  /** GET /users (só ADM): todos, por id crescente, sem paginação (regra 16). */
  list(): Promise<User[]> {
    return prisma.user.findMany({ orderBy: { id: 'asc' } });
  },

  /** Cadastro público: sempre cria usuário comum (isAdmin tem default false). */
  async create(data: UserData): Promise<User> {
    const email = data.email.toLowerCase();
    await ensureEmailAvailable(email);

    const user = await withUniqueEmail(async () =>
      prisma.user.create({
        data: {
          name: data.nome,
          email,
          password: await bcrypt.hash(data.senha, BCRYPT_ROUNDS),
        },
      }),
    );

    await activityLog.registered(user);
    return user;
  },

  /** Serve para PUT (todos os campos) e PATCH (só os enviados). actor = dono do token. */
  async update(id: number, data: UserPatchData, actor: AuthContext): Promise<User> {
    const email = data.email?.toLowerCase();
    if (email !== undefined) {
      // O próprio e-mail atual não conta como duplicado.
      await ensureEmailAvailable(email, id);
    }

    const user = await withUniqueEmail(async () =>
      prisma.user.update({
        where: { id },
        data: {
          name: data.nome,
          email,
          password: data.senha === undefined ? undefined : await bcrypt.hash(data.senha, BCRYPT_ROUNDS),
        },
      }),
    );

    const fields = (['nome', 'email', 'senha'] as const).filter((field) => data[field] !== undefined);
    await activityLog.userUpdated(whoIs(actor), user, fields);
    return user;
  },

  /** Exclui o usuário e derruba todas as sessões dele da whitelist. actor = dono do token. */
  async delete(user: User, actor: AuthContext): Promise<void> {
    const [closed] = await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    await activityLog.userDeleted(whoIs(actor), user, closed.count);
  },
};

function whoIs(auth: AuthContext): Who {
  return { id: auth.userId, name: auth.name, email: auth.email, isAdmin: auth.isAdmin };
}

/** Regra 8: e-mails são salvos em minúsculo, então a comparação já ignora caixa. */
async function ensureEmailAvailable(email: string, ignoreUserId?: number): Promise<void> {
  const owner = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (owner !== null && owner.id !== ignoreUserId) {
    throw new ConflictError(EMAIL_EM_USO);
  }
}

/**
 * Duas requisições simultâneas com o mesmo e-mail podem passar pela checagem
 * acima ao mesmo tempo; o @unique do banco barra a segunda e aqui ela vira 409.
 */
async function withUniqueEmail<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError(EMAIL_EM_USO);
    }
    throw error;
  }
}
