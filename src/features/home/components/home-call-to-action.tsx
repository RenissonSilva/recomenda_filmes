'use client';

import { ArrowRight, Sparkles, Star } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button';
import { MIN_RATINGS_FOR_RECOMMENDATIONS } from '@/domain/recommendation';
import { useLibraryCounts, useLibraryHydrated } from '@/features/library/hooks';
import { routes } from '@/lib/routes';

/** Botões principais da home, adaptados ao progresso do usuário. */
export function HomeCallToAction() {
  const hydrated = useLibraryHydrated();
  const { ratings } = useLibraryCounts();

  if (hydrated && ratings >= MIN_RATINGS_FOR_RECOMMENDATIONS) {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href={routes.recommendations} size="lg">
          <Sparkles aria-hidden />
          Ver minhas recomendações
        </ButtonLink>
        <ButtonLink href={routes.rate} size="lg" variant="outline">
          Avaliar mais títulos
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <ButtonLink href={routes.rate} size="lg">
        <Star aria-hidden />
        {hydrated && ratings > 0 ? 'Continuar avaliando' : 'Começar a avaliar'}
        <ArrowRight aria-hidden />
      </ButtonLink>
      <p className="text-sm text-fg-subtle">
        {hydrated && ratings > 0
          ? `${ratings} de ${MIN_RATINGS_FOR_RECOMMENDATIONS} avaliações para liberar suas recomendações`
          : 'Sem cadastro — leva menos de um minuto.'}
      </p>
    </div>
  );
}
