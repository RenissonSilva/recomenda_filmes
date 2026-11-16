/** Formato padrão das respostas de erro da API do app (compartilhado entre servidor e cliente). */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const { error } = value as { error: unknown };
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as Record<string, unknown>).message === 'string' &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/** Erro lançado no cliente quando a API responde com status de falha. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
