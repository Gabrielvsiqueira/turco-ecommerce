import { config } from '../config.js';
import { prisma } from '../database/prisma.js';

/**
 * Painel do console do servidor: quem está logado agora e os últimos eventos
 * (login, logout, cadastro, alteração, exclusão, erros). Atende o requisito da
 * entrega 02 de o servidor mostrar a lista de logados sempre atualizada.
 *
 * Dois modos:
 * - painel (padrão, em terminal interativo): limpa a tela e redesenha o quadro
 *   a cada evento;
 * - linhas (PAINEL=off, ou saída redirecionada para arquivo): uma linha por
 *   evento seguida de "logados agora", e erros com stack completa.
 *
 * Nunca derruba a requisição: se o painel falhar, só avisa no console.
 */

/** Quem aparece nos eventos. Serve tanto para o model User quanto para quem fez a ação. */
export type Who = { id: number; name: string; email: string; isAdmin: boolean };

type Event = { at: Date; kind: string; detail: string };

const MAX_EVENTS = 15;
const WIDTH = 78;

const events: Event[] = [];
let listeningOn = '';
/** Fila: eventos simultâneos são desenhados um de cada vez, na ordem em que chegaram. */
let queue: Promise<void> = Promise.resolve();

const usePanel = () => config.panel && process.stdout.isTTY === true;

export const activityLog = {
  started: (url: string) => {
    listeningOn = url;
    if (usePanel()) {
      return record('INICIOU', `ouvindo em ${url}`);
    }
    console.log(`Servidor ouvindo em ${url}`);
    return Promise.resolve();
  },

  loggedIn: (user: Who, sessionId: string) =>
    record('ENTROU', `${describe(user)} · sessão ${shortId(sessionId)}`),

  loggedOut: (user: Who, sessionId: string) =>
    record('SAIU', `${describe(user)} · sessão ${shortId(sessionId)}`),

  registered: (user: Who) => record('CADASTROU', describe(user)),

  /** fields: nomes dos campos do protocolo que vieram no corpo (nunca os valores). */
  userUpdated: (actor: Who, target: Who, fields: string[]) =>
    record('ALTEROU', `${whoDidItTo(actor, target)} · ${fields.join(', ')}`),

  userDeleted: (actor: Who, target: Who, closedSessions: number) =>
    record(
      'EXCLUIU',
      `${whoDidItTo(actor, target)} · ${plural(closedSessions, 'sessão encerrada', 'sessões encerradas')}`,
    ),

  /** Erro inesperado (500). No modo painel, a stack completa só aparece com PAINEL=off. */
  failed: (error: unknown) => {
    if (!usePanel()) {
      console.error(error);
      return Promise.resolve();
    }
    const message = error instanceof Error ? error.message : String(error);
    return record('ERRO 500', `${firstLine(message)} (detalhes: PAINEL=off)`);
  },
};

function record(kind: string, detail: string): Promise<void> {
  const event = { at: new Date(), kind, detail };
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.shift();
  }

  queue = queue.then(() => (usePanel() ? drawPanel() : printLine(event))).catch((error) => {
    console.error('Falha ao atualizar o painel de atividade:', error);
  });
  return queue;
}

/** Usuários com pelo menos uma sessão ativa, com quantas sessões cada um tem. */
function whoIsOnline() {
  return prisma.user.findMany({
    where: { sessions: { some: {} } },
    select: { name: true, email: true, isAdmin: true, _count: { select: { sessions: true } } },
    orderBy: { name: 'asc' },
  });
}

async function drawPanel(): Promise<void> {
  const online = await whoIsOnline();
  const rule = (title: string, corner: string) =>
    `${corner}─ ${title} ${'─'.repeat(Math.max(0, WIDTH - title.length - 5))}${corner === '┌' ? '┐' : '┤'}`;
  const row = (text: string) => `│ ${fit(text, WIDTH - 4)} │`;

  const lines = [
    rule(`Servidor ${listeningOn}`, '┌'),
    row(`LOGADOS (${online.length})`),
    ...(online.length === 0
      ? [row('  ninguém')]
      : online.map((u) =>
          row(
            `  ${u.name} <${u.email}>${u.isAdmin ? ' (ADM)' : ''} · ` +
              plural(u._count.sessions, 'sessão', 'sessões'),
          ),
        )),
    rule('ÚLTIMOS EVENTOS', '├'),
    ...(events.length === 0
      ? [row('  nenhum ainda')]
      : events.map((e) => row(`${clock(e.at)} ${e.kind.padEnd(9)} ${e.detail}`))),
    `└${'─'.repeat(WIDTH - 2)}┘`,
    `  atualizado às ${clock(new Date())} · PAINEL=off no .env volta para o log em linhas`,
  ];

  // \x1b[2J limpa a tela, \x1b[3J limpa o histórico de rolagem, \x1b[H volta o cursor ao topo.
  process.stdout.write(`\x1b[2J\x1b[3J\x1b[H${lines.join('\n')}\n`);
}

async function printLine(event: Event): Promise<void> {
  const online = await whoIsOnline();
  const list =
    online.length === 0
      ? 'ninguém'
      : `${online.length} · ` +
        online
          .map(
            (u) =>
              `${u.name} <${u.email}>${u.isAdmin ? ' (ADM)' : ''}` +
              (u._count.sessions > 1 ? ` (${u._count.sessions} sessões)` : ''),
          )
          .join(', ');

  console.log(`[${date(event.at)} ${clock(event.at)}] ${event.kind.padEnd(9)} ${event.detail}`);
  console.log(`${' '.repeat(22)}↳ logados agora: ${list}`);
}

function describe(user: Who): string {
  return `${user.name} <${user.email}>${user.isAdmin ? ' (ADM)' : ''} (id ${user.id})`;
}

/** "Maria (id 3)" quando foi ela mesma; "Gabriel (ADM) → Maria (id 3)" quando foi o ADM. */
function whoDidItTo(actor: Who, target: Who): string {
  if (actor.id === target.id) {
    return `${describe(target)} (própria conta)`;
  }
  return `${actor.name}${actor.isAdmin ? ' (ADM)' : ''} → ${describe(target)}`;
}

function shortId(id: string): string {
  return `${id.slice(0, 8)}…`;
}

function fit(text: string, size: number): string {
  return text.length > size ? `${text.slice(0, size - 1)}…` : text.padEnd(size);
}

function firstLine(text: string): string {
  return text.split('\n')[0] ?? '';
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 2026-11-09 */
function date(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 20:15:02 */
function clock(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
