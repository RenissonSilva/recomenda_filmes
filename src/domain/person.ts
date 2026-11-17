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

export const CREDIT_ROLE_LABELS: Record<CreditRole, string> = {
  cast: 'Atuação',
  direction: 'Direção',
  creation: 'Criação',
  'original-work': 'Obra original',
};

/** Gênero informado no TMDB (pessoas sem a informação ficam com `null`). */
export const PERSON_GENDERS = ['female', 'male', 'non-binary'] as const;
export type PersonGender = (typeof PERSON_GENDERS)[number];

export const PERSON_GENDER_LABELS: Record<PersonGender, string> = {
  female: 'Feminino',
  male: 'Masculino',
  'non-binary': 'Não binário',
};

/** Participação de uma pessoa em um título (um item por título, mesmo com vários papéis). */
export interface PersonCredit {
  media: MediaSummary;
  roles: CreditRole[];
  /**
   * Data da primeira participação da pessoa no título, no formato do TMDB ("2014-03-30"):
   * a estreia do filme ou o primeiro episódio dela na série (e não a estreia da série).
   */
  date: string | null;
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
  gender: PersonGender | null;
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
  if (credit.episodeCount) parts.push(describeEpisodeCount(credit.episodeCount));
  return parts.join(' · ');
}

/** Linha de uma atuação na linha do tempo: "como Joel Miller · 12 episódios". */
export function describeCastCredit(credit: PersonCredit): string {
  const parts: string[] = [];
  if (credit.characters.length > 0) parts.push(`como ${credit.characters.join(' / ')}`);
  if (credit.episodeCount) parts.push(describeEpisodeCount(credit.episodeCount));
  return parts.join(' · ');
}

function describeEpisodeCount(count: number): string {
  return `${count} ${count === 1 ? 'episódio' : 'episódios'}`;
}

/** Títulos de um mesmo ano na linha do tempo (`year` nulo = sem data de lançamento). */
export interface CreditTimelineYear {
  year: number | null;
  credits: PersonCredit[];
}

/** Bloco da linha do tempo com os títulos de um papel (Atuação, Direção…). */
export interface CreditTimelineSection {
  role: CreditRole;
  label: string;
  count: number;
  years: CreditTimelineYear[];
}

/**
 * Linha do tempo no estilo do TMDB: um bloco por papel (na ordem de `CREDIT_ROLES`, só os que
 * a pessoa tem) e, dentro dele, os anos do mais recente ao mais antigo. Títulos sem data
 * (geralmente anunciados) vêm primeiro.
 */
export function buildCreditTimeline(credits: readonly PersonCredit[]): CreditTimelineSection[] {
  return CREDIT_ROLES.flatMap((role) => {
    const roleCredits = credits.filter((credit) => credit.roles.includes(role));
    if (roleCredits.length === 0) return [];

    const byYear = new Map<number | null, PersonCredit[]>();
    for (const credit of [...roleCredits].sort(compareByDateDesc)) {
      const year = getYear(credit.date);
      const yearCredits = byYear.get(year);
      if (yearCredits) yearCredits.push(credit);
      else byYear.set(year, [credit]);
    }

    return [
      {
        role,
        label: CREDIT_ROLE_LABELS[role],
        count: roleCredits.length,
        years: [...byYear].map(([year, yearCredits]) => ({ year, credits: yearCredits })),
      },
    ];
  });
}

/** Sem data primeiro; depois da data mais recente para a mais antiga; empates pelo título. */
function compareByDateDesc(a: PersonCredit, b: PersonCredit): number {
  if (a.date !== b.date) {
    if (!a.date) return -1;
    if (!b.date) return 1;
    return a.date < b.date ? 1 : -1;
  }
  return a.media.title.localeCompare(b.media.title, 'pt-BR');
}

/** Formato das datas do TMDB: "1975-04-02". */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

function parseDateParts(isoDate: string): { year: number; month: number; day: number } | null {
  const match = ISO_DATE.exec(isoDate);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function getYear(isoDate: string | null): number | null {
  return isoDate ? (parseDateParts(isoDate)?.year ?? null) : null;
}

/** Idade em anos completos na data informada; `null` se alguma data for inválida. */
export function getAgeOn(birthday: string, date: string): number | null {
  const birth = parseDateParts(birthday);
  const reference = parseDateParts(date);
  if (!birth || !reference) return null;

  const hadBirthday =
    reference.month > birth.month ||
    (reference.month === birth.month && reference.day >= birth.day);
  const age = reference.year - birth.year - (hadBirthday ? 0 : 1);
  return age >= 0 ? age : null;
}

/** Idade atual ou, se a pessoa já faleceu, a idade que tinha ao falecer. */
export function getPersonAge(
  person: Pick<PersonDetails, 'birthday' | 'deathday'>,
  today: string,
): number | null {
  if (!person.birthday) return null;
  return getAgeOn(person.birthday, person.deathday ?? today);
}

/** Verifica se o nome tem letras do alfabeto latino (ex.: "Hajime Isayama", e não "諫山創"). */
export function hasLatinScript(name: string): boolean {
  return /\p{Script=Latin}/u.test(name);
}
