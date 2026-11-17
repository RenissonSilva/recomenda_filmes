/**
 * Tipos e regras de domínio sobre pessoas (elenco, direção, criação e autores de obras originais).
 * Assim como `media.ts`, não depende de framework nem do TMDB.
 */

import type { MediaSummary, Person } from './media';

/** Como a pessoa participou de um título. */
export const CREDIT_ROLES = ['cast', 'direction', 'creation', 'original-work'] as const;
export type CreditRole = (typeof CREDIT_ROLES)[number];

/** Papéis "autorais": dirigiu o filme, criou a série ou escreveu a obra adaptada. */
export const AUTHOR_ROLES = [
  'direction',
  'creation',
  'original-work',
] as const satisfies readonly CreditRole[];

const CREDIT_ROLE_LABELS: Record<Exclude<CreditRole, 'cast'>, string> = {
  direction: 'Direção',
  creation: 'Criação',
  'original-work': 'Obra original',
};

/** Participação de uma pessoa em um título (um item por título, mesmo com vários papéis). */
export interface PersonCredit {
  media: MediaSummary;
  roles: CreditRole[];
  /** Personagens interpretados, quando o TMDB informa. */
  characters: string[];
  /** Em quantos episódios a pessoa aparece como elenco (só séries). */
  episodeCount: number | null;
}

export interface PersonDetails {
  id: number;
  name: string;
  /** Nome em outro alfabeto (ex.: japonês), quando `name` precisou ser trocado pelo latino. */
  originalName: string | null;
  profilePath: string | null;
  biography: string;
  /** Área pela qual a pessoa é conhecida, já traduzida (ex.: "Atuação"). */
  knownFor: string | null;
  birthday: string | null;
  deathday: string | null;
  placeOfBirth: string | null;
  credits: PersonCredit[];
}

/** "Outras obras de…" na página do título. */
export interface TitleAuthorWorks {
  authors: Person[];
  works: MediaSummary[];
}

/** Títulos em que a pessoa teve algum dos papéis informados, dos mais aos menos votados. */
export function getWorksByRoles(
  credits: readonly PersonCredit[],
  roles: readonly CreditRole[],
): MediaSummary[] {
  return credits
    .filter((credit) => credit.roles.some((role) => roles.includes(role)))
    .map((credit) => credit.media)
    .sort((a, b) => b.voteCount - a.voteCount);
}

/**
 * Resumo da participação exibido no card: "Joel Miller · 12 episódios", "Direção",
 * "Direção · William Munny".
 */
export function describeCredit(credit: PersonCredit): string {
  const parts = [
    ...credit.roles.flatMap((role) => (role === 'cast' ? [] : [CREDIT_ROLE_LABELS[role]])),
    ...credit.characters,
  ];
  if (credit.episodeCount) {
    parts.push(`${credit.episodeCount} ${credit.episodeCount === 1 ? 'episódio' : 'episódios'}`);
  }
  return parts.join(' · ');
}

/** Verifica se o nome tem letras do alfabeto latino (ex.: "Hajime Isayama", e não "諫山創"). */
export function hasLatinScript(name: string): boolean {
  return /\p{Script=Latin}/u.test(name);
}
