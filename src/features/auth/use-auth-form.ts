'use client';

import { useState, type FormEvent } from 'react';
import type { z } from 'zod';

import { parseForm, type FieldErrors } from '@/lib/forms';

/** Resultado do envio: `error` é exibido acima do botão; sem erro, o formulário segue "enviando". */
type SubmitResult = { error?: string } | void;

/**
 * Estado comum dos formulários de autenticação: valida os campos com Zod, chama `submit`
 * e controla o envio e as mensagens de erro (por campo e geral).
 */
export function useAuthForm<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  submit: (values: T) => Promise<SubmitResult>,
) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<T>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const parsed = parseForm(schema, event.currentTarget);
    setFieldErrors(parsed.success ? {} : parsed.errors);
    setFormError(null);
    if (!parsed.success) return;

    setPending(true);
    let result: SubmitResult;
    try {
      result = await submit(parsed.data);
    } catch {
      result = { error: 'Não foi possível conectar. Verifique sua internet e tente novamente.' };
    }
    if (result?.error) {
      setFormError(result.error);
      setPending(false);
    }
  };

  return {
    fieldErrors,
    formError,
    pending,
    onSubmit: (event: FormEvent<HTMLFormElement>) => void handleSubmit(event),
  };
}
