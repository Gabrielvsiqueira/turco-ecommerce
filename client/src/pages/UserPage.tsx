import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/client';
import type { SessionResponse, UserPatchRequest, UserResponse } from '../api/types';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { isAdmin } from '../session/roles';
import { useSession } from '../session/session-context';
import {
  hasErrors,
  validateEmail,
  validateNome,
  validateSenha,
  type FieldErrors,
} from '../validation';

type Fields = 'nome' | 'email' | 'senha';
type Feedback = { kind: 'error' | 'success'; message: string };

/**
 * /perfil: o próprio usuário logado.
 * RequireAuth já barra quem não tem sessão; o "null" cobre o instante entre
 * encerrar a sessão e a navegação para o login.
 */
export function ProfilePage() {
  const { session } = useSession();
  return session ? <UserEditor session={session} userId={session.usuario.id} /> : null;
}

/**
 * /usuarios/:id: o ADM vendo ou editando qualquer usuário (fica dentro de
 * RequireAdmin). Se o id for o do próprio ADM, vai para /perfil, que é a
 * mesma tela com as ações de "minha conta" (como Sair).
 */
export function AdminUserPage() {
  const { session } = useSession();
  const { id } = useParams();
  const userId = Number(id);

  if (!session) {
    return null;
  }
  if (userId === session.usuario.id) {
    return <Navigate to="/perfil" replace />;
  }
  if (!Number.isSafeInteger(userId)) {
    return <NotFound message="O endereço não tem um id de usuário válido." />;
  }
  // key: trocar de usuário na URL recria o formulário do zero.
  return <UserEditor key={userId} session={session} userId={userId} />;
}

/**
 * Uma tela para dois casos:
 * - own (o próprio usuário): GET/PATCH/DELETE no próprio id, botão Sair;
 *   excluir encerra a sessão local.
 * - ADM em outra conta: mesmos GET/PATCH/DELETE, mas sem Sair (sessão é só do
 *   dono) e excluir volta para a lista de usuários, com o ADM ainda logado.
 *
 * Um 401 em qualquer chamada já encerra a sessão local e volta pro login (ver createApi).
 */
