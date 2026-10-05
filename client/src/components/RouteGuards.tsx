import { Navigate, Outlet } from 'react-router';
import { useSession } from '../session/session-context';

/**
 * Só entra quem tem sessão; os outros vão pro login, levando o motivo do fim
 * da sessão (ex.: "Você saiu", "Sua sessão expirou"), se houver.
 */
export function RequireAuth() {
  const { session, notice } = useSession();
  if (session) {
    return <Outlet />;
  }
  return <Navigate to="/login" replace state={notice ? { message: notice } : undefined} />;
}

/** Login e cadastro não fazem sentido com sessão ativa. */
export function RequireGuest() {
  const { session } = useSession();
  return session ? <Navigate to="/perfil" replace /> : <Outlet />;
}
