import { prisma } from '../database/prisma.js';

/**
 * Log de atividade de sessões no terminal do servidor: quem entrou, quem
 * saiu e quem continua logado. Útil no dia da integração para ver quais
 * colegas estão usando o servidor.
 *
 * Nunca derruba a requisição: se o log falhar, só avisa no console.
 */

type Who = { id: number; name: string; email: string };

export const activityLog = {
  loggedIn: (user: Who, sessionId: string) =>
    write('ENTROU', `${describe(user)} · sessão ${sessionId}`),

  loggedOut: (user: Who, sessionId: string) =>
    write('SAIU', `${describe(user)} · sessão ${sessionId}`),

  accountDeleted: (user: Who, closedSessions: number) =>
    write('EXCLUIU A CONTA', `${describe(user)} · ${plural(closedSessions, 'sessão encerrada', 'sessões encerradas')}`),
};

async function write(event: string, detail: string): Promise<void> {
  try {
    console.log(`[${timestamp()}] ${event.padEnd(15)} ${detail}`);
    console.log(`${' '.repeat(22)}↳ logados agora: ${await whoIsOnline()}`);
  } catch (error) {
    console.error('Falha ao registrar atividade de sessão:', error);
  }
}

/** Usuários com pelo menos uma sessão ativa, com quantas sessões cada um tem. */
async function whoIsOnline(): Promise<string> {
  const users = await prisma.user.findMany({
    where: { sessions: { some: {} } },
    select: { name: true, email: true, _count: { select: { sessions: true } } },
    orderBy: { name: 'asc' },
  });

  if (users.length === 0) {
    return 'ninguém';
  }

  const list = users
    .map((u) => `${u.name} <${u.email}>${u._count.sessions > 1 ? ` (${u._count.sessions} sessões)` : ''}`)
    .join(', ');
  return `${users.length} · ${list}`;
}

function describe(user: Who): string {
  return `${user.name} <${user.email}> (id ${user.id})`;
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/** Hora local, legível: 2026-10-03 20:15:02 */
function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
