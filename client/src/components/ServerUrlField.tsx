import { Field } from './Field';

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

/**
 * Endereço do servidor, escolhido em runtime (decisão do projeto: qualquer
 * cliente precisa falar com o servidor de qualquer colega).
 */
export function ServerUrlField({ value, onChange, error }: Props) {
  return (
    <Field
      label="Servidor"
      name="servidor"
      inputMode="url"
      autoComplete="url"
      spellCheck={false}
      placeholder="http://192.168.0.10:8080"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      hint="IP e porta do servidor. O /api/v1 é adicionado automaticamente."
    />
  );
}
