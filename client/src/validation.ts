/**
 * Validação no cliente, espelhando os schemas Email, Senha, Nome, NomeProduto,
 * Descricao e Quantidade do YAML.
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

/** NomeProduto: 2 a 100 caracteres, com trim (regra 9). */
export function validateNomeProduto(value: string): string | undefined {
  const length = value.trim().length;
  if (length < 2 || length > 100) {
    return 'O nome deve ter entre 2 e 100 caracteres.';
  }
}

/** Descricao: até 500 caracteres, com trim (regra 9). Pode ficar vazia. */
export function validateDescricao(value: string): string | undefined {
  if (value.trim().length > 500) {
    return 'A descrição deve ter no máximo 500 caracteres.';
  }
}

export const QUANTIDADE_MAXIMA = 1_000_000;

/**
 * Quantidade: o campo do formulário é texto; só vira número (inteiro de 0 a
 * 1.000.000) se estiver certo. Devolve o número ou a mensagem de erro.
 */
export function parseQuantidade(value: string): { value: number } | { error: string } {
  const text = value.trim();
  if (text === '') {
    return { error: 'Informe a quantidade em estoque.' };
  }
  if (!/^\d+$/.test(text)) {
    return { error: 'A quantidade deve ser um número inteiro, sem sinal nem vírgula.' };
  }
  const number = Number(text);
  if (number > QUANTIDADE_MAXIMA) {
    return { error: 'A quantidade deve ser no máximo 1.000.000.' };
  }
  return { value: number };
}

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function hasErrors(errors: FieldErrors<string>): boolean {
  return Object.values(errors).some((message) => message !== undefined);
}
