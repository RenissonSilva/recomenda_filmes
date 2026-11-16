import { siteConfig } from '@/config/site';

import { Container } from './container';

/** Rodapé com a atribuição exigida pelos termos de uso da API do TMDB. */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line/60 pb-24 md:pb-0">
      <Container className="flex flex-col gap-2 py-8 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
        <p>{siteConfig.name} — recomendações de filmes, séries e animes a partir do seu gosto.</p>
        <p>
          Dados e imagens fornecidos pelo{' '}
          <a
            href={siteConfig.tmdbUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded font-medium text-fg-muted underline-offset-2 focus-ring hover:underline"
          >
            TMDB
          </a>
          . Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
        </p>
      </Container>
    </footer>
  );
}
