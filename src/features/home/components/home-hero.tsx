import { Sparkles } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';

import { HomeCallToAction } from './home-call-to-action';

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Brilhos decorativos de fundo */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute top-40 -left-24 size-72 rounded-full bg-rating-love/15 blur-3xl" />
        <div className="absolute top-24 -right-24 size-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
        <Badge variant="brand" className="px-3 py-1 text-sm">
          <Sparkles aria-hidden />
          Recomendações personalizadas
        </Badge>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Descubra o que assistir com base no <span className="text-brand">seu</span> gosto
        </h1>
        <p className="max-w-xl text-lg text-pretty text-fg-muted">
          Avalie filmes, séries e animes que você já viu. A gente aprende o que você curte e mostra
          sugestões com a porcentagem de compatibilidade com o seu perfil.
        </p>
        <HomeCallToAction />
      </Container>
    </section>
  );
}
