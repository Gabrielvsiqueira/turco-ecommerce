/**
 * Validação no cliente, espelhando os schemas Email, Senha e Nome do YAML.
 *
 * Serve só para dar retorno rápido no formulário: quem decide é o servidor,
 * e o cliente sempre mostra a mensagem que ele devolver.
 * Cada função devolve a mensagem de erro, ou undefined se estiver ok.
 */

export function validateEmail(value: string): string | undefined {
  if (value.length < 5 || value.length > 30) {
    return 'O e-mail deve ter entre 5 e 30 caracteres.';
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    return 'Informe um e-mail válido, com "@" e domínio.';
  }
}

export function validateSenha(value: string): string | undefined {
  if (value.length < 6 || value.length > 20) {
    return 'A senha deve ter entre 6 e 20 caracteres.';
  }
  if (!/^[a-zA-Z0-9]+$/.test(value)) {
    return 'A senha deve ter apenas letras e números.';
  }
}

/** O servidor faz trim antes de validar (regra 9); aqui também. */
export function validateNome(value: string): string | undefined {
  const length = value.trim().length;
  if (length < 3 || length > 50) {
    return 'O nome deve ter entre 3 e 50 caracteres.';
  }
}

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function hasErrors(errors: FieldErrors<string>): boolean {
  return Object.values(errors).some((message) => message !== undefined);
}
