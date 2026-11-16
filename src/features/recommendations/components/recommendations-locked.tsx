import { Lock, Star } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { MIN_RATINGS_FOR_RECOMMENDATIONS } from '@/domain/recommendation';
import { pluralize } from '@/lib/format';
import { routes } from '@/lib/routes';

import type { RecommendationProgress } from '../snapshot';

/** Exibido enquanto o usuário não tem avaliações suficientes. */
export function RecommendationsLocked({ progress }: { progress: RecommendationProgress }) {
  const remaining = Math.max(0, MIN_RATINGS_FOR_RECOMMENDATIONS - progress.ratingCount);

  const description =
    remaining > 0
      ? `Avalie mais ${pluralize(remaining, 'título', 'títulos')} que você já assistiu para descobrirmos o seu gosto.`
      : 'Avalie como Bom ou Ótimo pelo menos um título que você curtiu — é a partir deles que encontramos as recomendações.';

  return (
    <EmptyState
      icon={<Lock aria-hidden />}
      title="Suas recomendações ainda estão bloqueadas"
      description={
        <div className="flex flex-col items-center gap-3">
          <p>{description}</p>
          <ProgressBar
            value={progress.ratingCount}
            max={MIN_RATINGS_FOR_RECOMMENDATIONS}
            label="Progresso para liberar as recomendações"
            className="max-w-xs"
          />
          <p className="text-xs text-fg-subtle tabular-nums">
            {Math.min(progress.ratingCount, MIN_RATINGS_FOR_RECOMMENDATIONS)} de{' '}
            {MIN_RATINGS_FOR_RECOMMENDATIONS} avaliações
          </p>
        </div>
      }
      action={
        <ButtonLink href={routes.rate}>
          <Star aria-hidden />
          Avaliar títulos
        </ButtonLink>
      }
    />
  );
}
