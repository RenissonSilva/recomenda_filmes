import 'server-only';

export type AppErrorCode =
  | 'TMDB_NOT_CONFIGURED'
  | 'TMDB_REQUEST_FAILED'
  | 'SERVER_NOT_CONFIGURED'
  | 'UNAUTHORIZED'
  | 'INVALID_REQUEST'
  | 'INTERNAL_ERROR';

/** Erro de aplicação com código e status HTTP — convertido em resposta JSON pelas rotas da API. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: AppErrorCode,
    readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class TmdbNotConfiguredError extends AppError {
  constructor() {
    super(
      'A API do TMDB não está configurada. Defina TMDB_API_READ_TOKEN (ou TMDB_API_KEY) no arquivo .env e reinicie o servidor.',
      'TMDB_NOT_CONFIGURED',
      500,
    );
  }
}

export class TmdbRequestError extends AppError {
  constructor(
    /** Status devolvido pelo TMDB (0 = falha de rede/timeout). */
    readonly upstreamStatus: number,
    /** Endpoint consultado — útil nos logs, não é exibido ao usuário. */
    readonly path: string,
    options?: ErrorOptions,
  ) {
    super(
      'Não foi possível consultar o catálogo de filmes agora. Tente novamente em instantes.',
      'TMDB_REQUEST_FAILED',
      502,
      options,
    );
  }

  get isNotFound(): boolean {
    return this.upstreamStatus === 404;
  }
}

/** Variável de ambiente obrigatória ausente (ex.: banco de dados ou segredo da autenticação). */
export class MissingEnvError extends AppError {
  constructor(
    /** Nome da variável — aparece só nos logs. */
    readonly variable: string,
  ) {
    super(
      'O servidor não está configurado para esta função. Tente novamente mais tarde.',
      'SERVER_NOT_CONFIGURED',
      500,
    );
  }
}

/** A requisição exige uma sessão válida (usuário logado). */
export class UnauthorizedError extends AppError {
  constructor() {
    super('Sua sessão expirou. Entre na sua conta novamente.', 'UNAUTHORIZED', 401);
  }
}
