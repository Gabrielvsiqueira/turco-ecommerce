import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError, createApi } from '../api/client';
import { normalizeServerUrl } from '../api/server-url';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { ServerUrlField } from '../components/ServerUrlField';
import { useSession } from '../session/session-context';
import {
  hasErrors,
  validateEmail,
  validateNome,
  validateSenha,
  type FieldErrors,
} from '../validation';

type Fields = 'server' | 'nome' | 'email' | 'senha' | 'confirmacao';

export function RegisterPage() {
  const { serverUrl, changeServer } = useSession();
  const navigate = useNavigate();

  const [server, setServer] = useState(serverUrl);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [failure, setFailure] = useState<{ message: string; emailTaken: boolean }>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFailure(undefined);

    const normalized = normalizeServerUrl(server);
    const found: FieldErrors<Fields> = {
      server: normalized ? undefined : 'Informe um endereço válido, ex.: http://192.168.0.10:8080',
      nome: validateNome(nome),
      email: validateEmail(email),
      senha: validateSenha(senha),
      confirmacao: confirmacao === senha ? undefined : 'As senhas não conferem.',
    };
    setErrors(found);
    if (hasErrors(found) || !normalized) {
      return;
    }

    setSubmitting(true);
    try {
      await createApi({ serverUrl: normalized }).createUser({ nome, email, senha });
      changeServer(normalized);
      navigate('/login', {
        state: { message: 'Conta criada! Entre com seu e-mail e senha.', email },
      });
    } catch (error) {
      setFailure({
        message: error instanceof ApiError ? error.message : 'Erro inesperado.',
        emailTaken: error instanceof ApiError && error.status === 409,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h1>Criar conta</h1>

      {failure && (
        <Alert kind="error">
          {failure.message}
          {/* O YAML pede: em 409, orientar o usuário a fazer login. */}
          {failure.emailTaken && (
            <>
              {' '}
              <Link to="/login" state={{ email }}>
                Entrar com este e-mail
              </Link>
            </>
          )}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <ServerUrlField value={server} onChange={setServer} error={errors.server} />
        <Field
          label="Nome"
          autoComplete="name"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          error={errors.nome}
          hint="Entre 3 e 50 caracteres."
        />
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          hint="Até 30 caracteres."
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          error={errors.senha}
          hint="De 6 a 20 caracteres, só letras e números."
        />
        <Field
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(event) => setConfirmacao(event.target.value)}
          error={errors.confirmacao}
        />
        <button type="submit" className="button-primary" disabled={submitting}>
          {submitting ? 'Criando…' : 'Criar conta'}
        </button>
      </form>

      <p className="footnote">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </section>
  );
}
