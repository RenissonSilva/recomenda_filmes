import { BrainCircuit, Sparkles, Star } from 'lucide-react';
import type { ReactNode } from 'react';

import { Container } from '@/components/layout/container';
import { RATING_OPTIONS, UNSEEN_LABEL } from '@/domain/rating';
import { MIN_RATINGS_FOR_RECOMMENDATIONS } from '@/domain/recommendation';
import { RATING_APPEARANCE } from '@/features/rating/rating-appearance';
import { cn } from '@/lib/cn';

function RatingScalePreview() {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Escala de avaliação">
      {RATING_OPTIONS.map((option) => {
        const { icon: Icon, accentClassName } = RATING_APPEARANCE[option.value];
        return (
          <li
            key={option.value}
            className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium"
          >
            <Icon aria-hidden className={cn('size-3.5', accentClassName)} />
            {option.label}
          </li>
        );
      })}
      <li className="flex items-center rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-fg-muted">
        {UNSEEN_LABEL}
      </li>
    </ul>
  );
}

interface Step {
  icon: ReactNode;
  title: string;
  description: string;
  extra?: ReactNode;
}

const STEPS: Step[] = [
  {
    icon: <Star aria-hidden />,
    title: 'Avalie o que você já viu',
    description: `Dê sua nota para pelo menos ${MIN_RATINGS_FOR_RECOMMENDATIONS} títulos. Não assistiu? Marque “${UNSEEN_LABEL}” e siga em frente.`,
    extra: <RatingScalePreview />,
  },
  {
    icon: <BrainCircuit aria-hidden />,
    title: 'A gente aprende o seu gosto',
    description:
      'Gêneros, temas, direção e elenco do que você curte — e do que você não curte — formam o seu perfil.',
  },
  {
    icon: <Sparkles aria-hidden />,
    title: 'Receba recomendações',
    description:
      'Cada sugestão vem com a % de compatibilidade e o porquê. Guarde as melhores na lista “Quero ver”.',
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="py-12">
      <Container>
        <h2
          id="how-it-works-heading"
          className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Como funciona
        </h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand/15 text-brand [&_svg]:size-5">
                  {step.icon}
                </span>
                <span className="text-sm font-semibold text-fg-subtle">Passo {index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-pretty text-fg-muted">{step.description}</p>
              {step.extra}
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-sm text-fg-subtle">
          Sem cadastro: suas avaliações ficam salvas apenas no seu navegador.
        </p>
      </Container>
    </section>
  );
}
