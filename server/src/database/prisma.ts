import { PrismaClient } from '@prisma/client';

/** Uma única conexão com o banco para a aplicação inteira. */
export const prisma = new PrismaClient();
