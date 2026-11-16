'use client';

import { ArrowRight, Sparkles } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { MIN_RATINGS_FOR_RECOMMENDATIONS } from '@/domain/recommendation';
import { useLibraryCounts, useLibraryHydrated } from '@/features/library/hooks';
import { pluralize } from '@/lib/format';
import { routes } from '@/lib/routes';

/** Barra fixa no rodapé da tela "Avaliar" mostrando quanto falta para liberar as recomendações. */
export function RatingProgress() {
  const hydrated = useLibraryHydrated();
  const { ratings } = useLibraryCounts();

  if (!hydrated) return null;

  const remaining = MIN_RATINGS_FOR_RECOMMENDATIONS - ratings;
  const unlocked = remaining <= 0;

  return (
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-xl md:bottom-6">
      <div
        aria-live="polite"
        className="flex items-center gap-4 rounded-2xl border border-line bg-surface/95 p-4 shadow-2xl shadow-black/50 backdrop-blur"
      >
        <Sparkles aria-hidden className="size-5 shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {unlocked
              ? `${pluralize(ratings, 'avaliação', 'avaliações')} — suas recomendações estão prontas!`
              : `Avalie mais ${pluralize(remaining, 'título', 'títulos')} para liberar suas recomendações`}
          </p>
          {!unlocked && (
            <ProgressBar
              value={ratings}
              max={MIN_RATINGS_FOR_RECOMMENDATIONS}
              label="Progresso para liberar as recomendações"
              className="mt-2"
            />
          )}
        </div>
        {unlocked && (
          <ButtonLink href={routes.recommendations} size="sm">
            Ver
            <ArrowRight aria-hidden />
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
