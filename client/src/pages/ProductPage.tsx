import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/client';
import type { ProductPatchRequest, ProductRequest, ProductResponse } from '../api/types';
import { Alert } from '../components/Alert';
import { Field, TextAreaField } from '../components/Field';
import { isAdmin } from '../session/roles';
import { useSession } from '../session/session-context';
import {
  hasErrors,
  parseQuantidade,
  QUANTIDADE_MAXIMA,
  validateDescricao,
  validateNomeProduto,
  type FieldErrors,
} from '../validation';

type Fields = 'nome' | 'descricao' | 'quantidade';
type Feedback = { kind: 'error' | 'success'; message: string };

/** Quantidade em estoque, com destaque quando acabou. */
export function Stock({ quantidade }: { quantidade: number }) {
  if (quantidade === 0) {
    return <span className="stock stock-out">Esgotado</span>;
  }
  return <span className="stock">{quantidade.toLocaleString('pt-BR')} un.</span>;
}

/** /produtos/novo (só ADM, dentro de RequireAdmin): POST /products. */
export function NewProductPage() {
  const { api } = useSession();
  const navigate = useNavigate();

  async function create(body: ProductRequest) {
    const product = await api.createProduct(body);
    navigate(`/produtos/${product.id}`, { state: { message: 'Produto cadastrado.' } });
  }

  return (
    <section className="card">
      <BackLink />
      <h1>Novo produto</h1>
      <ProductForm submitLabel="Cadastrar produto" onSubmit={create} />
    </section>
  );
}

/**
 * /produtos/:id: GET /products/{id} (consulta de estoque).
 * Usuário comum só vê; o ADM vê o mesmo formulário do cadastro para editar
 * (PATCH só com o que mudou) e pode remover o produto.
 */
export function ProductDetailsPage() {
  const { id } = useParams();
  const productId = Number(id);

  if (!/^\d+$/.test(id ?? '') || !Number.isSafeInteger(productId)) {
    return <NotFound message="O endereço não tem um id de produto válido." />;
  }
  // key: trocar de produto na URL recria a tela do zero.
  return <ProductDetails key={productId} productId={productId} />;
}

