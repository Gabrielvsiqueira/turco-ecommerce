import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

/** Campo de formulário com rótulo, dica e mensagem de erro acessíveis. */
export function Field({ label, error, hint, ...inputProps }: FieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {(a11y) => <input {...a11y} {...inputProps} />}
    </FieldShell>
  );
}

/** O mesmo que Field, para texto de várias linhas (ex.: descrição do produto). */
export function TextAreaField({ label, error, hint, ...textareaProps }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {(a11y) => <textarea rows={4} {...a11y} {...textareaProps} />}
    </FieldShell>
  );
}

type A11yProps = { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string };

function FieldShell({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (a11y: A11yProps) => ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="field-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
