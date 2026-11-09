import '../env.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../database/prisma.js';
import { email, nome, senha } from '../http/validation/rules.js';

/**
 * npm run db:seed
 *
 * Garante que existe um ADM com os dados do .env (ADMIN_NOME, ADMIN_EMAIL,
 * ADMIN_SENHA). Criar ADM fica fora do protocolo (README, "Papéis de usuário"):
 * nenhuma rota da API faz isso, só este script e o make-admin.
 *
 * - E-mail ainda não cadastrado: cria o usuário já como ADM.
 * - E-mail já cadastrado: só promove a ADM. Nome e senha atuais NÃO mudam.
 *
 * Os dados passam pelas mesmas regras da API (Email, Senha, Nome), senão o ADM
 * criado aqui não conseguiria logar por um cliente que siga o protocolo.
 */
const adminEnv = z.object({
  ADMIN_NOME: nome.default('Administrador'),
  ADMIN_EMAIL: email,
  ADMIN_SENHA: senha,
});

async function main(): Promise<void> {
  const parsed = adminEnv.safeParse(process.env);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    console.error(
      `Configuração do ADM inválida (${issue?.path.join('.')}): ${issue?.message}\n` +
        'Defina ADMIN_EMAIL e ADMIN_SENHA (e, opcionalmente, ADMIN_NOME) no .env. Veja o .env.example.',
    );
    process.exitCode = 1;
    return;
  }

  const { ADMIN_NOME, ADMIN_EMAIL, ADMIN_SENHA } = parsed.data;
  const adminEmail = ADMIN_EMAIL.toLowerCase(); // Regra 8.

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing === null) {
    const user = await prisma.user.create({
      data: {
        name: ADMIN_NOME,
        email: adminEmail,
        password: await bcrypt.hash(ADMIN_SENHA, 10),
        isAdmin: true,
      },
    });
    console.log(`ADM criado: ${user.name} <${user.email}> (id ${user.id}).`);
    return;
  }

  if (existing.isAdmin) {
    console.log(`${existing.name} <${existing.email}> (id ${existing.id}) já é ADM. Nada a fazer.`);
    return;
  }

  await prisma.user.update({ where: { id: existing.id }, data: { isAdmin: true } });
  console.log(
    `${existing.name} <${existing.email}> (id ${existing.id}) já existia e foi promovido a ADM ` +
      '(nome e senha mantidos).',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
