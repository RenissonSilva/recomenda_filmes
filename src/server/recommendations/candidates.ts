import { getMediaKey, type MediaKey, type MediaSummary } from '@/domain/media';

import { RECOMMENDER_CONFIG } from './config';
import { linkStrength } from './scoring';
import type { Candidate, Seed } from './types';

/** Vínculo direto entre um candidato e uma semente, com o bônus de similaridade que ele dá. */
export interface CandidateLink {
  media: MediaSummary;
  seedKey: MediaKey;
  boost: number;
}

/** "O TMDB recomenda X a partir de S" — mais forte no topo da lista de recomendações. */
export function recommendationLinks(seeds: readonly Seed[]): CandidateLink[] {
  return seeds.flatMap((seed) =>
    seed.media.recommendations.map((media, rank, list) => ({
      media,
      seedKey: seed.key,
      boost: linkStrength(rank, list.length),
    })),
  );
}

/** "X é do mesmo diretor/criador de S" — a partir das obras de cada pessoa favorita. */
export function creatorLinks(
  seeds: readonly Seed[],
  worksByCreator: ReadonlyMap<number, readonly MediaSummary[]>,
): CandidateLink[] {
  return seeds.flatMap((seed) =>
    seed.media.creators.flatMap((creator) =>
      (worksByCreator.get(creator.id) ?? []).map((media) => ({
        media,
        seedKey: seed.key,
        boost: RECOMMENDER_CONFIG.creatorLinkBoost,
      })),
    ),
  );
}

interface CollectCandidatesInput {
  /** Títulos com vínculo direto com alguma semente. */
  links: readonly CandidateLink[];
  /** Títulos extras, sem vínculo direto (ex.: melhores dos gêneros favoritos). */
  extra: readonly MediaSummary[];
  isEligible: (media: MediaSummary, key: MediaKey) => boolean;
}

/** Reúne os candidatos elegíveis, guardando o vínculo mais forte com cada semente. */
export function collectCandidates({
  links,
  extra,
  isEligible,
}: CollectCandidatesInput): Candidate[] {
  const candidates = new Map<MediaKey, Candidate>();

  const upsert = (media: MediaSummary): Candidate | null => {
    const key = getMediaKey(media);
    if (!isEligible(media, key)) return null;

    let candidate = candidates.get(key);
    if (!candidate) {
      candidate = { key, media, linkBoosts: new Map() };
      candidates.set(key, candidate);
    }
    return candidate;
  };

  for (const { media, seedKey, boost } of links) {
    const candidate = upsert(media);
    if (!candidate) continue;
    candidate.linkBoosts.set(seedKey, Math.max(candidate.linkBoosts.get(seedKey) ?? 0, boost));
  }

  for (const media of extra) upsert(media);

  return [...candidates.values()];
}
