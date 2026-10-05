import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ApiError, createApi } from '../api/client';
import { normalizeServerUrl } from '../api/server-url';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { ServerUrlField } from '../components/ServerUrlField';
import { useSession } from '../session/session-context';
import { hasErrors, validateEmail, validateSenha, type FieldErrors } from '../validation';

/** Aviso e e-mail vindos de outra tela (ex.: cadastro concluído, sessão expirada). */
type LocationState = { message?: string; email?: string } | null;

export function LoginPage() {
  const { serverUrl, changeServer, startSession } = useSession();
  const navigate = useNavigate();
  const incoming = useLocation().state as LocationState;

  const [server, setServer] = useState(serverUrl);
  const [email, setEmail] = useState(incoming?.email ?? '');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState<FieldErrors<'server' | 'email' | 'senha'>>({});
  const [failure, setFailure] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFailure(undefined);

    const normalized = normalizeServerUrl(server);
    const found = {
      server: normalized ? undefined : 'Informe um endereço válido, ex.: http://192.168.0.10:8080',
      email: validateEmail(email),
      senha: validateSenha(senha),
    };
    setErrors(found);
    if (hasErrors(found) || !normalized) {
      return;
    }

    setSubmitting(true);
    try {
      // Usa o servidor digitado agora, mesmo que ainda não seja o salvo.
      const session = await createApi({ serverUrl: normalized }).login({ email, senha });
      changeServer(normalized);
      startSession(session);
      navigate('/perfil', { replace: true });
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h1>Entrar</h1>

      {incoming?.message && !failure && <Alert kind="info">{incoming.message}</Alert>}
      {failure && <Alert kind="error">{failure}</Alert>}

      <form onSubmit={handleSubmit} noValidate>
        <ServerUrlField value={server} onChange={setServer} error={errors.server} />
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          error={errors.senha}
        />
        <button type="submit" className="button-primary" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="footnote">
        Não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>
    </section>
  );
}
