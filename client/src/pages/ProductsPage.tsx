import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ApiError } from '../api/client';
import type { ProductResponse } from '../api/types';
import { Alert } from '../components/Alert';
import { isAdmin } from '../session/roles';
import { useSession } from '../session/session-context';
import { Stock } from './ProductPage';

/**
 * /produtos: GET /products, liberado para qualquer usuário logado.
 * O ADM vê também o botão de cadastrar; cada linha leva para /produtos/:id
 * (consulta para o usuário comum, edição para o ADM).
 */
export function ProductsPage() {
  const { api, session } = useSession();
  const admin = isAdmin(session);
  const location = useLocation();
  // Aviso vindo de outra tela (ex.: "Produto removido.").
  const notice = (location.state as { message?: string } | null)?.message;

  const [products, setProducts] = useState<ProductResponse[]>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    api
      .listProducts()
      .then((list) => active && setProducts(list))
      .catch((err: unknown) => {
        // 401 já encerra a sessão (createApi).
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
          <h1>Produtos</h1>
          <p className="muted">
            {products
              ? `${products.length} cadastrado${products.length === 1 ? '' : 's'}`
              : 'Produtos e estoque do servidor'}
          </p>
        </div>
        <div className="actions">
          <button type="button" className="button-secondary" onClick={load} disabled={loading}>
            {loading ? 'Carregando…' : 'Atualizar'}
          </button>
          {admin && (
            <Link to="/produtos/novo" className="button-link button-primary">
              Novo produto
            </Link>
          )}
        </div>
      </div>

      {notice && <Alert kind="success">{notice}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      {products && products.length === 0 && (
        <p className="muted">
          Nenhum produto cadastrado{admin ? '. Use "Novo produto" para cadastrar o primeiro.' : '.'}
        </p>
      )}

      {products && products.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Id</th>
                <th scope="col">Nome</th>
                <th scope="col">Descrição</th>
                <th scope="col">Estoque</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>
                    <Link to={`/produtos/${product.id}`}>{product.nome}</Link>
                  </td>
                  <td className="cell-description muted">{summary(product.descricao)}</td>
                  <td>
                    <Stock quantidade={product.quantidade} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Na tabela, só o começo da descrição. */
function summary(descricao: string): string {
  if (descricao === '') return '—';
  return descricao.length > 80 ? `${descricao.slice(0, 79)}…` : descricao;
}
