/**
 * Erros de domínio da API.
 *
 * Services e middlewares só lançam estes erros. Quem os transforma em resposta
 * HTTP ({"mensagem": ...}) é o error handler, num único lugar.
 */
export abstract class ApiError extends Error {
  abstract readonly status: number;
}

/** 400: corpo malformado, restrição de dado violada ou id da URL inválido. */
export class BadRequestError extends ApiError {
  readonly status = 400;
}

/** 401: token ausente, inválido ou de uma sessão já encerrada. */
export class UnauthorizedError extends ApiError {
  readonly status = 401;

  constructor(message = 'Token ausente ou inválido.') {
    super(message);
  }
}

/**
 * 401 no login. A mensagem é genérica de propósito: o protocolo pede para não
 * revelar se o problema foi o e-mail ou a senha.
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('E-mail ou senha inválidos.');
  }
}

/** 403: o recurso da URL não pertence ao dono do token. */
export class ForbiddenError extends ApiError {
  readonly status = 403;
}

/** 404: recurso ou rota inexistente (regra 15). */
export class NotFoundError extends ApiError {
  readonly status = 404;
}

/** 405: rota existe, mas não com esse método (regra 15). */
export class MethodNotAllowedError extends ApiError {
  readonly status = 405;

  constructor(readonly allowed: string[]) {
    super('Método não permitido nesta rota.');
  }
}

/** 409: e-mail já cadastrado. */
export class ConflictError extends ApiError {
  readonly status = 409;
}
