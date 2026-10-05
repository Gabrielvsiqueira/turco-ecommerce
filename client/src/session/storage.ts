import { DEFAULT_SERVER_URL } from '../api/server-url';
import type { SessionResponse } from '../api/types';

/**
 * O que o cliente guarda no navegador. Servidor e sessão ficam juntos porque
 * o token só vale no servidor que o emitiu.
 */
export type StoredState = {
  serverUrl: string;
  session: SessionResponse | null;
};

const KEY = 'ecommerce.client';

export function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      return {
        serverUrl: typeof parsed.serverUrl === 'string' ? parsed.serverUrl : DEFAULT_SERVER_URL,
        session: parsed.session ?? null,
      };
    }
  } catch {
    // localStorage indisponível ou conteúdo corrompido: começa do zero.
  }
  return { serverUrl: DEFAULT_SERVER_URL, session: null };
}

export function saveState(state: StoredState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sem localStorage (ex.: aba anônima bloqueada): segue só em memória.
  }
}
