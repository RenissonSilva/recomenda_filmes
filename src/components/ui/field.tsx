import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

/** Atributos que ligam o campo ao rótulo, à dica e à mensagem de erro (acessibilidade). */
export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean | undefined;
  'aria-describedby': string | undefined;
}

interface FieldProps {
  label: string;
  /** Texto de apoio exibido abaixo do campo (oculto enquanto houver erro). */
  hint?: ReactNode;
  error?: string;
  /** Conteúdo extra ao lado do rótulo (ex.: link "Esqueci minha senha"). */
  labelAside?: ReactNode;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Rótulo + campo + dica/erro. O campo é renderizado por `children`, que recebe os
 * atributos de acessibilidade: `<Field label="E-mail">{(control) => <Input {...control} />}</Field>`.
 */
export function Field({ label, hint, error, labelAside, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {labelAside}
      </div>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': message ? messageId : undefined,
      })}
      {message && (
        <p id={messageId} className={cn('text-sm', error ? 'text-red-300' : 'text-fg-subtle')}>
          {message}
        </p>
      )}
    </div>
  );
}
