import 'server-only';

import { cacheLife } from 'next/cache';

import {
  getMediaKey,
  getTitleAuthors,
  isAnime,
  type MediaDetails,
  type MediaType,
  type Person,
} from '@/domain/media';
import { AUTHOR_ROLES, getWorksByRoles, type TitleAuthorWorks } from '@/domain/person';
import { uniqueBy } from '@/lib/array';

import { getPersonDetails, getTitleDetails, getTvOriginalAuthors } from '../tmdb/catalog';

/** Limite de autores por título (há filmes com vários diretores, ex.: antologias). */
const MAX_AUTHORS = 3;

/**
 * "Outras obras de…": tudo o que os autores do título dirigiram, criaram ou escreveram
 * (veja `getTitleAuthors`), sem o próprio título. `null` quando não há autor ou outras obras.
 */
export async function getTitleAuthorWorks(
  mediaType: MediaType,
  id: number,
): Promise<TitleAuthorWorks | null> {
  'use cache';
  cacheLife('days');

  const details = await getTitleDetails(mediaType, id);
  if (!details) return null;

  const authors = (await findAuthors(details)).slice(0, MAX_AUTHORS);
  const people = (await Promise.all(authors.map((author) => getPersonDetails(author.id)))).filter(
    (person) => person !== null,
  );

  const titleKey = getMediaKey(details);
  const works = uniqueBy(
    people.flatMap((person) => getWorksByRoles(person.credits, AUTHOR_ROLES)),
    getMediaKey,
  ).filter((media) => getMediaKey(media) !== titleKey);

  if (works.length === 0) return null;

  const roleById = new Map(authors.map((author) => [author.id, author.role]));
  return {
    // Os dados da pessoa trazem o nome já em alfabeto latino ("Hajime Isayama", e não "諫山創").
    authors: people.map((person) => ({
      id: person.id,
      name: person.name,
      profilePath: person.profilePath,
      role: roleById.get(person.id) ?? null,
    })),
    works,
  };
}

/**
 * Os créditos comuns de uma série trazem só a equipe da temporada mais recente: quando o autor
 * da obra original faz falta (anime ou série sem criador), ele é buscado em todas as temporadas.
 */
async function findAuthors(details: MediaDetails): Promise<Person[]> {
  const authors = getTitleAuthors(details);
  const missingOriginalAuthors =
    details.mediaType === 'tv' &&
    details.originalAuthors.length === 0 &&
    (isAnime(details) || authors.length === 0);

  if (!missingOriginalAuthors) return authors;
  return getTitleAuthors({
    ...details,
    originalAuthors: await getTvOriginalAuthors(details.id),
  });
}
