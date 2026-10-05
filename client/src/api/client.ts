import createClient from 'openapi-fetch';
import type { paths } from './schema';
import { apiBaseUrl } from './server-url';
import type { LoginRequest, UserPatchRequest, UserRequest } from './types';

/**
 * Erro de uma chamada à API, já com uma mensagem pronta para mostrar.
 * status 0 = nem chegou resposta (servidor fora do ar, endereço errado, CORS).
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Options = {
  serverUrl: string;
  token?: string;
  /** Chamado em qualquer 401 de rota autenticada: a sessão não vale mais. */
  onUnauthorized?: () => void;
};

/**
 * Cliente da API do protocolo. Os caminhos, corpos e respostas são checados
 * pelo TypeScript contra os tipos gerados do YAML.
 */
export function createApi({ serverUrl, token, onUnauthorized }: Options) {
  const client = createClient<paths>({
    baseUrl: apiBaseUrl(serverUrl),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  /** Chamadas que exigem token: 401 encerra a sessão local. */
  async function authed<T>(request: Promise<Result<T>>): Promise<T> {
    try {
      return await call(request);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized?.();
      }
      throw error;
    }
  }

  return {
    login: (body: LoginRequest) => call(client.POST('/sessions', { body })),

    logout: (sessionId: string) =>
      authed(client.DELETE('/sessions/{id}', { params: { path: { id: sessionId } } })),

    createUser: (body: UserRequest) => call(client.POST('/users', { body })),

    getUser: (id: number) => authed(client.GET('/users/{id}', { params: { path: { id } } })),

    updateUser: (id: number, body: UserPatchRequest) =>
      authed(client.PATCH('/users/{id}', { params: { path: { id } }, body })),

    deleteUser: (id: number) =>
      authed(client.DELETE('/users/{id}', { params: { path: { id } } })),
  };
}

export type Api = ReturnType<typeof createApi>;

type Result<T> = { data?: T; error?: unknown; response: Response };

/** Converte o resultado do openapi-fetch em "dados ou ApiError". */
async function call<T>(request: Promise<Result<T>>): Promise<T> {
  let result: Result<T>;
  try {
    result = await request;
  } catch {
    throw new ApiError(
      0,
      'Não foi possível conectar ao servidor. Confira o endereço e se ele está no ar.',
    );
  }

  if (result.response.ok) {
    return result.data as T;
  }

  throw new ApiError(result.response.status, errorMessage(result.error, result.response.status));
}

/**
 * Regra 6: o erro deveria vir como {"mensagem": "..."}. Como o cliente pode
 * falar com o servidor de qualquer colega, se vier fora do formato usa uma
 * mensagem padrão pelo status.
 */
function errorMessage(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null && 'mensagem' in body) {
    const { mensagem } = body as { mensagem: unknown };
    if (typeof mensagem === 'string' && mensagem.trim() !== '') {
      return mensagem;
    }
  }

  const fallback: Record<number, string> = {
    400: 'Dados inválidos.',
    401: 'Não autorizado.',
    403: 'Acesso negado.',
    404: 'Não encontrado.',
    409: 'Conflito com dados existentes.',
  };
  return fallback[status] ?? `Erro inesperado do servidor (HTTP ${status}).`;
}
