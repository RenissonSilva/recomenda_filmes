import 'server-only';

import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';

import type { ApiErrorBody } from '@/lib/http/api-error';

import { AppError } from '../errors';

type RouteHandler<Args extends unknown[]> = (...args: Args) => Promise<Response>;

/**
 * Envolve um Route Handler convertendo exceções em respostas JSON padronizadas
 * (`ApiErrorBody`), para que o cliente sempre receba uma mensagem amigável.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: RouteHandler<Args>,
): RouteHandler<Args> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Erros internos do Next.js (ex.: interrupção de pré-renderização) não devem ser capturados.
      unstable_rethrow(error);
      return errorResponse(error);
    }
  };
}

function errorResponse(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return jsonError(
      400,
      'INVALID_REQUEST',
      'Requisição inválida. Verifique os parâmetros enviados.',
    );
  }

  if (error instanceof AppError) {
    if (error.status >= 500) console.error(error);
    return jsonError(error.status, error.code, error.message);
  }

  console.error(error);
  return jsonError(500, 'INTERNAL_ERROR', 'Ocorreu um erro inesperado. Tente novamente.');
}

function jsonError(status: number, code: string, message: string): Response {
  const body: ApiErrorBody = { error: { code, message } };
  return Response.json(body, { status });
}

/** Converte a query string em objeto para validação com Zod. */
export function searchParamsToObject(searchParams: URLSearchParams): Record<string, string> {
  return Object.fromEntries(searchParams.entries());
}

/** Lê o corpo JSON da requisição; JSON malformado vira erro 400 (e não 500). */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    throw new AppError('O corpo da requisição não é um JSON válido.', 'INVALID_REQUEST', 400, {
      cause: error,
    });
  }
}