function UserEditor({ session, userId }: { session: SessionResponse; userId: number }) {
  const { api, updateUser, endSession } = useSession();
  const navigate = useNavigate();
  const own = userId === session.usuario.id;

  // No próprio perfil já dá para mostrar os dados do login enquanto o GET não volta.
  const [user, setUser] = useState<UserResponse | null>(own ? session.usuario : null);
  const [notFound, setNotFound] = useState(false);
  const [nome, setNome] = useState(user?.nome ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [feedback, setFeedback] = useState<Feedback>();
  const [busy, setBusy] = useState(false);
  // O formulário só libera depois do GET: senão a resposta chegaria no meio
  // da digitação e sobrescreveria o que o usuário escreveu.
  const [loaded, setLoaded] = useState(false);

  /** Guarda o usuário retornado pelo servidor e, se for o logado, atualiza a sessão. */
  function apply(fresh: UserResponse) {
    setUser(fresh);
    setNome(fresh.nome);
    setEmail(fresh.email);
    setSenha('');
    if (own) {
      updateUser(fresh);
    }
  }

  // Busca os dados atuais no servidor (podem ter mudado em outra sessão,
  // inclusive o papel: um ADM rebaixado perde o menu de administração aqui).
  useEffect(() => {
    let active = true;
    api
      .getUser(userId)
      .then((fresh) => {
        if (active) {
          apply(fresh);
          setLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (!active || !(error instanceof ApiError) || error.status === 401) {
          return;
        }
        if (error.status === 404 && !own) {
          setNotFound(true);
          return;
        }
        // No próprio perfil, segue com os dados guardados no login.
        setFeedback({ kind: 'error', message: error.message });
        setLoaded(own);
      });
    return () => {
      active = false;
    };
    // Só ao abrir a página ou trocar de usuário/servidor.
  }, [api, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (notFound) {
    return <NotFound message="Este usuário não existe (pode ter sido excluído)." />;
  }

  /** PATCH só com o que mudou; senha vazia = manter a atual. */
  function changes(current: UserResponse): UserPatchRequest {
    const body: UserPatchRequest = {};
    if (nome.trim() !== current.nome) body.nome = nome.trim();
    if (email !== current.email) body.email = email;
    if (senha !== '') body.senha = senha;
    return body;
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      return;
    }
    setFeedback(undefined);

    const body = changes(user);
    const found: FieldErrors<Fields> = {
      nome: body.nome !== undefined ? validateNome(body.nome) : undefined,
      email: body.email !== undefined ? validateEmail(body.email) : undefined,
      senha: body.senha !== undefined ? validateSenha(body.senha) : undefined,
    };
    setErrors(found);
    if (hasErrors(found)) {
      return;
    }
    if (Object.keys(body).length === 0) {
      setFeedback({ kind: 'error', message: 'Nada foi alterado.' });
      return;
    }

    setBusy(true);
    try {
      apply(await api.updateUser(userId, body));
      setFeedback({ kind: 'success', message: 'Dados atualizados.' });
    } catch (error) {
      if (error instanceof ApiError && error.status !== 401) {
        setFeedback({ kind: 'error', message: error.message });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await api.logout(session.id);
    } catch {
      // Mesmo se o servidor falhar, a sessão local é descartada.
    }
    endSession('Você saiu da sua conta.');
  }

  async function handleDelete() {
    // O YAML deixa a confirmação por conta do cliente.
    const confirmed = window.confirm(
      own
        ? 'Excluir sua conta? Todas as suas sessões serão encerradas e isso não pode ser desfeito.'
        : `Excluir a conta de ${user?.nome ?? 'este usuário'}? Todas as sessões dele serão encerradas e isso não pode ser desfeito.`,
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setFeedback(undefined);
    try {
      await api.deleteUser(userId);
      if (own) {
        endSession('Conta excluída.');
      } else {
        navigate('/usuarios', { state: { message: `Conta de ${user?.nome ?? 'usuário'} excluída.` } });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status !== 401) {
        setFeedback({ kind: 'error', message: error.message });
      }
      setBusy(false);
    }
  }

  return (
    <section className="card">
      {!own && (
        <p className="back">
          <Link to="/usuarios">← Usuários</Link>
        </p>
      )}

      <div className="card-header">
        <div>
          <h1>
            {own ? `Olá, ${user?.nome ?? ''}` : (user?.nome ?? 'Carregando…')}
            {user?.admin === true && <span className="badge badge-inline">ADM</span>}
          </h1>
          <p className="muted">
            {user?.email}
            {!own && user && ` · id ${user.id}`}
          </p>
        </div>
        {own && (
          <button type="button" className="button-secondary" onClick={handleLogout} disabled={busy}>
            Sair
          </button>
        )}
      </div>

      {feedback && <Alert kind={feedback.kind}>{feedback.message}</Alert>}

      <form onSubmit={handleSave} noValidate>
        <h2>{own ? 'Meus dados' : 'Dados do usuário'}</h2>
        <fieldset disabled={!loaded || busy}>
          <Field
            label="Nome"
            autoComplete={own ? 'name' : 'off'}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            error={errors.nome}
          />
          <Field
            label="E-mail"
            type="email"
            autoComplete={own ? 'email' : 'off'}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <Field
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            error={errors.senha}
            hint="Deixe em branco para manter a atual."
          />
          <button type="submit" className="button-primary">
            {loaded ? 'Salvar alterações' : 'Carregando…'}
          </button>
        </fieldset>
      </form>

      {!own && isAdmin(session) && (
        <p className="muted footnote">
          O papel (ADM ou comum) não muda pela API: é definido no servidor.
        </p>
      )}

      <div className="danger-zone">
        <h2>Excluir conta</h2>
        <p className="muted">
          {own
            ? 'Remove sua conta e encerra todas as suas sessões.'
            : 'Remove a conta deste usuário e encerra todas as sessões dele.'}
        </p>
        <button type="button" className="button-danger" onClick={handleDelete} disabled={busy || !loaded}>
          {own ? 'Excluir minha conta' : 'Excluir esta conta'}
        </button>
      </div>
    </section>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <section className="card">
      <p className="back">
        <Link to="/usuarios">← Usuários</Link>
      </p>
      <h1>Usuário não encontrado</h1>
      <p className="muted">{message}</p>
    </section>
  );
}