function ProductDetails({ productId }: { productId: number }) {
  const { api, session } = useSession();
  const admin = isAdmin(session);
  const navigate = useNavigate();
  // Aviso vindo do cadastro ("Produto cadastrado.").
  const notice = (useLocation().state as { message?: string } | null)?.message;

  const [product, setProduct] = useState<ProductResponse>();
  const [notFound, setNotFound] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | undefined>(
    notice ? { kind: 'success', message: notice } : undefined,
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  /** Muda a cada GET para o formulário do ADM recomeçar com os dados do servidor. */
  const [version, setVersion] = useState(0);

  function load() {
    let active = true;
    setLoading(true);
    api
      .getProduct(productId)
      .then((fresh) => {
        if (active) {
          setProduct(fresh);
          setVersion((v) => v + 1);
        }
      })
      .catch((error: unknown) => {
        if (!active || !(error instanceof ApiError) || error.status === 401) {
          return;
        }
        if (error.status === 404) {
          setNotFound(true);
          return;
        }
        setFeedback({ kind: 'error', message: error.message });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }

  // Só ao abrir a página ou trocar de produto/servidor.
  useEffect(load, [api, productId]);

  if (notFound) {
    return <NotFound message="Este produto não existe (pode ter sido removido)." />;
  }

  async function update(body: ProductRequest) {
    if (!product) return;
    const changes = changedFields(product, body);
    if (Object.keys(changes).length === 0) {
      throw new ApiError(400, 'Nada foi alterado.');
    }
    const fresh = await api.updateProduct(productId, changes);
    setProduct(fresh);
    setVersion((v) => v + 1);
    setFeedback({ kind: 'success', message: 'Produto atualizado.' });
  }

  async function handleDelete() {
    // O YAML deixa a confirmação por conta do cliente.
    if (!window.confirm(`Remover o produto "${product?.nome ?? ''}"? Isso não pode ser desfeito.`)) {
      return;
    }
    setBusy(true);
    setFeedback(undefined);
    try {
      await api.deleteProduct(productId);
      navigate('/produtos', { state: { message: `Produto "${product?.nome ?? ''}" removido.` } });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setNotFound(true);
      } else if (error instanceof ApiError && error.status !== 401) {
        setFeedback({ kind: 'error', message: error.message });
      }
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <BackLink />

      <div className="card-header">
        <div>
          <h1>{product?.nome ?? 'Carregando…'}</h1>
          {product && <p className="muted">id {product.id}</p>}
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={() => {
            setFeedback(undefined);
            load();
          }}
          disabled={loading || busy}
        >
          {loading ? 'Carregando…' : 'Atualizar'}
        </button>
      </div>

      {feedback && <Alert kind={feedback.kind}>{feedback.message}</Alert>}

      {product && (
        <>
          <h2>Estoque</h2>
          <p className="stock-big">
            <Stock quantidade={product.quantidade} />
          </p>

          {!admin && (
            <>
              <h2>Descrição</h2>
              <p className="product-description">
                {product.descricao === '' ? <span className="muted">Sem descrição.</span> : product.descricao}
              </p>
            </>
          )}
        </>
      )}

      {admin && product && (
        <>
          <h2>Editar produto</h2>
          <ProductForm
            key={version}
            initial={product}
            submitLabel="Salvar alterações"
            disabled={busy}
            onSubmit={update}
            onStart={() => setFeedback(undefined)}
          />

          <div className="danger-zone">
            <h2>Remover produto</h2>
            <p className="muted">Apaga o produto do servidor.</p>
            <button type="button" className="button-danger" onClick={handleDelete} disabled={busy}>
              Remover produto
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Formulário de produto (cadastro e edição). Valida no cliente para dar
 * retorno rápido, mas a palavra final é do servidor: um erro da API aparece
 * aqui com a mensagem que ele devolveu.
 */
function ProductForm({
  initial,
  submitLabel,
  disabled = false,
  onSubmit,
  onStart,
}: {
  initial?: ProductResponse;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (body: ProductRequest) => Promise<void>;
  onStart?: () => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [descricao, setDescricao] = useState(initial?.descricao ?? '');
  const [quantidade, setQuantidade] = useState(initial ? String(initial.quantidade) : '');
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    onStart?.();

    const parsed = parseQuantidade(quantidade);
    const found: FieldErrors<Fields> = {
      nome: validateNomeProduto(nome),
      descricao: validateDescricao(descricao),
      quantidade: 'error' in parsed ? parsed.error : undefined,
    };
    setErrors(found);
    if (hasErrors(found) || 'error' in parsed) {
      return;
    }

    setBusy(true);
    try {
      // Trim também no cliente (regra 9), para comparar com o que está salvo.
      await onSubmit({ nome: nome.trim(), descricao: descricao.trim(), quantidade: parsed.value });
    } catch (err) {
      // 401 já encerra a sessão (createApi). 403 = deixou de ser ADM no servidor.
      if (err instanceof ApiError && err.status !== 401) {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert kind="error">{error}</Alert>}
      <fieldset disabled={disabled || busy}>
        <Field
          label="Nome"
          autoComplete="off"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          error={errors.nome}
          hint="Entre 2 e 100 caracteres. Nomes repetidos são permitidos."
        />
        <TextAreaField
          label="Descrição"
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          error={errors.descricao}
          hint="Opcional, até 500 caracteres."
        />
        <Field
          label="Quantidade em estoque"
          type="number"
          inputMode="numeric"
          min={0}
          max={QUANTIDADE_MAXIMA}
          step={1}
          value={quantidade}
          onChange={(event) => setQuantidade(event.target.value)}
          error={errors.quantidade}
          hint="Número inteiro de 0 a 1.000.000."
        />
        <button type="submit" className="button-primary">
          {busy ? 'Salvando…' : submitLabel}
        </button>
      </fieldset>
    </form>
  );
}

/** PATCH só com o que mudou em relação ao que o servidor devolveu. */
function changedFields(current: ProductResponse, next: ProductRequest): ProductPatchRequest {
  const body: ProductPatchRequest = {};
  if (next.nome !== current.nome) body.nome = next.nome;
  if (next.descricao !== current.descricao) body.descricao = next.descricao;
  if (next.quantidade !== current.quantidade) body.quantidade = next.quantidade;
  return body;
}

function BackLink() {
  return (
    <p className="back">
      <Link to="/produtos">← Produtos</Link>
    </p>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <section className="card">
      <BackLink />
      <h1>Produto não encontrado</h1>
      <p className="muted">{message}</p>
    </section>
  );
}
