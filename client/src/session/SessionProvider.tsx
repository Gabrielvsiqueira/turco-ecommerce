import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createApi } from '../api/client';
import type { SessionResponse, UserResponse } from '../api/types';
import { SessionContext, type SessionContextValue } from './session-context';
import { loadState, saveState, type StoredState } from './storage';

/**
 * Guarda o servidor escolhido e a sessão atual, e mantém os dois salvos no
 * localStorage.
 *
 * endSession não navega: o react-router 7 aplica navegações como transition
 * (prioridade baixa), então a sessão sumiria antes e o RequireAuth
 * redirecionaria sem o aviso. Por isso o aviso fica aqui e o RequireAuth o leva.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(loadState);
  const [notice, setNotice] = useState<string>();

  useEffect(() => saveState(state), [state]);

  const endSession = useCallback((message?: string) => {
    setNotice(message);
    setState((current) => ({ ...current, session: null }));
  }, []);

  const changeServer = useCallback((serverUrl: string) => {
    setState((current) =>
      current.serverUrl === serverUrl
        ? current
        : // O token pertence ao servidor que o emitiu: trocou, descarta.
          { serverUrl, session: null },
    );
  }, []);

  const startSession = useCallback((session: SessionResponse) => {
    setNotice(undefined);
    setState((current) => ({ ...current, session }));
  }, []);

  const updateUser = useCallback((usuario: UserResponse) => {
    setState((current) =>
      current.session ? { ...current, session: { ...current.session, usuario } } : current,
    );
  }, []);

  const api = useMemo(
    () =>
      createApi({
        serverUrl: state.serverUrl,
        token: state.session?.token,
        onUnauthorized: () => endSession('Sua sessão expirou ou foi encerrada. Entre novamente.'),
      }),
    [state.serverUrl, state.session?.token, endSession],
  );

  const value: SessionContextValue = {
    serverUrl: state.serverUrl,
    session: state.session,
    notice,
    api,
    changeServer,
    startSession,
    updateUser,
    endSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
