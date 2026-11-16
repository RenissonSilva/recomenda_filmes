import { TmdbImage } from '@/components/media/tmdb-image';
import type { WatchProvider, WatchProviders } from '@/domain/media';

import { TitleSection } from './title-section';

function ProviderList({ label, providers }: { label: string; providers: WatchProvider[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">{label}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {providers.map((provider) => (
          <li key={provider.id} title={provider.name}>
            {provider.logoPath ? (
              <TmdbImage
                path={provider.logoPath}
                alt={provider.name}
                width={44}
                height={44}
                className="rounded-lg ring-1 ring-white/10"
              />
            ) : (
              <span className="inline-flex h-11 items-center rounded-lg bg-surface-2 px-3 text-xs">
                {provider.name}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Onde assistir" no Brasil (dados da JustWatch, fornecidos pelo TMDB). */
export function WatchProvidersSection({ providers }: { providers: WatchProviders | null }) {
  if (!providers) return null;

  const groups = [
    { label: 'Streaming', providers: providers.streaming },
    { label: 'Alugar', providers: providers.rent },
    { label: 'Comprar', providers: providers.buy },
  ].filter((group) => group.providers.length > 0);

  return (
    <TitleSection id="watch-providers" title="Onde assistir no Brasil">
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-12">
        {groups.map((group) => (
          <ProviderList key={group.label} label={group.label} providers={group.providers} />
        ))}
      </div>
      <p className="text-xs text-fg-subtle">
        Disponibilidade fornecida pela JustWatch.{' '}
        {providers.link && (
          <a
            href={providers.link}
            target="_blank"
            rel="noreferrer"
            className="rounded underline underline-offset-2 focus-ring hover:text-fg"
          >
            Ver todas as opções
          </a>
        )}
      </p>
    </TitleSection>
  );
}
