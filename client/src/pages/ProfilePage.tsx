import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import type { SessionResponse, UserPatchRequest, UserResponse } from '../api/types';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
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
 * Perfil do usuário logado: ver (GET), editar (PATCH), sair (DELETE /sessions)
 * e excluir a conta (DELETE /users). Um 401 em qualquer chamada já encerra a
 * sessão local e volta pro login (ver createApi).
 */
export function ProfilePage() {
  const { session } = useSession();
  // RequireAuth já barra quem não tem sessão; isto cobre o instante entre
  // encerrar a sessão e a navegação para o login.
  return session ? <Profile session={session} /> : null;
}

function Profile({ session }: { session: SessionResponse }) {
  const { api, updateUser, endSession } = useSession();
  const { id: sessionId, usuario } = session;

  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [feedback, setFeedback] = useState<Feedback>();
  const [busy, setBusy] = useState(false);
  // O formulário só libera depois do GET: senão a resposta chegaria no meio
  // da digitação e sobrescreveria o que o usuário escreveu.
  const [loaded, setLoaded] = useState(false);

  function fillForm(user: UserResponse) {
    setNome(user.nome);
    setEmail(user.email);
    setSenha('');
  }

  // Busca os dados atuais no servidor (podem ter mudado em outra sessão).
  useEffect(() => {
    let active = true;
    api
      .getUser(usuario.id)
      .then((user) => {
        if (active) {
          updateUser(user);
          fillForm(user);
          setLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (active && error instanceof ApiError && error.status !== 401) {
          // Segue com os dados guardados no login.
          setFeedback({ kind: 'error', message: error.message });
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
    // Só ao abrir a página ou trocar de usuário/servidor.
  }, [api, usuario.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** PATCH só com o que mudou; senha vazia = manter a atual. */
  function changes(): UserPatchRequest {
    const body: UserPatchRequest = {};
    if (nome.trim() !== usuario.nome) body.nome = nome.trim();
    if (email !== usuario.email) body.email = email;
    if (senha !== '') body.senha = senha;
    return body;
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setFeedback(undefined);

    const body = changes();
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
      const user = await api.updateUser(usuario.id, body);
      updateUser(user);
      fillForm(user);
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
      await api.logout(sessionId);
    } catch {
      // Mesmo se o servidor falhar, a sessão local é descartada.
    }
    endSession('Você saiu da sua conta.');
  }

  async function handleDelete() {
    // O YAML deixa a confirmação por conta do cliente.
    const confirmed = window.confirm(
      'Excluir sua conta? Todas as suas sessões serão encerradas e isso não pode ser desfeito.',
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setFeedback(undefined);
    try {
      await api.deleteUser(usuario.id);
      endSession('Conta excluída.');
    } catch (error) {
      if (error instanceof ApiError && error.status !== 401) {
        setFeedback({ kind: 'error', message: error.message });
      }
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h1>Olá, {usuario.nome}</h1>
          <p className="muted">{usuario.email}</p>
        </div>
        <button type="button" className="button-secondary" onClick={handleLogout} disabled={busy}>
          Sair
        </button>
      </div>

      {feedback && <Alert kind={feedback.kind}>{feedback.message}</Alert>}

      <form onSubmit={handleSave} noValidate>
        <h2>Meus dados</h2>
        <fieldset disabled={!loaded || busy}>
          <Field
            label="Nome"
            autoComplete="name"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            error={errors.nome}
          />
          <Field
            label="E-mail"
            type="email"
            autoComplete="email"
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

      <div className="danger-zone">
        <h2>Excluir conta</h2>
        <p className="muted">Remove sua conta e encerra todas as suas sessões.</p>
        <button type="button" className="button-danger" onClick={handleDelete} disabled={busy}>
          Excluir minha conta
        </button>
      </div>
    </section>
  );
}
