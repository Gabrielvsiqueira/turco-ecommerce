import { Outlet } from 'react-router';
import { useSession } from '../session/session-context';

/** Moldura comum: cabeçalho com o servidor atual e o conteúdo da página. */
export function Layout() {
  const { serverUrl, session } = useSession();

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">E-commerce</span>
        <span className="server" title="Servidor atual">
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
