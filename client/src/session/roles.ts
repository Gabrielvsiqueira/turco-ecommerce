import type { SessionResponse } from '../api/types';

/**
 * O usuário logado é ADM?
 *
 * Compara com true em vez de confiar no tipo: sessões salvas antes do
 * protocolo 1.4.0, ou servidores de colegas que ainda não mandam o campo,
 * chegam sem "admin", e isso vale como usuário comum.
 *
 * Isto só decide o que a tela mostra. Quem garante a permissão é o servidor
 * (403), então esconder um botão não é segurança.
 */
export function isAdmin(session: SessionResponse | null): boolean {
  return session?.usuario.admin === true;
}
