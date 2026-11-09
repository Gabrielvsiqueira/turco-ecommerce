import '../env.js';
import { prisma } from '../database/prisma.js';

/**
 * npm run make-admin -- email@exemplo.com
 *
 * Promove a ADM um usuário que já existe (cadastrado pelo cliente, por exemplo).
 * Criar ADM fica fora do protocolo: nenhuma rota da API faz isso.
 */
async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase(); // Regra 8.

  if (!email) {
    console.error('Informe o e-mail do usuário: npm run make-admin -- email@exemplo.com');
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user === null) {
    console.error(`Nenhum usuário cadastrado com o e-mail ${email}.`);
    process.exitCode = 1;
    return;
  }

  if (user.isAdmin) {
    console.log(`${user.name} <${user.email}> (id ${user.id}) já é ADM. Nada a fazer.`);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
  console.log(`${user.name} <${user.email}> (id ${user.id}) agora é ADM.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
