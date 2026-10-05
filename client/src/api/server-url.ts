/**
 * Endereço do servidor escolhido pelo usuário em runtime.
 *
 * O usuário digita só "ip:porta" (ou uma URL completa). O prefixo /api/v1 é
 * fixo no protocolo (regra 1), então o cliente acrescenta sozinho.
 */
export const DEFAULT_SERVER_URL = 'http://localhost:8080';

const API_PREFIX = '/api/v1';

/**
 * Normaliza o que foi digitado: põe http:// se faltar e tira barras e um
 * "/api/v1" digitado no fim. Devolve null se não for um endereço válido.
 *
 *   "192.168.0.10:8080"                 -> "http://192.168.0.10:8080"
 *   "http://localhost:8080/api/v1/"     -> "http://localhost:8080"
 */
export function normalizeServerUrl(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }

  let path = url.pathname.replace(/\/+$/, '');
  if (path.endsWith(API_PREFIX)) {
    path = path.slice(0, -API_PREFIX.length);
  }

  return `${url.origin}${path}`;
}

export function apiBaseUrl(serverUrl: string): string {
  return `${serverUrl}${API_PREFIX}`;
}
