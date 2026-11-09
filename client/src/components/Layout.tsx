import { NavLink, Outlet } from 'react-router';
import { isAdmin } from '../session/roles';
import { useSession } from '../session/session-context';

/**
 * Moldura comum: cabeçalho com o servidor atual, o menu (conforme o papel)
 * e o conteúdo da página.
 */
export function Layout() {
  const { serverUrl, session } = useSession();
  const admin = isAdmin(session);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-start">
          <span className="brand">E-commerce</span>
          {session && (
            <nav className="nav" aria-label="Menu principal">
              <NavLink to="/perfil" end>
                Meu perfil
              </NavLink>
              {admin && <NavLink to="/usuarios">Usuários</NavLink>}
            </nav>
          )}
        </div>
        <span className="server" title="Servidor atual">
          {admin && <span className="badge">ADM</span>}
          <span className={session ? 'dot dot-on' : 'dot'} aria-hidden="true" />
          {serverUrl}
        </span>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
