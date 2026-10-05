import { createContext, useContext } from 'react';
import type { Api } from '../api/client';
import type { SessionResponse, UserResponse } from '../api/types';

export type SessionContextValue = {
  serverUrl: string;
  session: SessionResponse | null;
  /** Por que a última sessão terminou (mostrado no login). Só em memória. */
  notice?: string;
  /** Cliente da API já apontado pro servidor atual e com o token da sessão. */
  api: Api;
  /** Troca de servidor. Se mudou, descarta a sessão local. */
  changeServer: (serverUrl: string) => void;
  /** Guarda a sessão recebida em POST /sessions. */
  startSession: (session: SessionResponse) => void;
  /** Atualiza os dados do usuário guardados (após PATCH). */
  updateUser: (usuario: UserResponse) => void;
  /**
   * Esquece a sessão local, com um aviso opcional. Quem leva pro login é o
   * RequireAuth, que percebe a falta de sessão e repassa o aviso.
   */
  endSession: (message?: string) => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession precisa estar dentro de <SessionProvider>.');
  }
  return value;
}
