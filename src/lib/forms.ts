import { z } from 'zod';

/** Primeira mensagem de erro de cada campo do formulário. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type FormParseResult<T> =
  { success: true; data: T } | { success: false; errors: FieldErrors<T> };

/**
 * Valida os campos de um `<form>` com um schema Zod. Em caso de erro, devolve a primeira
 * mensagem de cada campo, pronta para exibir ao lado dele.
 */
export function parseForm<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  form: HTMLFormElement,
): FormParseResult<T> {
  const result = schema.safeParse(Object.fromEntries(new FormData(form)));
  if (result.success) return { success: true, data: result.data };

  const { fieldErrors } = z.flattenError(result.error) as { fieldErrors: Record<string, string[]> };
  const errors: FieldErrors<T> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages[0]) errors[field as keyof T] = messages[0];
  }
  return { success: false, errors };
}
