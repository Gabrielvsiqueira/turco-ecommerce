import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ApiError } from '../api/client';
import type { UserResponse } from '../api/types';
import { Alert } from '../components/Alert';
import { useSession } from '../session/session-context';

/**
 * /usuarios (só ADM): GET /users. Cada linha leva para /usuarios/:id, a mesma
 * tela de perfil com as ações do ADM.
 */
export function UsersPage() {
  const { api, session } = useSession();
  const location = useLocation();
  // Aviso vindo de outra tela (ex.: "Conta de Maria excluída.").
  const notice = (location.state as { message?: string } | null)?.message;

  const [users, setUsers] = useState<UserResponse[]>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    api
      .listUsers()
      .then((list) => active && setUsers(list))
      .catch((err: unknown) => {
        // 401 já encerra a sessão (createApi). 403 = deixou de ser ADM no servidor.
        if (active && err instanceof ApiError && err.status !== 401) {
          setError(err.message);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(load, [load]);

  return (
    <section className="card card-wide">
      <div className="card-header">
        <div>
          <h1>Usuários</h1>
          <p className="muted">
            {users ? `${users.length} cadastrado${users.length === 1 ? '' : 's'}` : 'Todos os usuários do servidor'}
          </p>
        </div>
        <button type="button" className="button-secondary" onClick={load} disabled={loading}>
          {loading ? 'Carregando…' : 'Atualizar'}
        </button>
      </div>

      {notice && <Alert kind="success">{notice}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      {users && users.length === 0 && <p className="muted">Nenhum usuário cadastrado.</p>}

      {users && users.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Id</th>
                <th scope="col">Nome</th>
                <th scope="col">E-mail</th>
                <th scope="col">Papel</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const me = user.id === session?.usuario.id;
                return (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <Link to={me ? '/perfil' : `/usuarios/${user.id}`}>{user.nome}</Link>
                      {me && <span className="muted"> (você)</span>}
                    </td>
                    <td className="cell-email">{user.email}</td>
                    <td>{user.admin === true ? <span className="badge">ADM</span> : 'Comum'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
